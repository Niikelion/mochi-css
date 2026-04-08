import type { EmitHook, MutableFileEntry } from "@mochi-css/builder";
import { propagateUsagesFromExpr } from "@mochi-css/builder";
import type {
    StyleExtractor,
    StyleGenerator,
    FileInfo,
    DerivedExtractorBinding,
} from "./types";
import { getErrorMessage } from "@mochi-css/core";
import type { OnDiagnostic } from "@mochi-css/core";
import type { MochiPlugin } from "@mochi-css/config";
import * as SWC from "@swc/core";
import { RefMap } from "@mochi-css/builder";
import type { BindingInfo } from "@mochi-css/builder";
import {
    makeImportSpecStage,
    makeDerivedExtractorStage,
    makeStyleExprStage,
    makeBindingStage,
    makeCrossFileDerivedStage,
    type DerivedExtractorStageOut,
    type StyleExprStageOut,
    type BindingStageOut,
    type CrossFileResult,
} from "./stages";
import { extractRelevantSymbols } from "./extractRelevantSymbols";

export function getExtractorId(extractor: StyleExtractor): string {
    return `${extractor.importPath}:${extractor.symbolName}`;
}

function wrapGenerator(
    generator: StyleGenerator,
    onDiagnostic: OnDiagnostic | undefined,
): (source: string, ...args: unknown[]) => Record<string, unknown> {
    return (source: string, ...args: unknown[]) => {
        try {
            const subGenerators = generator.collectArgs(source, args);
            const result: Record<string, unknown> = {};
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            for (const [name, subGen] of Object.entries(subGenerators ?? {})) {
                result[name] = wrapGenerator(subGen, onDiagnostic);
            }
            return result;
        } catch (err) {
            const message = getErrorMessage(err);
            onDiagnostic?.({
                code: "MOCHI_EXEC",
                message: `Failed to collect styles: ${message}`,
                severity: "warning",
                file: source,
            });
            return {};
        }
    };
}

function assembleFileInfo(
    filePath: string,
    bindingOut: BindingStageOut,
    styleExprOut: StyleExprStageOut,
    derivedOut: DerivedExtractorStageOut,
    crossFileMap: CrossFileResult,
): FileInfo {
    const {
        moduleBindings,
        localImports,
        references,
        exports,
        exportedDerivedExtractors,
    } = bindingOut.fileBindings.for(filePath).get();
    const { derivedBindings } = derivedOut.derived.for(filePath).get();
    const { styleExpressions, extractedExpressions, extractedCallExpressions } =
        styleExprOut.styleExprs.for(filePath).get();
    const extra = crossFileMap.get(filePath);

    const usedBindings = new Set<BindingInfo>();
    if (extra) {
        for (const ref of extra.usedImportRefs) {
            const b = moduleBindings.get(ref);
            if (b) usedBindings.add(b);
        }
    }

    const allDerivedBindings = new RefMap<DerivedExtractorBinding>();
    for (const [ref, b] of derivedBindings.entries())
        allDerivedBindings.set(ref, b);
    if (extra) {
        for (const [ref, b] of extra.additionalDerivedBindings.entries())
            allDerivedBindings.set(ref, b);
    }

    // Get ast from fileData
    const fileData = derivedOut.fileData.cache.for(filePath).get();

    return {
        filePath,
        ast: fileData.ast,
        styleExpressions: extra
            ? new Set([...styleExpressions, ...extra.additionalStyleExprs])
            : styleExpressions,
        extractedExpressions: extra
            ? mergeMap(extractedExpressions, extra.additionalExtractedExprs)
            : extractedExpressions,
        extractedCallExpressions: extra
            ? mergeMap(
                  extractedCallExpressions,
                  extra.additionalExtractedCallExprs,
              )
            : extractedCallExpressions,
        references,
        moduleBindings,
        localImports,
        usedBindings,
        exports,
        derivedExtractorBindings: allDerivedBindings,
        exportedDerivedExtractors,
    };
}

function mergeMap<K, V extends unknown[]>(
    base: Map<K, V>,
    extra: Map<K, V>,
): Map<K, V> {
    if (extra.size === 0) return base;
    const result = new Map(base);
    for (const [k, v] of extra) {
        const existing = result.get(k);
        if (existing) result.set(k, [...existing, ...v] as V);
        else result.set(k, [...v] as V);
    }
    return result;
}

