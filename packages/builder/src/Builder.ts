import path from "path"
import fs from "fs/promises"
import * as SWC from "@swc/core"
import { createPatch } from "diff"
import { ProjectIndex, ResolveImport, Module } from "@/ProjectIndex"
import type { StageDefinition } from "@/analysis/Stage"
import { parseFile, parseSource } from "@/parse"
import { Bundler, FileLookup } from "@/Bundler"
import { Runner } from "@/Runner"
import dedent from "dedent"
import { MochiError, OnDiagnostic, getErrorMessage } from "@/diagnostics"
import { findAllFiles } from "@/findAllFiles"
import { extractRelevantSymbols } from "@/extractRelevantSymbols"
import { wrapIndexWithProxies } from "@/AstProxy"
import { Evaluator } from "@/Evaluator"

export type AnalysisContext = {
    onDiagnostic?: OnDiagnostic
    evaluator: Evaluator
    emitChunk(path: string, content: string): void
    markForEval(filePath: string, expression: SWC.Expression): void
}

export type AstPostProcessor = (index: ProjectIndex, context: AnalysisContext) => void | Promise<void>

export type EmitHook = (index: ProjectIndex, context: AnalysisContext) => void | Promise<void>

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
    /** Handlers that run after analysis, before evaluation. Each handler may mutate AST nodes via a proxy layer. Mutations persist in the canonical index and are visible to postEvalTransforms. Can call evaluator.valueWithTracking() to mark expressions for capture. */
    sourceTransforms?: AstPostProcessor[]
    /** Handlers that run on a deep copy of the source ASTs, used only for bundling and evaluation. Mutations do NOT persist in the canonical index and are NOT visible to postEvalTransforms. */
    preEvalTransforms?: AstPostProcessor[]
    /** Handlers that run after code execution. The evaluator is populated — use evaluator.getTrackedValue() to read back runtime values. Receives the canonical index (unaffected by preEvalTransforms). */
    postEvalTransforms?: AstPostProcessor[]
    /** Hooks that run after postEvalTransforms. Call context.emitChunk() to emit files into emitDir. */
    emitHooks?: EmitHook[]
    /** Base directory for files produced via context.emitChunk(). */
    emitDir?: string
    /** Called once at the end of the pipeline. Use to release any caches built between sourceTransforms and postEvalTransforms. */
    cleanup?: () => void | Promise<void>
    /** Analysis stages to run. Pass stages from createExtractorsPlugin() here — they carry the extractor configuration. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stages?: readonly StageDefinition<any[], any>[]
}

/**
 * Orchestrates the full Mochi CSS extraction pipeline:
 * scan source files → build dependency graph → extract style call arguments
 * → bundle → execute → generate CSS.
 *
 * Use {@link Builder.collectMochiCss} for the common case of getting CSS strings directly.
 * Use {@link Builder.collectStylesFromModules} to supply pre-parsed modules (useful in tests).
 */
export class Builder {
    constructor(private options: BuilderOptions) {}

    private async preTransformFile(content: string, filePath: string): Promise<string> {
        return this.options.filePreProcess ? await this.options.filePreProcess({ content, filePath }) : content
    }

