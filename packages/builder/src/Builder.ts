import path from "path"
import fs from "fs/promises"
import { createPatch } from "diff"
import { ProjectIndex, ResolveImport, Module } from "@/ProjectIndex"
import { parseFile, parseSource } from "@/parse"
import { Bundler, FileLookup } from "@/Bundler"
import { Runner, VmRunner } from "@/Runner"
import dedent from "dedent"
import { StyleExtractor } from "@/extractors/StyleExtractor"
import { StyleGenerator } from "@/generators/StyleGenerator"
import { MochiError, OnDiagnostic, getErrorMessage } from "@/diagnostics"
import { findAllFiles } from "@/findAllFiles"
import { getExtractorId, extractRelevantSymbols } from "@/extractRelevantSymbols"
import { wrapIndexWithProxies } from "@/AstProxy"

export type AnalysisContext = {
    onDiagnostic?: OnDiagnostic
}

export type AstPostProcessor = (index: ProjectIndex, context: AnalysisContext) => void | Promise<void>

const rootFileSuffix = dedent`
    declare global {
        const extractors: Record<string, (source: string, ...args: any[]) => Record<string, any>>
    }
`

export type CollectCssOptions = {
    onDep?: (path: string) => void
}

export type RootEntry = string | { path: string; package: string }

/**
 * Options for constructing a {@link Builder}.
 *
 * When used via an integration (Vite, PostCSS, Next.js), most of these fields are sourced
 * from `mochi.config.ts` via `resolveConfig` — you typically only need to supply `bundler`
 * and `runner` explicitly.
 */
export type BuilderOptions = {
    /** Directories (or named root entries) scanned recursively for `.ts`/`.tsx` source files. */
    roots: RootEntry[]
    /** Style extractors that identify and capture style function calls. Use `defaultExtractors` for vanilla Mochi CSS. */
    extractors: StyleExtractor[]
    /**
     * Bundler used to bundle the extracted minimal source code into a single executable module.
     * Use `RolldownBundler` unless you need a custom bundler.
     */
    bundler: Bundler
    /**
     * Runner used to execute the bundled code in an isolated context.
     * Use `VmRunner` unless you need a custom runner.
     */
    runner: Runner
    /** When `true`, CSS is split per source file instead of merged into one global output. Default: `false`. */
    splitCss?: boolean
    /** Callback invoked for warnings and non-fatal errors during extraction. */
    onDiagnostic?: OnDiagnostic
    /** Preprocessing hook that runs on every loaded file before parsing. */
    filePreProcess?(params: { content: string; filePath: string }): string | Promise<string>
    /** Handlers that run after analysis, before CSS generation. Each handler may mutate AST nodes via a proxy layer. */
    astPostProcessors?: AstPostProcessor[]
}

/**
 * Orchestrates the full Mochi CSS extraction pipeline:
 * scan source files → build dependency graph → extract style call arguments
 * → bundle → execute → generate CSS.
 *
 * Use {@link Builder.collectMochiCss} for the common case of getting CSS strings directly.
 * Use {@link Builder.collectMochiStyles} when you need the raw generators before CSS is produced.
 * Use {@link Builder.collectStylesFromModules} to supply pre-parsed modules (useful in tests).
 */
export class Builder {
    constructor(private options: BuilderOptions) {}

    private async preTransformFile(content: string, filePath: string): Promise<string> {
        return this.options.filePreProcess ? await this.options.filePreProcess({ content, filePath }) : content
    }

    private async bundleFiles(files: Record<string, string | null>) {
        // Prepare extracted project
        const tmp = path.resolve(process.cwd(), ".mochi")
        const rootPath = path.join(tmp, "__mochi-css__.ts")

        const paths: string[] = []
        const fileLookup: FileLookup = {}

        for (const [filename, source] of Object.entries(files)) {
            if (source === null) continue
            const relativePath = path.relative(process.cwd(), filename)
            paths.push(relativePath.replaceAll(path.win32.sep, path.posix.sep))

            const filePath = path.join(tmp, relativePath)
            fileLookup[filePath] = source
        }
        const rootImports = paths.map((f) => `import "./${f}"`).join("\n")

        fileLookup[rootPath] = [rootImports, rootFileSuffix].join("\n\n")

        // Bundle into single file
        try {
            return await this.options.bundler.bundle(rootPath, fileLookup)
        } catch (err) {
            const message = getErrorMessage(err)
            throw new MochiError("MOCHI_BUNDLE", message, undefined, err)
        }
    }

    private async executeCode(code: string, generators: Map<string, StyleGenerator>) {
        const onDiagnostic = this.options.onDiagnostic
        const runner = new VmRunner()

        const wrapGenerator = (
            generator: StyleGenerator,
        ): ((source: string, ...args: unknown[]) => Record<string, unknown>) => {
            return (source: string, ...args: unknown[]) => {
                try {
                    const subGenerators = generator.collectArgs(source, args)
                    const result: Record<string, unknown> = {}
                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    for (const [name, subGen] of Object.entries(subGenerators ?? {})) {
                        result[name] = wrapGenerator(subGen)
                    }
                    return result
                } catch (err) {
                    const message = getErrorMessage(err)
                    onDiagnostic?.({
                        code: "MOCHI_EXEC",
                        message: `Failed to collect styles: ${message}`,
                        severity: "warning",
                        file: source,
                    })
                    return {}
                }
            }
        }

        const extractorsObj: Record<string, (source: string, ...args: unknown[]) => Record<string, unknown>> = {}
        for (const [id, generator] of generators) {
            extractorsObj[id] = wrapGenerator(generator)
        }

        try {
            await runner.execute(code, { extractors: extractorsObj })
        } catch (err) {
            const message = getErrorMessage(err)
            throw new MochiError("MOCHI_EXEC", message, undefined, err)
        }
    }

