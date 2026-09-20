import { path, resolveCandidates } from "@/utils"
import fs from "fs/promises"
import * as SWC from "@swc/core"
import * as csstree from "css-tree"
import type * as CssTree from "css-tree"
import { StageRunner, Module, ResolveImport } from "@/StageRunner"
import type { StageDefinition } from "@/analysis/Stage"
import { parseFile, parseSource } from "@/parse"
import { Bundler, FileLookup } from "@/Bundler"
import { Runner } from "@/Runner"
import dedent from "dedent"
import { MochiError, OnDiagnostic, getErrorMessage } from "@mochi-css/core"
import { findAllFiles } from "@/findAllFiles"
import { wrapFilesWithProxies, MutableFileEntry } from "@/AstProxy"
import { Evaluator } from "@/Evaluator"
import { buildPreprocessMap, composeWithPreprocessMap } from "@/sourcemap"

type CssAstEntry = { originalCss: string; ast: CssTree.StyleSheet; wasMutated: boolean }

export type PostProcessContext = {
    readonly cssAstChunks: Map<string, CssAstEntry>
    markFileDirty(filePath: string): void
}

export type PostProcessHook = (runner: StageRunner, ctx: PostProcessContext) => void | Promise<void>

export type AnalysisContext = {
    onDiagnostic?: OnDiagnostic
    evaluator: Evaluator
    emitChunk(path: string, content: string): void
    markForEval(filePath: string, expression: SWC.Expression): void
    /** @deprecated Mutate the file's AST directly and call markJsMutated() instead. */
    emitModifiedSource(filePath: string, code: string): void
    emitCssAst(path: string, originalCss: string, ast: CssTree.StyleSheet): void
    /** Mark a JS file whose AST was mutated for serialization after all postProcessHooks have run. */
    markJsMutated(filePath: string): void
}

export type AstPostProcessor = (runner: StageRunner, context: AnalysisContext) => void | Promise<void>

