import * as SWC from "@swc/core"
import { StyleExtractor } from "@/extractors/StyleExtractor"
import { visit } from "@/Visitor"
import { defineStage } from "@/analysis/Stage"
import type { CacheRegistry } from "@/analysis/CacheEngine"
import { idToRef } from "@/analysis/helpers"
import { DerivedExtractorStage } from "./DerivedExtractorStage"

type StyleExprResult = {
    styleExpressions: Set<SWC.Expression>
    extractedExpressions: Map<StyleExtractor, SWC.Expression[]>
    extractedCallExpressions: Map<StyleExtractor, SWC.CallExpression[]>
}

export const StyleExprStage = defineStage({
    dependsOn: [DerivedExtractorStage],
    init(registry: CacheRegistry, derivedInst: ReturnType<typeof DerivedExtractorStage.init>) {
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
