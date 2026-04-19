import * as SWC from "@swc/core"
import type { StyleExtractor } from "../types"
import { visit } from "@mochi-css/builder"
import { defineStage } from "@mochi-css/builder"
import type { FileCache, StageContext } from "@mochi-css/builder"
import { idToRef } from "@mochi-css/builder"
import { derivedStageDef, type DerivedExtractorStageOut } from "./DerivedExtractorStage"

type StyleExprResult = {
    /** Every AST expression node that is a static argument to any style call in this file. */
    styleExpressions: Set<SWC.Expression>
    /** Per-extractor list of static argument expressions (excludes parent calls). */
    extractedExpressions: Map<StyleExtractor, SWC.Expression[]>
    /** Per-extractor list of call expression nodes that produced at least one static arg. */
    extractedCallExpressions: Map<StyleExtractor, SWC.CallExpression[]>
}

/**
 * Output of {@link styleExprStageDef}.
 *
 * - `styleExprs` — per-file cache of collected style expressions and their call sites
 * - `derived` — forwarded from {@link derivedStageDef} for downstream stages
 */
export type StyleExprStageOut = {
    styleExprs: FileCache<StyleExprResult>
    derived: DerivedExtractorStageOut["derived"]
}

/**
 * Style expression collection.
 *
 * Walks the full AST to find every call expression whose callee is a known extractor
 * (from {@link derivedStageDef}'s merged extractor map). For each call, invokes
 * `extractor.extractStaticArgs` to collect the argument AST nodes, grouping them by
 * extractor and by call site.
 *
 * Parent-extractor calls (those that produce derived extractors) are tracked but excluded
 * from `extractedExpressions` — their derived children handle extraction instead.
 *
 * Depends on {@link derivedStageDef}.
 */
export const styleExprStageDef = defineStage({
    dependsOn: [derivedStageDef] as const,
    init(context: StageContext, derivedInst: DerivedExtractorStageOut): StyleExprStageOut {
        const { registry } = context
        const styleExprs = registry.fileCache(
            (file) => [derivedInst.derived.for(file), registry.fileData.for(file)],
            (file): StyleExprResult => {
                const { ast } = registry.fileData.for(file).get()
                const { mergedExtractorIds, parentCalls } = derivedInst.derived.for(file).get()

                const styleExpressions = new Set<SWC.Expression>()
                const extractedExpressions = new Map<StyleExtractor, SWC.Expression[]>()
                const extractedCallExpressions = new Map<StyleExtractor, SWC.CallExpression[]>()

                visit.module(
                    ast,
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

                return {
                    styleExpressions,
                    extractedExpressions,
                    extractedCallExpressions,
                }
            },
        )

        return {
            styleExprs,
            derived: derivedInst.derived,
        }
    },
})
