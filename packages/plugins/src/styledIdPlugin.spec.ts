import { describe, it, expect } from "vitest"
import { styledIdPlugin } from "./styledIdPlugin"
import { FullContext } from "@mochi-css/config"
import { parseSource, StageRunner } from "@mochi-css/builder"
import type { StyleExtractor } from "./types"
import type * as SWC from "@swc/core"

const mockStyledExtractor: StyleExtractor = {
    importPath: "@mochi-css/vanilla-react",
    symbolName: "styled",
    extractStaticArgs(call) {
        return call.arguments.map((a) => a.expression).slice(1)
    },
    startGeneration() {
        return {
            mockFunction() {
                /* empty */
            },
            collectArgs() {
                /* empty */
            },
            extractSubstitution() {
                return null
            },
            async generateStyles() {
                return {}
            },
        }
    },
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
        const result = await context.filePreProcess.transform(source, {
            filePath: "Button.tsx",
        })
        expect(result).toMatch(/styled\('button', \{ color: 'red' }, 's-[0-9A-Za-z_-]+'\)/)
    })

    it("does not transform files outside the glob filter", async () => {
        const plugin = styledIdPlugin([mockStyledExtractor])
        const context = new FullContext(noop)
        plugin.onLoad?.(context)

        const source = `const Button = styled('button', { color: 'red' })`
        const result = await context.filePreProcess.transform(source, {
            filePath: "Button.css",
        })
        expect(result).toBe(source)
    })

    it("transforms all supported extensions", async () => {
        for (const ext of ["ts", "tsx", "js", "jsx"]) {
            const plugin = styledIdPlugin([mockStyledExtractor])
            const context = new FullContext(noop)
            plugin.onLoad?.(context)

            const source = `const Button = styled('button', {})`
            const result = await context.filePreProcess.transform(source, {
                filePath: `Button.${ext}`,
            })
            expect(result).toContain("'s-")
        }
    })
})

describe("styledIdPlugin — sourceTransforms (AST mutation)", () => {
    async function runSourceTransform(source: string, filePath = "src/Button.ts") {
        const plugin = styledIdPlugin([mockStyledExtractor])
        const context = new FullContext(noop)
        plugin.onLoad?.(context)

        const module = await parseSource(source, filePath)
        const runner = new StageRunner([module], [], noop, () => null)

        const transforms = context.sourceTransforms.getAll()
        const fakeCtx = {
            evaluator: undefined as never,
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            emitChunk: () => {},
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            markForEval: () => {},
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            emitModifiedSource: () => {},
        }
        for (const transform of transforms) {
            await transform(runner, fakeCtx)
        }

        return module
    }

    it("registers an analysis hook via onLoad", () => {
        const plugin = styledIdPlugin([mockStyledExtractor])
        const context = new FullContext(noop)
        plugin.onLoad?.(context)
        expect(context.sourceTransforms.getAll()).toHaveLength(1)
    })

    it("injects s- ID into styled() call arguments", async () => {
        const source = `import { styled } from "@mochi-css/vanilla-react"\nconst Button = styled('button', { color: 'red' })`
        const module = await runSourceTransform(source)

        const varDecl = module.ast.body[1] as SWC.VariableDeclaration
        const callExpr = varDecl.declarations[0]?.init as SWC.CallExpression
        expect(callExpr.arguments).toHaveLength(3)
        const injected = callExpr.arguments[2]?.expression as SWC.StringLiteral
        expect(injected.type).toBe("StringLiteral")
        expect(injected.value).toMatch(/^s-[0-9A-Za-z_-]+$/)
    })

    it("uses the variable name in the hash", async () => {
        const source = `import { styled } from "@mochi-css/vanilla-react"\nconst Button = styled('button', {})\nconst Link = styled('a', {})`
        const module = await runSourceTransform(source)

        const id0 = ((module.ast.body[1] as SWC.VariableDeclaration).declarations[0]?.init as SWC.CallExpression)
            .arguments[2]?.expression as SWC.StringLiteral
        const id1 = ((module.ast.body[2] as SWC.VariableDeclaration).declarations[0]?.init as SWC.CallExpression)
            .arguments[2]?.expression as SWC.StringLiteral
        expect(id0.value).not.toBe(id1.value)
    })

    it("is idempotent — does not inject if s- ID already present", async () => {
        const source = `import { styled } from "@mochi-css/vanilla-react"\nconst Button = styled('button', { color: 'red' })`
        const plugin = styledIdPlugin([mockStyledExtractor])
        const context = new FullContext(noop)
        plugin.onLoad?.(context)

        const module = await parseSource(source, "src/Button.ts")
        const runner = new StageRunner([module], [], noop, () => null)

        const fakeCtx = {
            evaluator: undefined as never,
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            emitChunk: () => {},
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            markForEval: () => {},
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            emitModifiedSource: () => {},
        }
        const [hook] = context.sourceTransforms.getAll()
        await hook?.(runner, fakeCtx)
        await hook?.(runner, fakeCtx)

        const varDecl = module.ast.body[1] as SWC.VariableDeclaration
        const callExpr = varDecl.declarations[0]?.init as SWC.CallExpression
        expect(callExpr.arguments).toHaveLength(3)
    })

    it("handles exported styled calls", async () => {
        const source = `import { styled } from "@mochi-css/vanilla-react"\nexport const Card = styled('section', { padding: 16 })`
        const module = await runSourceTransform(source)

        const exportDecl = module.ast.body[1] as SWC.ExportDeclaration
        const varDecl = exportDecl.declaration as SWC.VariableDeclaration
        const callExpr = varDecl.declarations[0]?.init as SWC.CallExpression
        expect(callExpr.arguments).toHaveLength(3)
        const injected = callExpr.arguments[2]?.expression as SWC.StringLiteral
        expect(injected.value).toMatch(/^s-[0-9A-Za-z_-]+$/)
    })
})
