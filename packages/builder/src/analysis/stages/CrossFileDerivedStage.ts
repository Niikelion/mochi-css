import * as SWC from "@swc/core"
import { StyleExtractor } from "@/extractors/StyleExtractor"
import { visit } from "@/Visitor"
import { defineStage } from "@/analysis/Stage"
import type { CacheRegistry } from "@/analysis/CacheEngine"
import { RefMap } from "@/analysis/types"
import type { DerivedExtractorBinding } from "@/analysis/types"
import { idToRef, type Ref } from "@/analysis/helpers"
import { BindingStage } from "./BindingStage"
import { DerivedExtractorStage } from "./DerivedExtractorStage"

export type CrossFileExtra = {
    additionalDerivedBindings: RefMap<DerivedExtractorBinding>
    additionalStyleExprs: Set<SWC.Expression>
    additionalExtractedExprs: Map<StyleExtractor, SWC.Expression[]>
    additionalExtractedCallExprs: Map<StyleExtractor, SWC.CallExpression[]>
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

export type CrossFileResult = Map<string, CrossFileExtra>

export const CrossFileDerivedStage = defineStage({
    dependsOn: [DerivedExtractorStage, BindingStage],
    init(
        registry: CacheRegistry,
        derivedInst: ReturnType<typeof DerivedExtractorStage.init>,
        bindingInst: ReturnType<typeof BindingStage.init>,
    ) {
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

                            const data = derivedInst.fileData.cache.for(filePath).get()
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
                            scanForDerivedCalls(data.ast, localImport.localRef, importedBinding, extra)
                            changed = true
                        }
                    }
                }

                return result
            },
        )

        return { crossFileResult, fileData: derivedInst.fileData }
    },
})
