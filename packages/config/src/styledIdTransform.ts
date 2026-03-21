import * as SWC from "@swc/core"
import { shortHash } from "@mochi-css/vanilla"

const STABLE_ID_RE = /^s-[0-9A-Za-z_-]+$/

type StyledCall = {
    call: SWC.CallExpression
    varName: string | null
}

function collectStyledCalls(ast: SWC.Module): StyledCall[] {
    const results: StyledCall[] = []

    function visitExpr(expr: SWC.Expression, varName: string | null): void {
        if (expr.type === "CallExpression") {
            const callee = expr.callee
            const isStyled =
                (callee.type === "Identifier" && callee.value === "styled") ||
                (callee.type === "MemberExpression" &&
                    callee.property.type === "Identifier" &&
                    callee.property.value === "styled")
            if (isStyled) results.push({ call: expr, varName })
            for (const arg of expr.arguments) {
                visitExpr(arg.expression, null)
            }
        }
    }

    for (const item of ast.body) {
        if (item.type === "VariableDeclaration") {
            for (const d of item.declarations) {
                const name = d.id.type === "Identifier" ? d.id.value : null
                if (d.init) visitExpr(d.init, name)
            }
        } else if (item.type === "ExportDeclaration" && item.declaration.type === "VariableDeclaration") {
            for (const d of item.declaration.declarations) {
                const name = d.id.type === "Identifier" ? d.id.value : null
                if (d.init) visitExpr(d.init, name)
            }
        } else if (item.type === "ExpressionStatement") {
            visitExpr(item.expression, null)
        } else if (item.type === "ExportDefaultExpression") {
            visitExpr(item.expression, "default")
        }
    }

    return results
}

/**
 * Transforms source code to inject stable `s-` class IDs into every `styled()` call.
 * Idempotent: skips calls that already have an `s-` string as the last argument.
 */
export function transformStyledIds(source: string, filePath: string): string {
    if (!source.includes("styled")) return source

    let ast: SWC.Module
    try {
        ast = SWC.parseSync(source, {
            syntax: "typescript",
            tsx: filePath.endsWith(".tsx"),
            target: "es2022",
        })
    } catch {
        return source
    }

    const calls = collectStyledCalls(ast)
    if (calls.length === 0) return source

    // Filter out calls that already have a stable s- id as the last arg
    const toInject = calls.filter((entry) => {
        const args = entry.call.arguments
        if (args.length === 0) return true
        const last = args[args.length - 1]
        return !(last?.expression.type === "StringLiteral" && STABLE_ID_RE.test(last.expression.value))
    })

    if (toInject.length === 0) return source

    // SWC BytePos values are globally accumulated across parseSync calls within the
    // same process (e.g. vitest). We must convert to local source offsets by computing
    // sourceGlobalBase = global position of source[0].
    //
    // Strategy: process calls in source order (ascending span.start), find each
    // "styled(" occurrence in the source with indexOf, and derive sourceGlobalBase
    // from the first call's known global position vs its local position in the source.
    const sortedAsc = [...toInject].sort((a, b) => a.call.span.start - b.call.span.start)
    let sourceGlobalBase = 0
    let searchFrom = 0
    const callsWithOffset: { entry: StyledCall; offset: number }[] = []
    for (const entry of sortedAsc) {
        const idx = source.indexOf("styled(", searchFrom)
        if (idx < 0) continue
        if (callsWithOffset.length === 0) {
            // First call: derive sourceGlobalBase
            const callee = entry.call.callee
            const styledGlobal =
                callee.type === "Identifier" ? callee.span.start : (callee as SWC.MemberExpression).property.span.start
            sourceGlobalBase = styledGlobal - idx
        }
        callsWithOffset.push({ entry, offset: entry.call.span.end - sourceGlobalBase - 1 })
        searchFrom = idx + 1
    }

    // Sort descending by offset so earlier offsets stay valid after each insertion
    callsWithOffset.sort((a, b) => b.offset - a.offset)

    let result = source
    callsWithOffset.forEach(({ entry, offset }, i) => {
        const sortIdx = callsWithOffset.length - 1 - i
        const varName = entry.varName ?? String(sortIdx)
        const id = "s-" + shortHash(filePath + ":" + varName)
        if (offset < 0 || offset >= result.length || result[offset] !== ")") return
        result = result.slice(0, offset) + `, '${id}'` + result.slice(offset)
    })

    return result
}
