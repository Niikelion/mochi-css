import type { EmitHook, MutableFileEntry, Ref } from "@mochi-css/builder"
import { propagateUsagesFromExpr, type ReexportResolver } from "./propagation"
import { getOrInsert } from "./utils"
import {
    type StyleExtractor,
    StyleGenerator,
    type FileInfo,
    type DerivedExtractorBinding,
    type ReexportInfo,
} from "./types"
import { getErrorMessage } from "@mochi-css/core"
import type { OnDiagnostic } from "@mochi-css/core"
import type { MochiPlugin } from "@mochi-css/config"
import * as SWC from "@swc/core"
import { RefMap } from "@mochi-css/builder"
import type { BindingInfo } from "@mochi-css/builder"
import {
    importStageDef,
    exportsStage,
    derivedStageDef,
    styleExprStageDef,
    bindingStageDef,
    crossFileDerivedStageDef,
    type ExtractorLookup,
    type DerivedExtractorStageOut,
    type StyleExprStageOut,
    type BindingStageOut,
    type ExportsStageOut,
    type CrossFileResult,
} from "./stages"
import { extractRelevantSymbols } from "./extractRelevantSymbols"

export function getExtractorId(extractor: StyleExtractor): string {
    return `${extractor.importPath}:${extractor.symbolName}`
}

function buildExtractorLookup(extractors: StyleExtractor[]): ExtractorLookup {
    const lookup: ExtractorLookup = new Map()
    for (const extractor of extractors) {
        getOrInsert(lookup, extractor.importPath, () => new Map()).set(extractor.symbolName, extractor)
    }
    return lookup
}

