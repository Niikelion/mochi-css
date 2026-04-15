import * as SWC from "@swc/core"
import type { StyleExtractor, DerivedExtractorBinding } from "../types"
import { visit } from "@mochi-css/builder"
import { defineStage } from "@mochi-css/builder"
import type { CacheRegistry } from "@mochi-css/builder"
import { RefMap } from "@mochi-css/builder"
import { idToRef, type Ref } from "@mochi-css/builder"
import { derivedStageDef, type DerivedExtractorStageOut } from "./DerivedExtractorStage"
import { bindingStageDef, type BindingStageOut } from "./BindingStage"

/**
 * Cross-file derived extractor data accumulated for a single file.
 *
 * These supplement the per-file stage outputs for files that import derived extractors
 * defined elsewhere. All fields are empty when no cross-file derived extractors are used.
 */
export type CrossFileExtra = {
    /** Derived extractor bindings discovered through local imports (not declared in this file). */
    additionalDerivedBindings: RefMap<DerivedExtractorBinding>
    /** Style expression nodes collected from cross-file derived extractor calls. */
    additionalStyleExprs: Set<SWC.Expression>
    /** Per-extractor static argument expressions from cross-file calls. */
    additionalExtractedExprs: Map<StyleExtractor, SWC.Expression[]>
    /** Per-extractor call expression nodes from cross-file calls. */
    additionalExtractedCallExprs: Map<StyleExtractor, SWC.CallExpression[]>
    /** Import refs that were resolved to a cross-file derived extractor (used for bundling). */
    usedImportRefs: Set<Ref>
}

function scanForDerivedCalls(ast: SWC.Module, ref: Ref, binding: DerivedExtractorBinding, extra: CrossFileExtra): void {
    let found = false
    visit.module(
        ast,
        {
            callExpression(node, { descend }) {
                if (node.callee.type === "Identifier") {
                    const calleeRef = idToRef(node.callee)
                    if (calleeRef.name === ref.name && calleeRef.id === ref.id) {
                        if (!found) {
                            found = true
                            extra.usedImportRefs.add(ref)
                        }
                        const staticArgs = binding.extractor.extractStaticArgs(node)
                        staticArgs.forEach((style) => extra.additionalStyleExprs.add(style))

                        const existing = extra.additionalExtractedExprs.get(binding.extractor)
                        if (existing) {
                            existing.push(...staticArgs)
                        } else {
                            extra.additionalExtractedExprs.set(binding.extractor, [...staticArgs])
                        }
                        if (staticArgs.length > 0) {
                            const existingCalls = extra.additionalExtractedCallExprs.get(binding.extractor)
                            if (existingCalls) {
                                existingCalls.push(node)
                            } else {
                                extra.additionalExtractedCallExprs.set(binding.extractor, [node])
                            }
                        }
                    }
                }
                descend(null)
            },
        },
        null,
    )
}

/** Maps file path → cross-file derived extractor data for that file. */
export type CrossFileResult = Map<string, CrossFileExtra>

/**
 * Output of {@link crossFileDerivedStageDef}.
 *
 * - `crossFileResult` — project-level cache mapping each file path to its {@link CrossFileExtra}
 */
export type CrossFileDerivedStageOut = {
    crossFileResult: import("@mochi-css/builder").ProjectCache<CrossFileResult>
}

/**
 * Cross-file derived extractor propagation.
 *
 * Iterates over all files' local imports and checks whether any imported name resolves to a
 * derived extractor exported from the source file. When found, the binding is copied into the
 * importing file's {@link CrossFileExtra} and the file's AST is scanned for calls to that
 * identifier.
 *
 * The propagation loop repeats until no new bindings are discovered, handling transitive
 * imports (A imports from B which imports from C).
 *
 * Depends on {@link derivedStageDef} and {@link bindingStageDef}.
 */
export const crossFileDerivedStageDef = defineStage({
    dependsOn: [derivedStageDef, bindingStageDef] as const,
    init(
        registry: CacheRegistry,
        derivedInst: DerivedExtractorStageOut,
        bindingInst: BindingStageOut,
    ): CrossFileDerivedStageOut {
        const filePaths = registry.getFilePaths()

        const crossFileResult = registry.projectCache(
            () => filePaths.flatMap((f) => [derivedInst.derived.for(f), bindingInst.fileBindings.for(f)]),
            (): CrossFileResult => {
                const result = new Map<string, CrossFileExtra>()

                const getExtra = (filePath: string): CrossFileExtra => {
                    const existing = result.get(filePath)
                    if (existing) return existing
                    const extra: CrossFileExtra = {
                        additionalDerivedBindings: new RefMap<DerivedExtractorBinding>(),
                        additionalStyleExprs: new Set<SWC.Expression>(),
                        additionalExtractedExprs: new Map<StyleExtractor, SWC.Expression[]>(),
                        additionalExtractedCallExprs: new Map<StyleExtractor, SWC.CallExpression[]>(),
                        usedImportRefs: new Set<Ref>(),
                    }
                    result.set(filePath, extra)
                    return extra
                }

                let changed = true
                while (changed) {
                    changed = false
                    for (const filePath of filePaths) {
                        const { localImports } = bindingInst.fileBindings.for(filePath).get()
                        const { derivedBindings } = derivedInst.derived.for(filePath).get()
                        const extra = getExtra(filePath)

                        for (const localImport of localImports.values()) {
                            const { exportedDerivedExtractors } = bindingInst.fileBindings
                                .for(localImport.sourcePath)
                                .get()

                            const derivedBinding = exportedDerivedExtractors.get(localImport.exportName)
                            if (!derivedBinding) continue
                            if (derivedBindings.has(localImport.localRef)) continue
                            if (extra.additionalDerivedBindings.has(localImport.localRef)) continue

                            const { ast } = registry.fileData.for(filePath).get()
                            const { moduleBindings } = bindingInst.fileBindings.for(filePath).get()

                            const importedBinding: DerivedExtractorBinding = {
                                extractor: derivedBinding.extractor,
                                parentExtractor: derivedBinding.parentExtractor,
                                parentCallExpression: derivedBinding.parentCallExpression,
                                propertyName: derivedBinding.propertyName,
                                localIdentifier:
                                    moduleBindings.get(localImport.localRef)?.identifier ??
                                    derivedBinding.localIdentifier,
                            }

                            extra.additionalDerivedBindings.set(localImport.localRef, importedBinding)
                            scanForDerivedCalls(ast, localImport.localRef, importedBinding, extra)
                            changed = true
                        }
                    }
                }

                return result
            },
        )

        return { crossFileResult }
    },
})