export function createExtractorsPlugin(
    extractors: StyleExtractor[],
): MochiPlugin {
    return {
        name: "mochi-extractor-plugin",
        onLoad(ctx) {
            let capturedGenerators: Map<string, StyleGenerator> | null = null;

            // Create stage instances
            const importStageDef = makeImportSpecStage(extractors);
            const derivedStageDef = makeDerivedExtractorStage(importStageDef);
            const styleExprStageDef = makeStyleExprStage(derivedStageDef);
            const bindingStageDef = makeBindingStage(styleExprStageDef);
            const crossFileDerivedStageDef = makeCrossFileDerivedStage(
                derivedStageDef,
                bindingStageDef,
            );

            // Register all analysis stages
            for (const stage of [
                importStageDef,
                derivedStageDef,
                styleExprStageDef,
                bindingStageDef,
                crossFileDerivedStageDef,
            ]) {
                ctx.stages.register(stage);
            }

            // Register pipeline hooks via the sourceTransform mechanism:
            // We register a sourceTransform that sets up generators and extractors global.
            // The pipeline hooks (initializeStages, prepareAnalysis, etc.) are registered on ctx.

            ctx.initializeStages.register(
                (runner, modules, resolveImport, onDiagnostic) => {
                    const importOut = runner.getInstance(importStageDef);
                    for (const m of modules) {
                        importOut.fileData.set(m.filePath, {
                            ast: m.ast,
                            filePath: m.filePath,
                            resolveImport,
                            onDiagnostic,
                        });
                    }
                },
            );

            ctx.prepareAnalysis.register((runner, markedForEval) => {
                const crossFileOut = runner.getInstance(
                    crossFileDerivedStageDef,
                );
                const bindingOut = runner.getInstance(bindingStageDef);
                const styleExprOut = runner.getInstance(styleExprStageDef);
                const derivedOut = runner.getInstance(derivedStageDef);

                const crossFileMap = crossFileOut.crossFileResult.get();

                const allFilePaths = new Set<string>();
                for (const fp of crossFileMap.keys()) allFilePaths.add(fp);
                for (const fp of markedForEval.keys()) allFilePaths.add(fp);

                const analyzedBindings = new Set<string>();
                const filesInfo = new Map<string, FileInfo>();
                for (const fp of allFilePaths) {
                    try {
                        const fileInfo = assembleFileInfo(
                            fp,
                            bindingOut,
                            styleExprOut,
                            derivedOut,
                            crossFileMap,
                        );
                        filesInfo.set(fp, fileInfo);
                    } catch {
                        // file might not be registered
                    }
                }

                for (const [, fileInfo] of filesInfo) {
                    for (const expr of fileInfo.styleExpressions) {
                        propagateUsagesFromExpr(
                            analyzedBindings,
                            filesInfo,
                            fileInfo,
                            expr,
                        );
                    }
                    for (const expr of markedForEval.get(fileInfo.filePath) ??
                        []) {
                        propagateUsagesFromExpr(
                            analyzedBindings,
                            filesInfo,
                            fileInfo,
                            expr,
                        );
                    }
                }
            });

            ctx.getFileData.register((runner): MutableFileEntry[] => {
                const importOut = runner.getInstance(importStageDef);
                return runner.getFilePaths().map((fp) => {
                    const data = importOut.fileData.cache.for(fp).get();
                    return { filePath: data.filePath, ast: data.ast };
                });
            });

            ctx.invalidateFiles.register((runner, dirtyFiles) => {
                const importOut = runner.getInstance(importStageDef);
                for (const fp of dirtyFiles) {
                    importOut.fileData.invalidate(fp);
                }
            });

            ctx.resetCrossFileState.register((runner) => {
                const crossFileOut = runner.getInstance(
                    crossFileDerivedStageDef,
                );
                crossFileOut.crossFileResult.invalidate();
            });

            ctx.getFilesToBundle.register((runner, markedForEval) => {
                const crossFileOut = runner.getInstance(
                    crossFileDerivedStageDef,
                );
                const bindingOut = runner.getInstance(bindingStageDef);
                const styleExprOut = runner.getInstance(styleExprStageDef);
                const derivedOut = runner.getInstance(derivedStageDef);

                const crossFileMap = crossFileOut.crossFileResult.get();

                const allFilePaths = new Set<string>();
                for (const fp of crossFileMap.keys()) allFilePaths.add(fp);
                for (const fp of markedForEval.keys()) allFilePaths.add(fp);

                const filesInfoMap = new Map<string, FileInfo>();
                for (const fp of allFilePaths) {
                    try {
                        const fileInfo = assembleFileInfo(
                            fp,
                            bindingOut,
                            styleExprOut,
                            derivedOut,
                            crossFileMap,
                        );
                        filesInfoMap.set(fp, fileInfo);
                    } catch {
                        // file not registered
                    }
                }

                const analyzedBindings = new Set<string>();
                for (const [, fileInfo] of filesInfoMap) {
                    for (const expr of fileInfo.styleExpressions) {
                        propagateUsagesFromExpr(
                            analyzedBindings,
                            filesInfoMap,
                            fileInfo,
                            expr,
                        );
                    }
                    for (const expr of markedForEval.get(fileInfo.filePath) ??
                        []) {
                        propagateUsagesFromExpr(
                            analyzedBindings,
                            filesInfoMap,
                            fileInfo,
                            expr,
                        );
                    }
                }

                return extractRelevantSymbols(
                    [...filesInfoMap.entries()],
                    markedForEval,
                );
            });

            // sourceTransform: sets up generators and extractors global
            ctx.sourceTransforms.register((_runner, context) => {
                const generators = new Map<string, StyleGenerator>();
                for (const extractor of extractors) {
                    const id = getExtractorId(extractor);
                    generators.set(
                        id,
                        extractor.startGeneration(ctx.onDiagnostic),
                    );
                }
                capturedGenerators = generators;

                const extractorsObj: Record<
                    string,
                    (
                        source: string,
                        ...args: unknown[]
                    ) => Record<string, unknown>
                > = {};
                for (const [id, gen] of generators) {
                    extractorsObj[id] = wrapGenerator(gen, ctx.onDiagnostic);
                }
                context.evaluator.setGlobal("extractors", extractorsObj);
            });

            const emitHook: EmitHook = async (runner, context) => {
                if (!capturedGenerators) return;

                const crossFileOut = runner.getInstance(
                    crossFileDerivedStageDef,
                );
                const bindingOut = runner.getInstance(bindingStageDef);
                const styleExprOut = runner.getInstance(styleExprStageDef);

                for (const [, generator] of capturedGenerators) {
                    const styles = await generator.generateStyles();
                    const replacements = generator.getArgReplacements?.() ?? [];

                    const replacementsBySource = new Map<
                        string,
                        { expression: SWC.Expression }[]
                    >();
                    for (const rep of replacements) {
                        const list = replacementsBySource.get(rep.source);
                        if (list) {
                            list.push({ expression: rep.expression });
                        } else {
                            replacementsBySource.set(rep.source, [
                                { expression: rep.expression },
                            ]);
                        }
                    }

                    for (const [source, repList] of replacementsBySource) {
                        const styleExprResult = styleExprOut.styleExprs
                            .for(source)
                            .get();

                        for (const extractor of extractors) {
                            const callNodes =
                                styleExprResult.extractedCallExpressions.get(
                                    extractor,
                                );
                            if (callNodes?.length !== repList.length) continue;

                            for (let i = 0; i < callNodes.length; i++) {
                                const callNode = callNodes[i];
                                const rep = repList[i];
                                if (!callNode || !rep) continue;
                                callNode.arguments = [
                                    { expression: rep.expression },
                                ];
                            }
                        }

                        void crossFileOut;
                        void bindingOut;
                    }

                    if (styles.files) {
                        for (const [source, css] of Object.entries(
                            styles.files,
                        )) {
                            context.emitChunk(source, css);
                        }
                    }
                    if (styles.global) {
                        context.emitChunk("global.css", styles.global);
                    }
                }
            };

            ctx.emitHooks.register(emitHook);
            ctx.cleanup.register(() => {
                capturedGenerators = null;
            });
        },
    };
}
