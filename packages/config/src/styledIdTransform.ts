import * as SWC from "@swc/core"
import { shortHash } from "@mochi-css/core"

export const STABLE_ID_RE = /^s-[0-9A-Za-z_-]+$/

export type StyledCall = {
    call: SWC.CallExpression
    varName: string | null
}

export function collectCallsBySymbol(ast: SWC.Module, symbolNames: Set<string>): StyledCall[] {
    const results: StyledCall[] = []

    function visitExpr(expr: SWC.Expression, varName: string | null): void {
        if (expr.type === "CallExpression") {
            const callee = expr.callee
            const isMatch =
                (callee.type === "Identifier" && symbolNames.has(callee.value)) ||
                (callee.type === "MemberExpression" &&
                    callee.property.type === "Identifier" &&
                    symbolNames.has(callee.property.value))
            if (isMatch) results.push({ call: expr, varName })
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
 * Transforms source code to inject stable `s-` class IDs into every call matching
 * one of the given symbol names. Idempotent: skips calls that already have an `s-`
 * string as the last argument.
 */
export function transformCallIds(source: string, filePath: string, symbolNames: Set<string>): string {
    if (![...symbolNames].some((name) => source.includes(name))) return source

    let ast: SWC.Module
    try {
        ast = SWC.parseSync(source, {
            syntax: "typescript",
            tsx: filePath.endsWith(".tsx") || filePath.endsWith(".jsx"),
            target: "es2022",
        })
    } catch {
        return source
    }

    const calls = collectCallsBySymbol(ast, symbolNames)
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
    // symbol occurrence in the source with indexOf, and derive sourceGlobalBase
    // from the first call's known global position vs its local position in the source.
    const sortedAsc = [...toInject].sort((a, b) => a.call.span.start - b.call.span.start)
    let sourceGlobalBase = 0
    let searchFrom = 0
    const callsWithOffset: { entry: StyledCall; offset: number }[] = []
    for (const entry of sortedAsc) {
        const symbolName =
            entry.call.callee.type === "Identifier"
                ? entry.call.callee.value
                : entry.call.callee.type === "MemberExpression" && entry.call.callee.property.type === "Identifier"
                  ? entry.call.callee.property.value
                  : null
        if (!symbolName) continue
        const idx = source.indexOf(symbolName + "(", searchFrom)
        if (idx < 0) continue
        if (callsWithOffset.length === 0) {
            // First call: derive sourceGlobalBase
            const callee = entry.call.callee
            const symbolGlobal =
                callee.type === "Identifier" ? callee.span.start : (callee as SWC.MemberExpression).property.span.start
            sourceGlobalBase = symbolGlobal - idx
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
