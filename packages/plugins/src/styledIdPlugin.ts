import * as SWC from "@swc/core"
import { shortHash } from "@mochi-css/core"
import { transformCallIds, collectCallsBySymbol, STABLE_ID_RE } from "./styledIdTransform"
import type { MochiPlugin } from "@mochi-css/config"
import type { StyleExtractor } from "./types"

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
 * - Registers a `sourceTransforms` hook for CSS extraction via direct AST mutation.
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

            context.sourceTransforms.register((runner) => {
                for (const filePath of runner.getFilePaths()) {
                    const { ast } = runner.engine.fileData.for(filePath).get()
                    const styledCalls = collectCallsBySymbol(ast, symbolNames)
                    let fallbackIdx = 0
                    for (const { call, varName } of styledCalls) {
                        if (hasStableId(call)) continue
                        const name = varName ?? String(fallbackIdx++)
                        const id = "s-" + shortHash(filePath + ":" + name)
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
            })
        },
    }
}