export type EmitHook = (runner: StageRunner, context: AnalysisContext) => void | Promise<void>

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
    onDiagnostic: OnDiagnostic
    /** Preprocessing hook that runs on every loaded file before parsing. */
    filePreProcess?(params: { content: string; filePath: string }): string | Promise<string>
    /** Handlers that run after analysis, before evaluation. Each handler may mutate AST nodes via a proxy layer. Mutations persist in the canonical index and are visible to postEvalTransforms. Can call evaluator.valueWithTracking() to mark expressions for capture. */
    sourceTransforms?: AstPostProcessor[]
    /** Handlers that run on a deep copy of the source ASTs, used only for bundling and evaluation. Mutations do NOT persist in the canonical index and are NOT visible to postEvalTransforms. */
    preEvalTransforms?: AstPostProcessor[]
    /** Handlers that run after code execution. The evaluator is populated — use evaluator.getTrackedValue() to read back runtime values. Receives the canonical index (unaffected by preEvalTransforms). */
    postEvalTransforms?: AstPostProcessor[]
    /** Hooks that run after postEvalTransforms. Call context.emitCssAst() to emit CSS ASTs for deferred serialization. */
    emitHooks?: EmitHook[]
    /** Hooks that run after emitHooks, before JS and CSS serialization. Receives mutable CSS ASTs. Call markFileDirty() to re-serialize additional JS files beyond those already scheduled via deferJsEmit(). */
    postProcessHooks?: PostProcessHook[]
    /** Base directory for files produced via context.emitChunk(). */
    emitDir?: string
    /** Called once at the end of the pipeline. Use to release any caches built between sourceTransforms and postEvalTransforms. */
    cleanup?: () => void | Promise<void>
    /** Analysis stages to run. Pass stages from createExtractorsPlugin() here — they carry the extractor configuration. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stages?: readonly StageDefinition<any[], any>[]

    // --- Plugin-registered hooks ---

    /** Called after the StageRunner is created — allows accessing and configuring stage instances. */
    initializeStages?: (runner: StageRunner) => void

    /** Called before each analysis pass. Should run discovery + usage propagation. */
    prepareAnalysis?: (runner: StageRunner, markedForEval: Map<string, Set<SWC.Expression>>) => void

    /** Returns mutable file entries (with live AST references) for proxy-based dirty detection. */
    getFileData?: (runner: StageRunner) => MutableFileEntry[]

    /** Called when files are dirtied after a transform pass — should invalidate stage caches. */
    invalidateFiles?: (runner: StageRunner, dirtyFiles: Set<string>) => void

    /** Called to reset the cross-file state (e.g., after invalidation). */
    resetCrossFileState?: (runner: StageRunner) => void

    /** Called to produce the minimal source files to bundle. Returns null for files to skip. */
    getFilesToBundle?: (
        runner: StageRunner,
        markedForEval: Map<string, Set<SWC.Expression>>,
    ) => Record<string, string | null>

    /** When `true`, logs extra information (e.g., bundled code on execution failure) to help diagnose issues. */
    debug?: boolean

    /** Specifies the path to the ts config for the project */
    tsConfigPath?: string
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
        // Module filePaths may arrive with either separator (tests on Windows using node:path
        // produce backslashes; the pipeline's own path.resolve produces posix). Look up under a
        // posix-normalized index but return the module's ORIGINAL filePath — every downstream
        // stage keys on that shape and must see it unchanged.
        const knownFilesByPosix = new Map<string, string>()
        for (const m of modules) {
            knownFilesByPosix.set(path.fromSystemPath(m.filePath), m.filePath)
        }
        const lookup = (resolved: string): string | null => knownFilesByPosix.get(path.fromSystemPath(resolved)) ?? null

        const packageMap = new Map<string, string>()
        for (const root of this.options.roots) {
            if (typeof root !== "string") {
                packageMap.set(root.package, path.resolve(root.path))
            }
        }

        return (fromFile, importSource) => {
            const dir = path.dirname(fromFile)
            for (const candidate of resolveCandidates(importSource)) {
                // Try common extensions
                for (const ext of ["", ".ts", ".tsx", ".js", ".jsx"]) {
                    const hit = lookup(path.resolve(dir, candidate + ext))
                    if (hit !== null) return hit
                }
                // Try index files
                for (const ext of [".ts", ".tsx", ".js", ".jsx"]) {
                    const hit = lookup(path.resolve(dir, candidate, "index" + ext))
                    if (hit !== null) return hit
                }
            }
            // Try package-name resolution for named roots
            for (const [pkgName, sourceDir] of packageMap) {
                if (importSource === pkgName || importSource.startsWith(pkgName + "/")) {
                    const subPath = importSource.slice(pkgName.length).replace(/^\//, "") || "index"
                    for (const candidate of resolveCandidates(subPath)) {
                        const base = path.resolve(sourceDir, candidate)
                        for (const ext of ["", ".ts", ".tsx", ".js", ".jsx"]) {
                            const hit = lookup(base + ext)
                            if (hit !== null) return hit
                        }
                        for (const ext of [".ts", ".tsx", ".js", ".jsx"]) {
                            const hit = lookup(path.resolve(sourceDir, candidate, "index" + ext))
                            if (hit !== null) return hit
                        }
                    }
                }
            }
            return null
        }
    }

    private createRunner(modules: Module[], resolveImport: ResolveImport): StageRunner {
        const runner = new StageRunner(modules, this.options.stages ?? [], this.options.onDiagnostic, resolveImport)
        this.options.initializeStages?.(runner)
        return runner
    }

    private runAnalysisPass(runner: StageRunner, markedForEval: Map<string, Set<SWC.Expression>>): void {
        this.options.prepareAnalysis?.(runner, markedForEval)
    }

    private async buildEvalRunner(
        modules: Module[],
        runner: StageRunner,
        resolveImport: ResolveImport,
        context: AnalysisContext,
        markedForEval: Map<string, Set<SWC.Expression>>,
    ): Promise<StageRunner> {
        if ((this.options.preEvalTransforms ?? []).length === 0) return runner

        const evalModules = modules.map((m) => ({ ...m, ast: structuredClone(m.ast) }))
        const evalRunner = this.createRunner(evalModules, resolveImport)

        for (const handler of this.options.preEvalTransforms ?? []) {
            this.runAnalysisPass(evalRunner, markedForEval)
            const fileData = this.options.getFileData?.(evalRunner) ?? []
            const proxied = wrapFilesWithProxies(fileData)
            await handler(evalRunner, context)
            const dirtyFiles = proxied.getDirtyFiles()
            if (dirtyFiles.size === 0) continue
            this.options.invalidateFiles?.(evalRunner, dirtyFiles)
            this.options.resetCrossFileState?.(evalRunner)
        }
        this.runAnalysisPass(evalRunner, markedForEval)
        return evalRunner
    }

    private async bundleFiles(files: Record<string, string | null>) {
        // Prepare extracted project
        const cwd = path.fromSystemPath(process.cwd())
        const tmp = path.resolve(cwd, ".mochi")
        const rootPath = path.toSystemPath(path.join(tmp, "__mochi-css__.ts"))

        const paths: string[] = []
        const fileLookup: FileLookup = {}

        for (const [filename, source] of Object.entries(files)) {
            if (source === null) continue
            const relativePath = path.relative(cwd, filename)
            paths.push(relativePath)

            const filePath = path.join(tmp, relativePath)
            fileLookup[path.toSystemPath(filePath)] = source
        }
        const rootImports = paths.map((f) => `import "./${f}"`).join("\n")

        fileLookup[rootPath] = [rootImports, rootFileSuffix].join("\n\n")

        try {
            // Bundle into single file
            return await this.options.bundler.bundle(rootPath, fileLookup, this.options.tsConfigPath)
        } catch (err) {
            if (this.options.debug) {
                for (const [path, code] of Object.entries(fileLookup)) {
                    this.options.onDiagnostic({
                        severity: "debug",
                        file: path,
                        code: "MOCHI_BUNDLE_INPUT",
                        message: `\n${code}`,
                    })
                }
            }
            const message = getErrorMessage(err)
            throw new MochiError("MOCHI_BUNDLE", message, rootPath, err)
        }
    }

    private async executeCode(code: string, evaluator: Evaluator) {
        try {
            await evaluator.evaluate(code)
        } catch (err) {
            const message = getErrorMessage(err)
            if (this.options.debug) {
                this.options.onDiagnostic({
                    code: "MOCHI_DEBUG",
                    message: `bundled code that failed to execute:\n${code}`,
                    severity: "debug",
                })
            }
            throw new MochiError("MOCHI_EXEC", message, "internal:/tmp", err)
        }
    }

    public async collectStylesFromModules(modules: Module[]): Promise<{
        chunks: Map<string, Set<string>>
        modifiedSources: Map<string, string>
        /**
         * Sourcemaps (encoded JSON strings) for each serialized JS file, mapping the
         * reprinted output back to the parse input. Keyed by file path, populated only for
         * files reprinted from a mutated AST (not for opaque string replacements supplied
         * via the deprecated emitModifiedSource path).
         */
        modifiedSourceMaps: Map<string, string>
    }> {
        const resolveImport = this.buildResolveImport(modules)
        const onDiagnostic = this.options.onDiagnostic
        const runner = this.createRunner(modules, resolveImport)
        const evaluator = new Evaluator(this.options.runner)
        evaluator.setGlobal("__global_mochi_diagnostics", onDiagnostic)
        const chunks = new Map<string, Set<string>>()
        const modifiedSources = new Map<string, string>()
        const modifiedSourceMaps = new Map<string, string>()
        const markedForEval = new Map<string, Set<SWC.Expression>>()
        const cssAstChunks = new Map<string, CssAstEntry>()
        const deferredJsFiles = new Set<string>()

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
            emitModifiedSource(filePath: string, code: string) {
                try {
                    const fileData = runner.engine.fileData.for(filePath).get()
                    const parsed = SWC.parseSync(code, { syntax: "typescript", tsx: true })
                    Object.assign(fileData.ast, parsed)
                    deferredJsFiles.add(filePath)
                } catch {
                    modifiedSources.set(filePath, code)
                }
            },
            emitCssAst(filePath: string, originalCss: string, ast: CssTree.StyleSheet) {
                const existing = cssAstChunks.get(filePath)
                if (existing) {
                    const combined = existing.originalCss + "\n" + originalCss
                    const mergedAst = csstree.parse(combined) as CssTree.StyleSheet
                    cssAstChunks.set(filePath, { originalCss: combined, ast: mergedAst, wasMutated: false })
                } else {
                    cssAstChunks.set(filePath, { originalCss, ast, wasMutated: false })
                }
            },
            markJsMutated(filePath: string) {
                deferredJsFiles.add(filePath)
            },
        }

        for (const handler of this.options.sourceTransforms ?? []) {
            this.runAnalysisPass(runner, markedForEval)
            const fileData = this.options.getFileData?.(runner) ?? []
            const proxied = wrapFilesWithProxies(fileData)
            await handler(runner, context)
            const dirtyFiles = proxied.getDirtyFiles()
            if (dirtyFiles.size === 0) continue
            this.options.invalidateFiles?.(runner, dirtyFiles)
            this.options.resetCrossFileState?.(runner)
        }
        this.runAnalysisPass(runner, markedForEval)

        const evalRunner = await this.buildEvalRunner(modules, runner, resolveImport, context, markedForEval)

        const resultingFiles = this.options.getFilesToBundle?.(evalRunner, markedForEval) ?? {}

        const code = await this.bundleFiles(resultingFiles)
        await this.executeCode(code, evaluator)
        runner.markEvaluated()

        for (const handler of this.options.postEvalTransforms ?? []) {
            await handler(runner, context)
        }

        for (const hook of this.options.emitHooks ?? []) {
            await hook(runner, context)
        }

        // postProcessHooks: run after emitHooks, before serialization
        const ppCtx: PostProcessContext = {
            cssAstChunks,
            markFileDirty: (fp) => deferredJsFiles.add(fp),
        }
        for (const hook of this.options.postProcessHooks ?? []) {
            await hook(runner, ppCtx)
        }
        // Serialize deferred JS files (after postProcessHooks so AST mutations are captured).
        // Emit a sourcemap alongside so the reprinted output can be traced back to the parse
        // input. SWC reconstructs sourcesContent from its span store, so the map is complete
        // even though we only hand it the AST.
        for (const fp of deferredJsFiles) {
            try {
                const { ast } = runner.engine.fileData.for(fp).get()
                const { code, map } = SWC.printSync(ast, { sourceMaps: true, filename: fp })
                modifiedSources.set(fp, code)
                if (map) modifiedSourceMaps.set(fp, map)
            } catch {
                // file not in engine (e.g. non-JS paths)
            }
        }
        // Emit CSS from ASTs
        for (const [source, { originalCss, ast, wasMutated }] of cssAstChunks) {
            context.emitChunk(source, wasMutated ? csstree.generate(ast) : originalCss)
        }

        if (this.options.emitDir) {
            const chunkFiles: Record<string, string> = {}
            for (const [relPath, contentSet] of chunks) {
                chunkFiles[relPath] = [...contentSet].join("\n\n")
            }
            await this.syncEmittedFiles(this.options.emitDir, chunkFiles)
        }

        await this.options.cleanup?.()

        return { chunks, modifiedSources, modifiedSourceMaps }
    }

    private async syncEmittedFiles(emitDir: string, files: Record<string, string | null>): Promise<void> {
        await fs.mkdir(path.toSystemPath(emitDir), { recursive: true })

        const manifestPath = path.join(emitDir, ".mochi-emit.json")
        let previousPaths: string[] = []
        try {
            const manifestContent = await fs.readFile(path.toSystemPath(manifestPath), "utf8")
            previousPaths = JSON.parse(manifestContent) as string[]
        } catch {
            // No manifest yet — first run
        }

        const newPaths: string[] = []

        for (const [relPath, content] of Object.entries(files)) {
            const absPath = path.resolve(emitDir, relPath)
            const sysPath = path.toSystemPath(absPath)
            if (content === null) {
                try {
                    await fs.unlink(sysPath)
                } catch {
                    // already gone
                }
            } else {
                await fs.mkdir(path.toSystemPath(path.dirname(absPath)), { recursive: true })
                let existing: string | undefined
                try {
                    existing = await fs.readFile(sysPath, "utf8")
                } catch {
                    // doesn't exist yet
                }
                if (existing !== content) {
                    await fs.writeFile(sysPath, content, "utf8")
                }
                newPaths.push(relPath)
            }
        }

        // Delete files from previous run that are no longer present
        for (const prevPath of previousPaths) {
            if (!(prevPath in files)) {
                try {
                    await fs.unlink(path.toSystemPath(path.resolve(emitDir, prevPath)))
                } catch {
                    // already gone
                }
            }
        }

        await fs.writeFile(path.toSystemPath(manifestPath), JSON.stringify(newPaths), "utf8")
    }

    public async collectMochiCss(options?: CollectCssOptions): Promise<{
        global?: string
        files?: Record<string, string>
        sourcemods?: Record<string, string>
        /** Sourcemaps (encoded JSON) for each entry in `sourcemods`, mapping the emitted source back to the original disk file. */
        sourcemaps?: Record<string, string>
    }> {
        const rootPaths = this.options.roots.map((r) => (typeof r === "string" ? r : r.path))
        const fileArrays = await Promise.all(rootPaths.map(findAllFiles))
        const allFiles = fileArrays.flat()

        for (const file of allFiles) {
            options?.onDep?.(file)
        }

        const preprocessedSources: Record<string, string> = {}
        // Original disk source for files altered by filePreProcess, needed to map back past it.
        const preprocessOriginals: Record<string, string> = {}
        const modules = await Promise.all(
            allFiles.map(async (filePath) => {
                const source = await fs.readFile(path.toSystemPath(filePath), "utf8")
                const transformed = await this.preTransformFile(source, filePath)
                if (transformed !== source) {
                    preprocessedSources[filePath] = transformed
                    preprocessOriginals[filePath] = source
                }
                return transformed === source ? parseFile(filePath) : parseSource(transformed, filePath)
            }),
        )

        const { chunks, modifiedSources, modifiedSourceMaps } = await this.collectStylesFromModules(modules)

        // Build sourcemods: preprocessed files first, then AST-substituted files override
        const sourcemods: Record<string, string> = { ...preprocessedSources }
        for (const [filePath, code] of modifiedSources) {
            sourcemods[filePath] = code
        }

        // Build sourcemaps for each emitted source, composing past filePreProcess when needed.
        const sourcemaps: Record<string, string> = {}
        for (const filePath of Object.keys(sourcemods)) {
            const printMap = modifiedSourceMaps.get(filePath)
            const transformed = preprocessedSources[filePath]
            const original = preprocessOriginals[filePath]
            const wasPreprocessed = transformed !== undefined && original !== undefined

            if (printMap && wasPreprocessed) {
                // Reprinted from a preprocessed input: compose printer map past the preprocess edit.
                const preMap = buildPreprocessMap(original, transformed, filePath)
                sourcemaps[filePath] = composeWithPreprocessMap(printMap, preMap)
            } else if (printMap) {
                // Reprinted directly from the disk source: printer map is already disk-origin.
                sourcemaps[filePath] = printMap
            } else if (wasPreprocessed) {
                // Preprocessed only, no AST reprint: the preprocess map is the whole story.
                sourcemaps[filePath] = JSON.stringify(buildPreprocessMap(original, transformed, filePath))
            }
            // else: opaque emitModifiedSource string with no AST — no map can be produced.
        }

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
        const resultSourcemaps = Object.keys(sourcemaps).length > 0 ? sourcemaps : undefined

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
                sourcemaps: resultSourcemaps,
            }
        }

        return {
            global: globalCss.length > 0 ? globalCss.join("\n\n") : undefined,
            files: Object.keys(filesCss).length > 0 ? filesCss : undefined,
            sourcemods: resultSourcemods,
            sourcemaps: resultSourcemaps,
        }
    }
}