    public async collectStylesFromModules(modules: Module[]) {
        // Create a set of known file paths for resolving imports
        const knownFiles = new Set(modules.map((m) => m.filePath))

        // Build a map from package name to absolute source directory for named roots
        const packageMap = new Map<string, string>()
        for (const root of this.options.roots) {
            if (typeof root !== "string") {
                packageMap.set(root.package, path.resolve(root.path))
            }
        }

        const resolveImport: ResolveImport = (fromFile, importSource) => {
            const dir = path.dirname(fromFile)
            // Try common extensions
            const extensions = ["", ".ts", ".tsx", ".js", ".jsx"]
            for (const ext of extensions) {
                const resolved = path.resolve(dir, importSource + ext)
                if (knownFiles.has(resolved)) {
                    return resolved
                }
            }
            // Try index files
            for (const ext of [".ts", ".tsx", ".js", ".jsx"]) {
                const resolved = path.resolve(dir, importSource, "index" + ext)
                if (knownFiles.has(resolved)) {
                    return resolved
                }
            }
            // Try package-name resolution for named roots
            for (const [pkgName, sourceDir] of packageMap) {
                if (importSource === pkgName || importSource.startsWith(pkgName + "/")) {
                    const subPath = importSource.slice(pkgName.length)
                    const base = path.resolve(sourceDir, subPath.replace(/^\//, "") || "index")
                    for (const ext of ["", ".ts", ".tsx", ".js", ".jsx"]) {
                        const resolved = base + ext
                        if (knownFiles.has(resolved)) return resolved
                    }
                    for (const ext of [".ts", ".tsx", ".js", ".jsx"]) {
                        const resolved = path.resolve(sourceDir, subPath.replace(/^\//, ""), "index" + ext)
                        if (knownFiles.has(resolved)) return resolved
                    }
                }
            }
            return null
        }

        const onDiagnostic = this.options.onDiagnostic
        const index = new ProjectIndex(modules, this.options.extractors, resolveImport, onDiagnostic)
        index.discoverCrossFileDerivedExtractors()
        index.propagateUsages()

        for (const handler of this.options.astPostProcessors ?? []) {
            const proxied = wrapIndexWithProxies(index)
            await handler(index, { onDiagnostic })
            const dirtyFiles = proxied.getDirtyFiles()
            if (dirtyFiles.size === 0) continue
            index.reanalyzeFiles(dirtyFiles)
            index.resetCrossFileState()
            index.discoverCrossFileDerivedExtractors()
            index.propagateUsages()
        }

        const resultingFiles = extractRelevantSymbols(index)

        // Create a generator for each extractor
        const generators = new Map<string, StyleGenerator>()
        for (const extractor of this.options.extractors) {
            const id = getExtractorId(extractor)
            generators.set(id, extractor.startGeneration(onDiagnostic))
        }

        const code = await this.bundleFiles(resultingFiles)
        await this.executeCode(code, generators)

        return generators
    }

    public async collectMochiStyles(onDep?: (path: string) => void) {
        const rootPaths = this.options.roots.map((r) => (typeof r === "string" ? r : r.path))
        const fileArrays = await Promise.all(rootPaths.map(findAllFiles))
        const files = fileArrays.flat()

        if (onDep) {
            for (const file of files) {
                onDep(file)
            }
        }

        const sourcemods: Record<string, string> = {}

        const modules = await Promise.all(
            files.map(async (filePath) => {
                const source = await fs.readFile(filePath, "utf8")
                const transformed = await this.preTransformFile(source, filePath)
                if (transformed !== source) {
                    sourcemods[filePath] = createPatch(filePath, source, transformed)
                }
                return transformed === source ? parseFile(filePath) : parseSource(transformed, filePath)
            }),
        )

        const generators = await this.collectStylesFromModules(modules)
        return { generators, sourcemods }
    }

    public async collectMochiCss(
        options?: CollectCssOptions,
    ): Promise<{ global?: string; files?: Record<string, string>; sourcemods?: Record<string, string> }> {
        const { generators, sourcemods } = await this.collectMochiStyles(options?.onDep)

        // Collect and merge results from all generators
        const globalCss: string[] = []
        const files: Record<string, string> = {}

        for (const generator of generators.values()) {
            const result = await generator.generateStyles()
            if (result.global) {
                globalCss.push(result.global)
            }
            if (result.files) {
                for (const [source, css] of Object.entries(result.files)) {
                    files[source] = files[source] ? `${files[source]}\n\n${css}` : css
                }
            }
        }

        const resultSourcemods = Object.keys(sourcemods).length > 0 ? sourcemods : undefined

        if (!this.options.splitCss) {
            // Merge files into global CSS
            const allCss = [...globalCss]
            const sortedFiles = Object.keys(files).sort()
            for (const key of sortedFiles) {
                const css = files[key]
                if (css) allCss.push(css)
            }
            return {
                global: allCss.length > 0 ? allCss.join("\n\n") : undefined,
                sourcemods: resultSourcemods,
            }
        }

        return {
            global: globalCss.length > 0 ? globalCss.join("\n\n") : undefined,
            files: Object.keys(files).length > 0 ? files : undefined,
            sourcemods: resultSourcemods,
        }
    }
}