    private buildResolveImport(modules: Module[]): ResolveImport {
        const knownFiles = new Set(modules.map((m) => m.filePath))

        const packageMap = new Map<string, string>()
        for (const root of this.options.roots) {
            if (typeof root !== "string") {
                packageMap.set(root.package, path.resolve(root.path))
            }
        }

        return (fromFile, importSource) => {
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
    }

    private async buildEvalIndex(
        modules: Module[],
        index: ProjectIndex,
        resolveImport: ResolveImport,
        context: AnalysisContext,
        markedForEval: Map<string, Set<SWC.Expression>>,
    ): Promise<ProjectIndex> {
        if ((this.options.preEvalTransforms ?? []).length === 0) return index

        const evalModules = modules.map((m) => ({ ...m, ast: structuredClone(m.ast) }))
        const evalIndex = new ProjectIndex(
            evalModules,
            this.options.stages ?? [],
            resolveImport,
            this.options.onDiagnostic,
        )

        for (const handler of this.options.preEvalTransforms ?? []) {
            evalIndex.discoverCrossFileDerivedExtractors()
            evalIndex.propagateUsages(markedForEval)
            const proxied = wrapIndexWithProxies(evalIndex)
            await handler(evalIndex, context)
            const dirtyFiles = proxied.getDirtyFiles()
            if (dirtyFiles.size === 0) continue
            evalIndex.reanalyzeFiles(dirtyFiles)
            evalIndex.resetCrossFileState()
        }
        evalIndex.discoverCrossFileDerivedExtractors()
        evalIndex.propagateUsages(markedForEval)
        return evalIndex
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

    private async executeCode(code: string, evaluator: Evaluator) {
        try {
            await evaluator.evaluate(code)
        } catch (err) {
            const message = getErrorMessage(err)
            throw new MochiError("MOCHI_EXEC", message, undefined, err)
        }
    }

    public async collectStylesFromModules(modules: Module[]): Promise<Map<string, Set<string>>> {
        const resolveImport = this.buildResolveImport(modules)
        const onDiagnostic = this.options.onDiagnostic
        const index = new ProjectIndex(modules, this.options.stages ?? [], resolveImport, onDiagnostic)
        const evaluator = new Evaluator(this.options.runner)
        const chunks = new Map<string, Set<string>>()
        const markedForEval = new Map<string, Set<SWC.Expression>>()

        const context: AnalysisContext = {
            onDiagnostic,
            evaluator,
            emitChunk(filePath: string, content: string) {
                let set = chunks.get(filePath)
                if (!set) {
                    set = new Set()
                    chunks.set(filePath, set)
                }
                set.add(content)
            },
            markForEval(filePath: string, expression: SWC.Expression) {
                let set = markedForEval.get(filePath)
                if (!set) {
                    set = new Set()
                    markedForEval.set(filePath, set)
                }
                set.add(expression)
            },
        }

        for (const handler of this.options.sourceTransforms ?? []) {
            index.discoverCrossFileDerivedExtractors()
            index.propagateUsages(markedForEval)
            const proxied = wrapIndexWithProxies(index)
            await handler(index, context)
            const dirtyFiles = proxied.getDirtyFiles()
            if (dirtyFiles.size === 0) continue
            index.reanalyzeFiles(dirtyFiles)
            index.resetCrossFileState()
        }
        index.discoverCrossFileDerivedExtractors()
        index.propagateUsages(markedForEval)

        const indexForEval = await this.buildEvalIndex(modules, index, resolveImport, context, markedForEval)

        const resultingFiles = extractRelevantSymbols(indexForEval, markedForEval)

        const code = await this.bundleFiles(resultingFiles)
        await this.executeCode(code, evaluator)

        for (const handler of this.options.postEvalTransforms ?? []) {
            await handler(index, context)
        }

        for (const hook of this.options.emitHooks ?? []) {
            await hook(index, context)
        }

        if (this.options.emitDir) {
            const chunkFiles: Record<string, string> = {}
            for (const [relPath, contentSet] of chunks) {
                chunkFiles[relPath] = [...contentSet].join("\n\n")
            }
            await this.syncEmittedFiles(this.options.emitDir, chunkFiles)
        }

        await this.options.cleanup?.()

        return chunks
    }

    private async syncEmittedFiles(emitDir: string, files: Record<string, string | null>): Promise<void> {
        await fs.mkdir(emitDir, { recursive: true })

        const manifestPath = path.join(emitDir, ".mochi-emit.json")
        let previousPaths: string[] = []
        try {
            const manifestContent = await fs.readFile(manifestPath, "utf8")
            previousPaths = JSON.parse(manifestContent) as string[]
        } catch {
            // No manifest yet — first run
        }

        const newPaths: string[] = []

        for (const [relPath, content] of Object.entries(files)) {
            const absPath = path.resolve(emitDir, relPath)
            if (content === null) {
                try {
                    await fs.unlink(absPath)
                } catch {
                    // already gone
                }
            } else {
                await fs.mkdir(path.dirname(absPath), { recursive: true })
                let existing: string | undefined
                try {
                    existing = await fs.readFile(absPath, "utf8")
                } catch {
                    // doesn't exist yet
                }
                if (existing !== content) {
                    await fs.writeFile(absPath, content, "utf8")
                }
                newPaths.push(relPath)
            }
        }

        // Delete files from previous run that are no longer present
        for (const prevPath of previousPaths) {
            if (!(prevPath in files)) {
                const absPath = path.resolve(emitDir, prevPath)
                try {
                    await fs.unlink(absPath)
                } catch {
                    // already gone
                }
            }
        }

        await fs.writeFile(manifestPath, JSON.stringify(newPaths), "utf8")
    }

    public async collectMochiCss(
        options?: CollectCssOptions,
    ): Promise<{ global?: string; files?: Record<string, string>; sourcemods?: Record<string, string> }> {
        const rootPaths = this.options.roots.map((r) => (typeof r === "string" ? r : r.path))
        const fileArrays = await Promise.all(rootPaths.map(findAllFiles))
        const allFiles = fileArrays.flat()

        for (const file of allFiles) {
            options?.onDep?.(file)
        }

        const sourcemods: Record<string, string> = {}
        const modules = await Promise.all(
            allFiles.map(async (filePath) => {
                const source = await fs.readFile(filePath, "utf8")
                const transformed = await this.preTransformFile(source, filePath)
                if (transformed !== source) {
                    sourcemods[filePath] = createPatch(filePath, source, transformed)
                }
                return transformed === source ? parseFile(filePath) : parseSource(transformed, filePath)
            }),
        )

        const chunks = await this.collectStylesFromModules(modules)

        const globalCss: string[] = []
        const filesCss: Record<string, string> = {}
        for (const [chunkPath, contentSet] of chunks) {
            const content = [...contentSet].join("\n\n")
            if (chunkPath === "global.css") {
                globalCss.push(content)
            } else {
                filesCss[chunkPath] = filesCss[chunkPath] ? `${filesCss[chunkPath]}\n\n${content}` : content
            }
        }

        const resultSourcemods = Object.keys(sourcemods).length > 0 ? sourcemods : undefined

        if (!this.options.splitCss) {
            const allCss = [...globalCss]
            const sortedFiles = Object.keys(filesCss).sort()
            for (const key of sortedFiles) {
                const css = filesCss[key]
                if (css) allCss.push(css)
            }
            return {
                global: allCss.length > 0 ? allCss.join("\n\n") : undefined,
                sourcemods: resultSourcemods,
            }
        }

        return {
            global: globalCss.length > 0 ? globalCss.join("\n\n") : undefined,
            files: Object.keys(filesCss).length > 0 ? filesCss : undefined,
            sourcemods: resultSourcemods,
        }
    }
}
