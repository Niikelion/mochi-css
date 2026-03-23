import { describe, it, expect } from "vitest"
import * as SWC from "@swc/core"
import { createAstProxy, wrapIndexWithProxies } from "@/AstProxy"
import { ProjectIndex } from "@/ProjectIndex"
import { parseSource } from "@/parse"
import { mochiCssFunctionExtractor } from "@/extractors/VanillaCssExtractor"

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

describe("wrapIndexWithProxies", () => {
    it("replaces fileInfo.ast with a proxy and restores originals after getDirtyFiles", async () => {
        const module = await parseSource(
            `import { css } from "@mochi-css/vanilla"
export const s = css({ color: "red" })`,
            "test.ts",
        )
        const index = new ProjectIndex([module], [mochiCssFunctionExtractor], () => null)

        const originalAst = index.files[0]?.[1]?.ast
        expect.assert(originalAst !== undefined)

        const proxied = wrapIndexWithProxies(index)
        const proxiedAst = index.files[0]?.[1]?.ast
        // The proxy is a different object than the original
        expect(proxiedAst).not.toBe(originalAst)

        proxied.getDirtyFiles()
        // Original ast is restored
        expect(index.files[0]?.[1]?.ast).toBe(originalAst)
    })

    it("getDirtyFiles returns paths for mutated files and not others", async () => {
        const moduleA = await parseSource(`export const x = 1`, "a.ts")
        const moduleB = await parseSource(`export const y = 2`, "b.ts")
        const index = new ProjectIndex([moduleA, moduleB], [], () => null)

        const proxied = wrapIndexWithProxies(index)
        // Mutate a.ts by accessing body[0] through the proxy then setting a property
        const fileA = index.files.find(([p]) => p === "a.ts")?.[1]
        expect.assert(fileA !== undefined)
        const item = fileA.ast.body[0]
        expect.assert(item !== undefined)
        ;(item as { span: { start: number; end: number; ctxt: number } }).span = { start: 99, end: 99, ctxt: 0 }

        const dirty = proxied.getDirtyFiles()
        expect(dirty.has("a.ts")).toBe(true)
        expect(dirty.has("b.ts")).toBe(false)
    })

    it("getDirtyFiles returns empty set when no mutations were made", async () => {
        const module = await parseSource(`export const x = 1`, "a.ts")
        const index = new ProjectIndex([module], [], () => null)

        const proxied = wrapIndexWithProxies(index)
        // No mutations
        const dirty = proxied.getDirtyFiles()
        expect(dirty.size).toBe(0)
    })
})
