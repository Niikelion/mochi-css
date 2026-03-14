import path from "path"
import fs from "fs/promises"
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

const rootFileSuffix = dedent`
    declare global {
        const extractors: Record<string, (source: string, ...args: any[]) => Record<string, any>>
    }
`

export type CollectCssOptions = {
    onDep?: (path: string) => void
}

export type RootEntry = string | { path: string; package: string }

export type EsbuildBuild = {
    onLoad(
        options: { filter: RegExp; namespace?: string },
        callback: (args: {
            path: string
        }) =>
            | Promise<{ contents: string; loader?: string } | undefined>
            | { contents: string; loader?: string }
            | undefined,
    ): void
    onResolve(options: { filter: RegExp; namespace?: string }, callback: (args: unknown) => unknown): void
}

export type EsbuildPlugin = {
    name: string
    setup(build: EsbuildBuild): void | Promise<void>
}

export type BuilderOptions = {
    roots: RootEntry[]
    extractors: StyleExtractor[]
    bundler: Bundler
    runner: Runner
    splitBySource?: boolean
    onDiagnostic?: OnDiagnostic
    esbuildPlugins?: EsbuildPlugin[]
}

export class Builder {
    constructor(private options: BuilderOptions) {}

    private loadHandlers:
        | {
              filter: RegExp
              callback: (args: {
                  path: string
              }) =>
                  | Promise<{ contents: string; loader?: string } | undefined>
                  | { contents: string; loader?: string }
                  | undefined
          }[]
        | undefined

    private async getLoadHandlers() {
        if (this.loadHandlers) return this.loadHandlers
        this.loadHandlers = []
        for (const plugin of this.options.esbuildPlugins ?? []) {
            await plugin.setup({
                onLoad: (opts, cb) => {
                    this.loadHandlers?.push({ filter: opts.filter, callback: cb })
                },
                onResolve: () => {
                    /* empty */
                },
            })
        }
        return this.loadHandlers
    }

    private async applyPlugins(source: string, filePath: string): Promise<string> {
        const handlers = await this.getLoadHandlers()
        for (const { filter, callback } of handlers) {
            if (!filter.test(filePath)) continue
            const result = await callback({ path: filePath })
            if (result?.contents !== undefined) return result.contents
        }
        return source
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

        const modules = await Promise.all(
            files.map(async (filePath) => {
                const source = await fs.readFile(filePath, "utf8")
                const transformed = await this.applyPlugins(source, filePath)
                return transformed === source ? parseFile(filePath) : parseSource(transformed, filePath)
            }),
        )

        return await this.collectStylesFromModules(modules)
    }

    public async collectMochiCss(
        options?: CollectCssOptions,
    ): Promise<{ global?: string; files?: Record<string, string> }> {
        const generators = await this.collectMochiStyles(options?.onDep)

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

        if (!this.options.splitBySource) {
            // Merge files into global CSS
            const allCss = [...globalCss]
            const sortedFiles = Object.keys(files).sort()
            for (const key of sortedFiles) {
                const css = files[key]
                if (css) allCss.push(css)
            }
            return {
                global: allCss.length > 0 ? allCss.join("\n\n") : undefined,
            }
        }

        return {
            global: globalCss.length > 0 ? globalCss.join("\n\n") : undefined,
            files: Object.keys(files).length > 0 ? files : undefined,
        }
    }
}
