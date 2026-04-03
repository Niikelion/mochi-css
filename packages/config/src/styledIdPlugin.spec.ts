import { describe, it, expect } from "vitest"
import { styledIdPlugin } from "./styledIdPlugin"
import { FullContext } from "@/plugin"
import { type AnalysisContext, ProjectIndex, createDefaultStages, parseSource } from "@mochi-css/builder"
import type { StyleExtractor } from "@mochi-css/builder"
import type * as SWC from "@swc/core"

const mockStyledExtractor: StyleExtractor = {
    importPath: "@mochi-css/vanilla-react",
    symbolName: "styled",
    extractStaticArgs(call) {
        return call.arguments.map((a) => a.expression).slice(1)
    },
    startGeneration() {
        return {
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            collectArgs() {},
            async generateStyles() {
                return {}
            },
        }
    },
}

async function makeIndex(source: string, filePath = "src/Button.ts"): Promise<ProjectIndex> {
    const module = await parseSource(source, filePath)
    const stages = createDefaultStages([mockStyledExtractor])
    return new ProjectIndex([module], stages, () => null)
}

const fakeContext: AnalysisContext = {
    evaluator: undefined as unknown as AnalysisContext["evaluator"],
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    emitChunk: () => {},
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    markForEval: () => {},
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {}

describe("styledIdPlugin — filePreProcess (runtime injection)", () => {
    it("registers a file transformation via onLoad", () => {
        const plugin = styledIdPlugin([mockStyledExtractor])
        const context = new FullContext(noop)
        plugin.onLoad?.(context)
        expect(context.filePreProcess.getTransformations()).toHaveLength(1)
    })

    it("the registered transformation injects styled IDs", async () => {
        const plugin = styledIdPlugin([mockStyledExtractor])
        const context = new FullContext(noop)
        plugin.onLoad?.(context)

        const source = `const Button = styled('button', { color: 'red' })`
        const result = await context.filePreProcess.transform(source, { filePath: "Button.tsx" })
        expect(result).toMatch(/styled\('button', \{ color: 'red' }, 's-[0-9A-Za-z_-]+'\)/)
    })

    it("does not transform files outside the glob filter", async () => {
        const plugin = styledIdPlugin([mockStyledExtractor])
        const context = new FullContext(noop)
        plugin.onLoad?.(context)

        const source = `const Button = styled('button', { color: 'red' })`
        const result = await context.filePreProcess.transform(source, { filePath: "Button.css" })
        expect(result).toBe(source)
    })

    it("transforms all supported extensions", async () => {
        for (const ext of ["ts", "tsx", "js", "jsx"]) {
            const plugin = styledIdPlugin([mockStyledExtractor])
            const context = new FullContext(noop)
            plugin.onLoad?.(context)

            const source = `const Button = styled('button', {})`
            const result = await context.filePreProcess.transform(source, { filePath: `Button.${ext}` })
            expect(result).toContain("'s-")
        }
    })
})

describe("styledIdPlugin — sourceTransforms (AST mutation)", () => {
    it("registers an analysis hook via onLoad", () => {
        const plugin = styledIdPlugin([mockStyledExtractor])
        const context = new FullContext(noop)
        plugin.onLoad?.(context)
        expect(context.sourceTransforms.getAll()).toHaveLength(1)
    })

    it("injects s- ID into styled() call arguments", async () => {
        const plugin = styledIdPlugin([mockStyledExtractor])
        const context = new FullContext(noop)
        plugin.onLoad?.(context)

        const source = `import { styled } from "@mochi-css/vanilla-react"\nconst Button = styled('button', { color: 'red' })`
        const index = await makeIndex(source)
        await context.sourceTransforms.getAll()[0]?.(index, fakeContext)

        const fileInfo = index.files[0]?.[1]
        const varDecl = fileInfo?.ast.body[1] as SWC.VariableDeclaration
        const callExpr = varDecl.declarations[0]?.init as SWC.CallExpression
        expect(callExpr.arguments).toHaveLength(3)
        const injected = callExpr.arguments[2]?.expression as SWC.StringLiteral
        expect(injected.type).toBe("StringLiteral")
        expect(injected.value).toMatch(/^s-[0-9A-Za-z_-]+$/)
    })

    it("uses the variable name in the hash", async () => {
        const plugin = styledIdPlugin([mockStyledExtractor])
        const context = new FullContext(noop)
        plugin.onLoad?.(context)

        const source = `import { styled } from "@mochi-css/vanilla-react"\nconst Button = styled('button', {})\nconst Link = styled('a', {})`
        const index = await makeIndex(source)
        await context.sourceTransforms.getAll()[0]?.(index, fakeContext)

        const fileInfo = index.files[0]?.[1]
        const id0 = ((fileInfo?.ast.body[1] as SWC.VariableDeclaration).declarations[0]?.init as SWC.CallExpression)
            .arguments[2]?.expression as SWC.StringLiteral
        const id1 = ((fileInfo?.ast.body[2] as SWC.VariableDeclaration).declarations[0]?.init as SWC.CallExpression)
            .arguments[2]?.expression as SWC.StringLiteral
        expect(id0.value).not.toBe(id1.value)
    })

    it("is idempotent — does not inject if s- ID already present", async () => {
        const plugin = styledIdPlugin([mockStyledExtractor])
        const context = new FullContext(noop)
        plugin.onLoad?.(context)

        const source = `import { styled } from "@mochi-css/vanilla-react"\nconst Button = styled('button', { color: 'red' })`
        const index = await makeIndex(source)
        const [hook] = context.sourceTransforms.getAll()
        await hook?.(index, fakeContext)
        await hook?.(index, fakeContext)

        const fileInfo = index.files[0]?.[1]
        const varDecl = fileInfo?.ast.body[1] as SWC.VariableDeclaration
        const callExpr = varDecl.declarations[0]?.init as SWC.CallExpression
        expect(callExpr.arguments).toHaveLength(3)
    })

    it("handles exported styled calls", async () => {
        const plugin = styledIdPlugin([mockStyledExtractor])
        const context = new FullContext(noop)
        plugin.onLoad?.(context)

        const source = `import { styled } from "@mochi-css/vanilla-react"\nexport const Card = styled('section', { padding: 16 })`
        const index = await makeIndex(source)
        await context.sourceTransforms.getAll()[0]?.(index, fakeContext)

        const fileInfo = index.files[0]?.[1]
        const exportDecl = fileInfo?.ast.body[1] as SWC.ExportDeclaration
        const varDecl = exportDecl.declaration as SWC.VariableDeclaration
        const callExpr = varDecl.declarations[0]?.init as SWC.CallExpression
        expect(callExpr.arguments).toHaveLength(3)
        const injected = callExpr.arguments[2]?.expression as SWC.StringLiteral
        expect(injected.value).toMatch(/^s-[0-9A-Za-z_-]+$/)
    })
})
