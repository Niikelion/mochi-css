import { describe, it, expect } from "vitest"
import * as SWC from "@swc/core"
import { createAstProxy, wrapFilesWithProxies, type MutableFileEntry } from "@/AstProxy"

function makeMinimalAst(body: SWC.ModuleItem[] = []): SWC.Module {
    return { type: "Module", body, interpreter: "", span: { start: 0, end: 0, ctxt: 0 } }
}

function makeExprStatement(value: string): SWC.ModuleItem {
    return {
        type: "ExpressionStatement",
        expression: {
            type: "StringLiteral",
            value,
            raw: `"${value}"`,
            span: { start: 0, end: 0, ctxt: 0 },
        },
        span: { start: 0, end: 0, ctxt: 0 },
    }
}

describe("createAstProxy", () => {
    it("does not mark items dirty on reads", () => {
        const item = makeExprStatement("hello")
        const ast = makeMinimalAst([item])
        const { proxy, dirtyItems } = createAstProxy(ast)

        const _ = proxy.body[0]
        expect(dirtyItems.size).toBe(0)
    })

    it("marks the root module item dirty when a nested property is set", () => {
        const item = makeExprStatement("hello")
        const ast = makeMinimalAst([item])
        const { proxy, dirtyItems } = createAstProxy(ast)

        const proxiedItem = proxy.body[0]
        expect.assert(proxiedItem !== undefined)
        ;(proxiedItem as SWC.ExpressionStatement).span = { start: 1, end: 2, ctxt: 0 }

        expect(dirtyItems.has(item)).toBe(true)
        expect(dirtyItems.size).toBe(1)
    })

    it("marks only the mutated root item dirty, not siblings", () => {
        const item0 = makeExprStatement("first")
        const item1 = makeExprStatement("second")
        const ast = makeMinimalAst([item0, item1])
        const { proxy, dirtyItems } = createAstProxy(ast)

        const proxiedItem0 = proxy.body[0]
        expect.assert(proxiedItem0 !== undefined)
        ;(proxiedItem0 as SWC.ExpressionStatement).span = { start: 1, end: 2, ctxt: 0 }

        expect(dirtyItems.has(item0)).toBe(true)
        expect(dirtyItems.has(item1)).toBe(false)
        expect(dirtyItems.size).toBe(1)
    })

    it("marks items dirty when a deeply nested property is set", () => {
        const item = makeExprStatement("hello")
        const ast = makeMinimalAst([item])
        const { proxy, dirtyItems } = createAstProxy(ast)

        const proxiedItem = proxy.body[0]
        expect.assert(proxiedItem !== undefined)
        const expr = (proxiedItem as SWC.ExpressionStatement).expression as SWC.StringLiteral
        expr.value = "world"

        expect(dirtyItems.has(item)).toBe(true)
    })

    it("mutations go through to the real AST objects", () => {
        const item = makeExprStatement("hello")
        const ast = makeMinimalAst([item])
        const { proxy } = createAstProxy(ast)

        const proxiedItem = proxy.body[0]
        expect.assert(proxiedItem !== undefined)
        const expr = (proxiedItem as SWC.ExpressionStatement).expression as SWC.StringLiteral
        expr.value = "mutated"

        expect((item as SWC.ExpressionStatement).expression).toMatchObject({ value: "mutated" })
    })
})

describe("wrapFilesWithProxies", () => {
    it("replaces entry.ast with a proxy and restores original after getDirtyFiles", () => {
        const ast = makeMinimalAst([makeExprStatement("hello")])
        const entry: MutableFileEntry = { filePath: "test.ts", ast }

        const proxied = wrapFilesWithProxies([entry])
        const proxiedAst = entry.ast
        expect(proxiedAst).not.toBe(ast)

        proxied.getDirtyFiles()
        expect(entry.ast).toBe(ast)
    })

    it("getDirtyFiles returns paths for mutated files and not others", () => {
        const astA = makeMinimalAst([makeExprStatement("x")])
        const astB = makeMinimalAst([makeExprStatement("y")])
        const entryA: MutableFileEntry = { filePath: "a.ts", ast: astA }
        const entryB: MutableFileEntry = { filePath: "b.ts", ast: astB }

        const proxied = wrapFilesWithProxies([entryA, entryB])

        const item = entryA.ast.body[0]
        expect.assert(item !== undefined)
        ;(item as SWC.ExpressionStatement).span = { start: 99, end: 99, ctxt: 0 }

        const dirty = proxied.getDirtyFiles()
        expect(dirty.has("a.ts")).toBe(true)
        expect(dirty.has("b.ts")).toBe(false)
    })

    it("getDirtyFiles returns empty set when no mutations were made", () => {
        const entry: MutableFileEntry = { filePath: "a.ts", ast: makeMinimalAst([makeExprStatement("x")]) }
        const proxied = wrapFilesWithProxies([entry])
        expect(proxied.getDirtyFiles().size).toBe(0)
    })
})