function wrapGenerator(
    generator: StyleGenerator,
    onDiagnostic: OnDiagnostic | undefined,
): (source: string, ...args: unknown[]) => unknown {
    return (source: string, ...args: unknown[]) => {
        try {
            // collect args
            generator.collectArgs(source, args)

            // call mocked function to get the result
            const result = generator.mockFunction(...args)

            if (!result || typeof result !== "object") return result

            // wrap all sub-generators
            const ret: Record<string, unknown> = { ...result }

            for (const key in ret) {
                const v = ret[key]
                if (!(v instanceof StyleGenerator)) continue

                ret[key] = wrapGenerator(v, onDiagnostic)
            }
            return ret
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

function buildReexportResolver(filesInfo: Map<string, FileInfo>): ReexportResolver {
    const resolveFrom = (
        filePath: string,
        exportName: string,
        visited: Set<string>,
    ): { fileView: FileInfo; ref: Ref } | null => {
        if (visited.has(filePath)) return null
        visited.add(filePath)
        const fileInfo = filesInfo.get(filePath)
        if (!fileInfo) return null

        const directRef = fileInfo.exports.get(exportName)
        if (directRef) return { fileView: fileInfo, ref: directRef }

        const ri = fileInfo.reexports.get(exportName)
        if (ri) return resolveFrom(ri.sourcePath, ri.originalName, visited)

        for (const sourcePath of fileInfo.namespaceReexports) {
            const result = resolveFrom(sourcePath, exportName, visited)
            if (result) return result
        }

        return null
    }

    return (importedFileView, exportName) => {
        const fileInfo = filesInfo.get(importedFileView.filePath)
        if (!fileInfo) return null

        const ri = fileInfo.reexports.get(exportName)
        if (ri) return resolveFrom(ri.sourcePath, ri.originalName, new Set([importedFileView.filePath]))

        for (const sourcePath of fileInfo.namespaceReexports) {
            const result = resolveFrom(sourcePath, exportName, new Set([importedFileView.filePath]))
            if (result) return result
        }

        return null
    }
}

function assembleFileInfo(
    filePath: string,
    getAst: (fp: string) => SWC.Module,
    bindingOut: BindingStageOut,
    styleExprOut: StyleExprStageOut,
    derivedOut: DerivedExtractorStageOut,
    exportsOut: ExportsStageOut,
    crossFileMap: CrossFileResult,
): FileInfo {
    const { moduleBindings, localImports, references, exports, exportedDerivedExtractors } = bindingOut.fileBindings
        .for(filePath)
        .get()
    const { derivedBindings } = derivedOut.derived.for(filePath).get()
    const { styleExpressions, extractedExpressions, extractedCallExpressions } = styleExprOut.styleExprs
        .for(filePath)
        .get()
    const { reexports: rawReexports, namespaceReexports } = exportsOut.fileExports.for(filePath).get()
    const extra = crossFileMap.get(filePath)

    const usedBindings = new Set<BindingInfo>()
    if (extra) {
        for (const ref of extra.usedImportRefs) {
            const b = moduleBindings.get(ref)
            if (b) usedBindings.add(b)
        }
    }

    const allDerivedBindings = new RefMap<DerivedExtractorBinding>()
    for (const [ref, b] of derivedBindings.entries()) allDerivedBindings.set(ref, b)
    if (extra) {
        for (const [ref, b] of extra.additionalDerivedBindings.entries()) allDerivedBindings.set(ref, b)
    }

    const reexports = new Map<string, ReexportInfo>()
    for (const [sourcePath, entries] of rawReexports) {
        for (const { originalName, exportedName } of entries) {
            reexports.set(exportedName, { sourcePath, originalName })
        }
    }

    return {
        filePath,
        ast: getAst(filePath),
        styleExpressions: extra ? new Set([...styleExpressions, ...extra.additionalStyleExprs]) : styleExpressions,
        extractedExpressions: extra
            ? mergeMap(extractedExpressions, extra.additionalExtractedExprs)
            : extractedExpressions,
        extractedCallExpressions: extra
            ? mergeMap(extractedCallExpressions, extra.additionalExtractedCallExprs)
            : extractedCallExpressions,
        references,
        moduleBindings,
        localImports,
        usedBindings,
        exports,
        derivedExtractorBindings: allDerivedBindings,
        exportedDerivedExtractors,
        reexports,
        namespaceReexports,
    }
}

function mergeMap<K, V extends unknown[]>(base: Map<K, V>, extra: Map<K, V>): Map<K, V> {
    if (extra.size === 0) return base
    const result = new Map(base)
    for (const [k, v] of extra) {
        const existing = result.get(k)
        if (existing) result.set(k, [...existing, ...v] as V)
        else result.set(k, [...v] as V)
    }
    return result
}

export function createExtractorsPlugin(extractors: StyleExtractor[]): MochiPlugin {
    const extractorLookup = buildExtractorLookup(extractors)

    return {
        name: "mochi-extractor-plugin",
        onLoad(ctx) {
            let capturedGenerators: Map<string, StyleGenerator> | null = null

            // Register all analysis stages
            for (const stage of [
                importStageDef,
                exportsStage,
                derivedStageDef,
                styleExprStageDef,
                bindingStageDef,
                crossFileDerivedStageDef,
            ]) {
                ctx.stages.register(stage)
            }

            ctx.initializeStages.register((runner, modules, resolveImport, onDiagnostic) => {
                const importOut = runner.getInstance(importStageDef)
                importOut.extractors.set(extractorLookup)
                for (const m of modules) {
                    runner.engine.fileData.set(m.filePath, { filePath: m.filePath, ast: m.ast })
                    importOut.fileCallbacks.set(m.filePath, { resolveImport, onDiagnostic })
                }
            })

            ctx.prepareAnalysis.register((runner, markedForEval) => {
                const crossFileOut = runner.getInstance(crossFileDerivedStageDef)
                const bindingOut = runner.getInstance(bindingStageDef)
                const styleExprOut = runner.getInstance(styleExprStageDef)
                const derivedOut = runner.getInstance(derivedStageDef)
                const exportsOut = runner.getInstance(exportsStage)

                const crossFileMap = crossFileOut.crossFileResult.get()

                const allFilePaths = new Set<string>()
                for (const fp of crossFileMap.keys()) allFilePaths.add(fp)
                for (const fp of markedForEval.keys()) allFilePaths.add(fp)

                const getAst = (fp: string) => runner.engine.fileData.for(fp).get().ast

                const analyzedBindings = new Set<string>()
                const filesInfo = new Map<string, FileInfo>()
                for (const fp of allFilePaths) {
                    try {
                        const fileInfo = assembleFileInfo(
                            fp,
                            getAst,
                            bindingOut,
                            styleExprOut,
                            derivedOut,
                            exportsOut,
                            crossFileMap,
                        )
                        filesInfo.set(fp, fileInfo)
                    } catch {
                        // file might not be registered
                    }
                }

                const reexportResolver = buildReexportResolver(filesInfo)
                for (const [, fileInfo] of filesInfo) {
                    for (const expr of fileInfo.styleExpressions) {
                        propagateUsagesFromExpr(analyzedBindings, filesInfo, fileInfo, expr, reexportResolver)
                    }
                    for (const expr of markedForEval.get(fileInfo.filePath) ?? []) {
                        propagateUsagesFromExpr(analyzedBindings, filesInfo, fileInfo, expr, reexportResolver)
                    }
                }
            })

            ctx.getFileData.register((runner): MutableFileEntry[] => {
                return runner.getFilePaths().map((fp) => {
                    const { filePath, ast } = runner.engine.fileData.for(fp).get()
                    return { filePath, ast }
                })
            })

            ctx.invalidateFiles.register((runner, dirtyFiles) => {
                const importOut = runner.getInstance(importStageDef)
                for (const fp of dirtyFiles) {
                    runner.engine.fileData.invalidate(fp)
                    importOut.fileCallbacks.invalidate(fp)
                }
            })

            ctx.resetCrossFileState.register((runner) => {
                const crossFileOut = runner.getInstance(crossFileDerivedStageDef)
                crossFileOut.crossFileResult.invalidate()
            })

            ctx.getFilesToBundle.register((runner, markedForEval) => {
                const crossFileOut = runner.getInstance(crossFileDerivedStageDef)
                const bindingOut = runner.getInstance(bindingStageDef)
                const styleExprOut = runner.getInstance(styleExprStageDef)
                const derivedOut = runner.getInstance(derivedStageDef)
                const exportsOut = runner.getInstance(exportsStage)

                const crossFileMap = crossFileOut.crossFileResult.get()

                const allFilePaths = new Set<string>()
                for (const fp of crossFileMap.keys()) allFilePaths.add(fp)
                for (const fp of markedForEval.keys()) allFilePaths.add(fp)

                const getAst = (fp: string) => runner.engine.fileData.for(fp).get().ast

                const filesInfoMap = new Map<string, FileInfo>()
                for (const fp of allFilePaths) {
                    try {
                        const fileInfo = assembleFileInfo(
                            fp,
                            getAst,
                            bindingOut,
                            styleExprOut,
                            derivedOut,
                            exportsOut,
                            crossFileMap,
                        )
                        filesInfoMap.set(fp, fileInfo)
                    } catch {
                        // file not registered
                    }
                }

                const reexportResolver = buildReexportResolver(filesInfoMap)
                const analyzedBindings = new Set<string>()
                for (const [, fileInfo] of filesInfoMap) {
                    for (const expr of fileInfo.styleExpressions) {
                        propagateUsagesFromExpr(analyzedBindings, filesInfoMap, fileInfo, expr, reexportResolver)
                    }
                    for (const expr of markedForEval.get(fileInfo.filePath) ?? []) {
                        propagateUsagesFromExpr(analyzedBindings, filesInfoMap, fileInfo, expr, reexportResolver)
                    }
                }

                return extractRelevantSymbols([...filesInfoMap.entries()], markedForEval)
            })

            // sourceTransform: sets up generators and extractors global
            ctx.sourceTransforms.register((_runner, context) => {
                const generators = new Map<string, StyleGenerator>()
                for (const extractor of extractors) {
                    const id = getExtractorId(extractor)
                    generators.set(id, extractor.startGeneration(ctx.onDiagnostic))
                }
                capturedGenerators = generators

                const extractorsObj: Record<string, (source: string, ...args: unknown[]) => unknown> = {}
                for (const [id, gen] of generators) {
                    extractorsObj[id] = wrapGenerator(gen, ctx.onDiagnostic)
                }
                context.evaluator.setGlobal("extractors", extractorsObj)
            })

            const emitHook: EmitHook = async (runner, context) => {
                if (!capturedGenerators) return

                const crossFileOut = runner.getInstance(crossFileDerivedStageDef)
                const bindingOut = runner.getInstance(bindingStageDef)
                const styleExprOut = runner.getInstance(styleExprStageDef)

                for (const [, generator] of capturedGenerators) {
                    const styles = await generator.generateStyles()
                    const replacements = generator.getArgReplacements()

                    const replacementsBySource = new Map<string, { expression: SWC.Expression }[]>()
                    for (const rep of replacements) {
                        const list = replacementsBySource.get(rep.source)
                        if (list) {
                            list.push({ expression: rep.expression })
                        } else {
                            replacementsBySource.set(rep.source, [{ expression: rep.expression }])
                        }
                    }

                    for (const [source, repList] of replacementsBySource) {
                        const styleExprResult = styleExprOut.styleExprs.for(source).get()

                        for (const extractor of extractors) {
                            const callNodes = styleExprResult.extractedCallExpressions.get(extractor)
                            if (callNodes?.length !== repList.length) continue

                            for (let i = 0; i < callNodes.length; i++) {
                                const callNode = callNodes[i]
                                const rep = repList[i]
                                if (!callNode || !rep) continue
                                callNode.arguments = [{ expression: rep.expression }]
                            }
                        }

                        void crossFileOut
                        void bindingOut
                    }

                    if (styles.files) {
                        for (const [source, css] of Object.entries(styles.files)) {
                            context.emitChunk(source, css)
                        }
                    }
                    if (styles.global) {
                        context.emitChunk("global.css", styles.global)
                    }
                }
            }

            ctx.emitHooks.register(emitHook)
            ctx.cleanup.register(() => {
                capturedGenerators = null
            })
        },
    }
}
