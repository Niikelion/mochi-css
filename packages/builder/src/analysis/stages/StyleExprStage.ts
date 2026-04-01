import * as SWC from "@swc/core"
import { StyleExtractor } from "@/extractors/StyleExtractor"
import { visit } from "@/Visitor"
import { defineStage } from "@/analysis/Stage"
import type { CacheRegistry, FileCache } from "@/analysis/CacheEngine"
import { idToRef } from "@/analysis/helpers"
import { DerivedExtractorStage, makeDerivedExtractorStage, type DerivedExtractorStageOut } from "@/analysis"
import type { StageDefinition } from "@/analysis/Stage"

type StyleExprResult = {
    styleExpressions: Set<SWC.Expression>
    extractedExpressions: Map<StyleExtractor, SWC.Expression[]>
    extractedCallExpressions: Map<StyleExtractor, SWC.CallExpression[]>
}

export type StyleExprStageOut = {
    styleExprs: FileCache<StyleExprResult>
    fileData: DerivedExtractorStageOut["fileData"]
    derived: DerivedExtractorStageOut["derived"]
}

export const STYLE_EXPR_STAGE = Symbol.for("StyleExprStage")

export function makeStyleExprStage(
    derivedStage: ReturnType<typeof makeDerivedExtractorStage>,
): StageDefinition<[ReturnType<typeof makeDerivedExtractorStage>], StyleExprStageOut> {
    const stage = defineStage({
        dependsOn: [derivedStage] as const,
        init(registry: CacheRegistry, derivedInst: DerivedExtractorStageOut): StyleExprStageOut {
            const styleExprs = registry.fileCache(
                (file) => [derivedInst.derived.for(file)],
                (file): StyleExprResult => {
                    const data = derivedInst.fileData.cache.for(file).get()
                    const { mergedExtractorIds, parentCalls } = derivedInst.derived.for(file).get()

                    const styleExpressions = new Set<SWC.Expression>()
                    const extractedExpressions = new Map<StyleExtractor, SWC.Expression[]>()
                    const extractedCallExpressions = new Map<StyleExtractor, SWC.CallExpression[]>()

                    visit.module(
                        data.ast,
                        {
                            callExpression(node, { descend }) {
                                if (node.callee.type === "Identifier") {
                                    const calleeRef = idToRef(node.callee)
                                    const styleExtractor = mergedExtractorIds.get(calleeRef)
                                    if (styleExtractor) {
                                        const staticArgs = styleExtractor.extractStaticArgs(node)
                                        staticArgs.forEach((style) => styleExpressions.add(style))

                                        if (!parentCalls.has(node)) {
                                            const existing = extractedExpressions.get(styleExtractor)
                                            if (existing) {
                                                existing.push(...staticArgs)
                                            } else {
                                                extractedExpressions.set(styleExtractor, [...staticArgs])
                                            }
                                            if (staticArgs.length > 0) {
                                                const existingCalls = extractedCallExpressions.get(styleExtractor)
                                                if (existingCalls) {
                                                    existingCalls.push(node)
                                                } else {
                                                    extractedCallExpressions.set(styleExtractor, [node])
                                                }
                                            }
                                        }
                                    }
                                }
                                descend(null)
                            },
                        },
                        null,
                    )

                    return { styleExpressions, extractedExpressions, extractedCallExpressions }
                },
            )

            return { styleExprs, fileData: derivedInst.fileData, derived: derivedInst.derived }
        },
    })

    return Object.assign(stage, { [STYLE_EXPR_STAGE]: true as const })
}

// Backward-compatible singleton
export const StyleExprStage = makeStyleExprStage(DerivedExtractorStage)
