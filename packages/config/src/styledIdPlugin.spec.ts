import { describe, it, expect } from "vitest"
import * as SWC from "@swc/core"
import { styledIdPlugin } from "./styledIdPlugin"
import { FullContext } from "@/plugin"
import { type AnalysisContext, ProjectIndex } from "@mochi-css/builder"

function makeIndex(source: string, filePath = "src/Button.ts"): ProjectIndex {
    const ast = SWC.parseSync(source, { syntax: "typescript" })
    return { files: [[filePath, { ast }]] } as unknown as ProjectIndex
}

const fakeContext: AnalysisContext = {
    evaluator: undefined as unknown as AnalysisContext["evaluator"],
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    emitChunk: () => {},
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    markForEval: () => {},
}

describe("styledIdPlugin — sourceTransform (runtime injection)", () => {
    it("registers a source transformation via onLoad", () => {
        const plugin = styledIdPlugin()
        const context = new FullContext()
        plugin.onLoad?.(context)
        expect(context.sourceTransform.getTransformations()).toHaveLength(1)
    })

    it("the registered transformation injects styled IDs", async () => {
        const plugin = styledIdPlugin()
        const context = new FullContext()
        plugin.onLoad?.(context)

        const source = `const Button = styled('button', { color: 'red' })`
        const result = await context.sourceTransform.transform(source, { filePath: "Button.tsx" })
        expect(result).toMatch(/styled\('button', \{ color: 'red' }, 's-[0-9A-Za-z_-]+'\)/)
    })

    it("does not transform files outside the glob filter", async () => {
        const plugin = styledIdPlugin()
        const context = new FullContext()
        plugin.onLoad?.(context)

        const source = `const Button = styled('button', { color: 'red' })`
        const result = await context.sourceTransform.transform(source, { filePath: "Button.css" })
        expect(result).toBe(source)
    })

    it("transforms all supported extensions", async () => {
        for (const ext of ["ts", "tsx", "js", "jsx"]) {
            const plugin = styledIdPlugin()
            const context = new FullContext()
            plugin.onLoad?.(context)

            const source = `const Button = styled('button', {})`
            const result = await context.sourceTransform.transform(source, { filePath: `Button.${ext}` })
            expect(result).toContain("'s-")
        }
    })
})

describe("styledIdPlugin — analysisTransform (AST mutation)", () => {
    it("registers an analysis hook via onLoad", () => {
        const plugin = styledIdPlugin()
        const context = new FullContext()
        plugin.onLoad?.(context)
        expect(context.getAnalysisHooks()).toHaveLength(1)
    })

    it("injects s- ID into styled() call arguments", async () => {
        const plugin = styledIdPlugin()
        const context = new FullContext()
        plugin.onLoad?.(context)

        const index = makeIndex(`const Button = styled('button', { color: 'red' })`)
        await context.getAnalysisHooks()[0]?.(index, fakeContext)

        const ast = [...index.files.values()][0]?.[1]?.ast
        const varDecl = ast?.body[0] as SWC.VariableDeclaration
        const callExpr = varDecl.declarations[0]?.init as SWC.CallExpression
        expect(callExpr.arguments).toHaveLength(3)
        const injected = callExpr.arguments[2]?.expression as SWC.StringLiteral
        expect(injected.type).toBe("StringLiteral")
        expect(injected.value).toMatch(/^s-[0-9A-Za-z_-]+$/)
    })

    it("uses the variable name in the hash", async () => {
        const plugin = styledIdPlugin()
        const context = new FullContext()
        plugin.onLoad?.(context)

        const index = makeIndex(`const Button = styled('button', {})\nconst Link = styled('a', {})`)
        await context.getAnalysisHooks()[0]?.(index, fakeContext)

        const ast = [...index.files.values()][0]?.[1]?.ast
        const id0 = ((ast?.body[0] as SWC.VariableDeclaration).declarations[0]?.init as SWC.CallExpression).arguments[2]
            ?.expression as SWC.StringLiteral
        const id1 = ((ast?.body[1] as SWC.VariableDeclaration).declarations[0]?.init as SWC.CallExpression).arguments[2]
            ?.expression as SWC.StringLiteral
        expect(id0.value).not.toBe(id1.value)
    })

    it("is idempotent — does not inject if s- ID already present", async () => {
        const plugin = styledIdPlugin()
        const context = new FullContext()
        plugin.onLoad?.(context)

        const index = makeIndex(`const Button = styled('button', { color: 'red' })`)
        const [hook] = context.getAnalysisHooks()
        await hook?.(index, fakeContext)
        await hook?.(index, fakeContext)

        const ast = [...index.files.values()][0]?.[1]?.ast
        const varDecl = ast?.body[0] as SWC.VariableDeclaration
        const callExpr = varDecl.declarations[0]?.init as SWC.CallExpression
        expect(callExpr.arguments).toHaveLength(3)
    })

    it("handles exported styled calls", async () => {
        const plugin = styledIdPlugin()
        const context = new FullContext()
        plugin.onLoad?.(context)

        const index = makeIndex(`export const Card = styled('section', { padding: 16 })`)
        await context.getAnalysisHooks()[0]?.(index, fakeContext)

        const ast = [...index.files.values()][0]?.[1]?.ast
        const exportDecl = ast?.body[0] as SWC.ExportDeclaration
        const varDecl = exportDecl.declaration as SWC.VariableDeclaration
        const callExpr = varDecl.declarations[0]?.init as SWC.CallExpression
        expect(callExpr.arguments).toHaveLength(3)
        const injected = callExpr.arguments[2]?.expression as SWC.StringLiteral
        expect(injected.value).toMatch(/^s-[0-9A-Za-z_-]+$/)
    })
})
