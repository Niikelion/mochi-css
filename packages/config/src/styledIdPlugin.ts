import * as SWC from "@swc/core"
import { shortHash } from "@mochi-css/core"
import { transformCallIds, STABLE_ID_RE } from "./styledIdTransform"
import type { MochiPlugin } from "@/config"
import type { StyleExtractor } from "@mochi-css/builder"

const DUMMY_SPAN: SWC.Span = { start: 0, end: 0, ctxt: 0 }

function hasStableId(call: SWC.CallExpression): boolean {
    const args = call.arguments
    if (args.length === 0) return false
    const last = args[args.length - 1]
    return last?.expression.type === "StringLiteral" && STABLE_ID_RE.test(last.expression.value)
}

/**
 * Returns a MochiPlugin that injects stable `s-` class IDs into every call expression
 * matched by the given extractors.
 * - Registers a `filePreProcess` transformation for runtime source injection (Vite/Next `transform` hook).
 * - Registers a `sourceTransforms` hook for CSS extraction via direct AST mutation,
 *   using data from the extractor pipeline stages (`extractedCallExpressions`).
 */
export function styledIdPlugin(extractors: StyleExtractor[]): MochiPlugin {
    const symbolNames = new Set(extractors.map((e) => e.symbolName))

    return {
        name: "mochi-styled-ids",
        onLoad(context) {
            context.filePreProcess.registerTransformation(
                (source, { filePath }) => transformCallIds(source, filePath, symbolNames),
                { filter: "*.{ts,tsx,js,jsx}" },
            )

            context.sourceTransforms.register((index) => {
                for (const [filePath, fileInfo] of index.files) {
                    // Build a reverse map: call expression node → variable name, using
                    // reference identity against module-level variable bindings.
                    const callToVarName = new Map<SWC.CallExpression, string>()
                    for (const binding of fileInfo.moduleBindings.values()) {
                        if (binding.declarator.type !== "variable") continue
                        const init = binding.declarator.declarator.init
                        if (init?.type === "CallExpression") {
                            callToVarName.set(init, binding.identifier.value)
                        }
                    }

                    let fallbackIdx = 0
                    for (const extractor of extractors) {
                        const calls = fileInfo.extractedCallExpressions.get(extractor) ?? []
                        for (const call of calls) {
                            if (hasStableId(call)) continue
                            const varName = callToVarName.get(call) ?? String(fallbackIdx++)
                            const id = "s-" + shortHash(filePath + ":" + varName)
                            call.arguments.push({
                                spread: undefined,
                                expression: {
                                    type: "StringLiteral",
                                    span: DUMMY_SPAN,
                                    value: id,
                                    raw: `'${id}'`,
                                },
                            })
                        }
                    }
                }
            })
        },
    }
}
