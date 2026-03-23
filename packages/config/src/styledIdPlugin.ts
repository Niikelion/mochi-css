import * as SWC from "@swc/core"
import { shortHash } from "@mochi-css/vanilla"
import { transformStyledIds, collectStyledCalls, STABLE_ID_RE } from "./styledIdTransform"
import type { MochiPlugin } from "@/config"

const DUMMY_SPAN: SWC.Span = { start: 0, end: 0, ctxt: 0 }

function hasStableId(call: SWC.CallExpression): boolean {
    const args = call.arguments
    if (args.length === 0) return false
    const last = args[args.length - 1]
    return last?.expression.type === "StringLiteral" && STABLE_ID_RE.test(last.expression.value)
}

/**
 * Returns a MochiPlugin that injects stable `s-` class IDs into every `styled()` call.
 * - Registers a `sourceTransform` for runtime source injection (Vite/Next `transform` hook).
 * - Registers an `analysisTransform` for CSS extraction via direct AST mutation.
 */
export function styledIdPlugin(): MochiPlugin {
    return {
        name: "mochi-styled-ids",
        onLoad(context) {
            context.sourceTransform.registerTransformation(
                (source, { filePath }) => transformStyledIds(source, filePath),
                { filter: "*.{ts,tsx,js,jsx}" },
            )

            context.analysisTransform.register((index) => {
                for (const [filePath, fileInfo] of index.files) {
                    const calls = collectStyledCalls(fileInfo.ast)
                    const toInject = calls.filter(({ call }) => !hasStableId(call))
                    toInject.forEach(({ call, varName }, i) => {
                        const id = "s-" + shortHash(filePath + ":" + (varName ?? String(i)))
                        call.arguments.push({
                            spread: undefined,
                            expression: { type: "StringLiteral", span: DUMMY_SPAN, value: id, raw: `'${id}'` },
                        })
                    })
                }
            })
        },
    }
}
