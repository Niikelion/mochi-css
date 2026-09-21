import { describe, it, expect } from "vitest"
import * as SWC from "@swc/core"
import { wrapModuleItemsForResilience } from "./resilientModuleWrap"

/**
 * Parses `source`, wraps its module items for resilience, prints the result, and transpiles it
 * to CJS so it can actually be executed — verifying real runtime behavior, not just AST shape.
 */
async function buildResilientModule(filePath: string, source: string): Promise<string> {
    const parsed = await SWC.parse(source, { syntax: "typescript", tsx: false })
    const body = wrapModuleItemsForResilience(filePath, parsed.body)

    const printed = SWC.printSync({ type: "Module", span: parsed.span, body, interpreter: "" }).code

    const { code } = await SWC.transform(printed, {
        jsc: { target: "es2022", parser: { syntax: "ecmascript" } },
        module: { type: "commonjs" },
    })
    // SWC's printer always emits a leading `#!` line for `interpreter: ""` (harmless in the real
    // pipeline — Rolldown strips it); `new Function` can't parse a shebang mid-body, so drop it here.
    return code.replace(/^#!.*\n/, "")
}

/**
 * Executes CJS `code`, providing `__global_mochi_diagnostics` as a bare ambient global — exactly
 * how the real Builder wires it up via `evaluator.setGlobal(...)` (never imported).
 */
function runModule(code: string, diagnostics: unknown[]): Record<string, unknown> {
    const moduleObj = { exports: {} as Record<string, unknown> }
    const collectDiagnostic = (d: unknown) => diagnostics.push(d)
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const fn = new Function("module", "exports", "__global_mochi_diagnostics", code) as (
        module: unknown,
        exports: unknown,
        __global_mochi_diagnostics: unknown,
    ) => void
    fn(moduleObj, moduleObj.exports, collectDiagnostic)
    return moduleObj.exports
}

describe("wrapModuleItemsForResilience", () => {
    it("leaves import declarations untouched, outside any try block", async () => {
        const code = await buildResilientModule("file.ts", `import { foo } from "bar"\nexport const x = foo()`)
        expect(code).toContain(`require("bar")`)
        // The import must not be inside the try block — printed CJS requires run at top level.
        const requireIndex = code.indexOf('require("bar")')
        const tryIndex = code.indexOf("try {")
        expect(requireIndex).toBeLessThan(tryIndex)
    })

    it("still exports the real value when nothing throws", async () => {
        const code = await buildResilientModule("file.ts", `export const x = 1 + 1`)
        const diagnostics: unknown[] = []
        const exports = runModule(code, diagnostics)
        expect(exports["x"]).toBe(2)
        expect(diagnostics).toEqual([])
    })

    it("degrades a throwing exported binding to undefined and reports a diagnostic", async () => {
        const code = await buildResilientModule(
            "src/broken.ts",
            `function boom() { throw new Error("kaboom") }\nexport const x = boom()`,
        )
        const diagnostics: { code: string; severity: string; file: string; message: string }[] = []
        const exports = runModule(code, diagnostics)
        expect(exports["x"]).toBeUndefined()
        expect(diagnostics).toHaveLength(1)
        expect(diagnostics[0]).toMatchObject({
            code: "MOCHI_FILE_EXEC",
            severity: "warning",
            file: "src/broken.ts",
            message: "kaboom",
        })
    })

    it("a later statement's throw doesn't prevent an earlier export from having its real value", async () => {
        const code = await buildResilientModule(
            "file.ts",
            `export const early = 1\nfunction boom() { throw new Error("late") }\nexport const late = boom()`,
        )
        const diagnostics: unknown[] = []
        const exports = runModule(code, diagnostics)
        expect(exports["early"]).toBe(1)
        expect(exports["late"]).toBeUndefined()
        expect(diagnostics).toHaveLength(1)
    })

    it("handles multiple exported declarators in one statement", async () => {
        const code = await buildResilientModule("file.ts", `export const a = 1, b = 2`)
        const diagnostics: unknown[] = []
        const exports = runModule(code, diagnostics)
        expect(exports["a"]).toBe(1)
        expect(exports["b"]).toBe(2)
    })

    it("handles destructured exported declarations", async () => {
        const code = await buildResilientModule(
            "file.ts",
            `function makePair() { return { a: 1, b: 2 } }\nexport const { a, b } = makePair()`,
        )
        const diagnostics: unknown[] = []
        const exports = runModule(code, diagnostics)
        expect(exports["a"]).toBe(1)
        expect(exports["b"]).toBe(2)
    })

    it("handles an exported function declaration, including when it throws at call time elsewhere", async () => {
        const code = await buildResilientModule("file.ts", `export function add(a, b) { return a + b }`)
        const diagnostics: unknown[] = []
        const exports = runModule(code, diagnostics)
        expect(typeof exports["add"]).toBe("function")
        expect((exports["add"] as (a: number, b: number) => number)(2, 3)).toBe(5)
        expect(diagnostics).toEqual([])
    })

    it("handles an exported class declaration", async () => {
        const code = await buildResilientModule("file.ts", `export class Box { value = 42 }`)
        const diagnostics: unknown[] = []
        const exports = runModule(code, diagnostics)
        const Box = exports["Box"] as new () => { value: number }
        expect(new Box().value).toBe(42)
    })

    it("handles export default", async () => {
        const code = await buildResilientModule("file.ts", `export default 1 + 1`)
        const diagnostics: unknown[] = []
        const exports = runModule(code, diagnostics)
        expect(exports["default"]).toBe(2)
    })

    it("degrades export default to undefined when it throws", async () => {
        const code = await buildResilientModule(
            "file.ts",
            `function boom() { throw new Error("bad default") }\nexport default boom()`,
        )
        const diagnostics: unknown[] = []
        const exports = runModule(code, diagnostics)
        expect(exports["default"]).toBeUndefined()
        expect(diagnostics).toHaveLength(1)
    })

    it("leaves non-exported statements usable by later statements in the same file", async () => {
        const code = await buildResilientModule(
            "file.ts",
            `const helper = (n) => n * 2\nexport const result = helper(21)`,
        )
        const diagnostics: unknown[] = []
        const exports = runModule(code, diagnostics)
        expect(exports["result"]).toBe(42)
    })

    it("a throw in a non-exported helper still degrades a downstream export instead of crashing the module", async () => {
        const code = await buildResilientModule(
            "file.ts",
            `function helper() { throw new Error("helper broke") }\nexport const result = helper()`,
        )
        const diagnostics: unknown[] = []
        const exports = runModule(code, diagnostics)
        expect(exports["result"]).toBeUndefined()
        expect(diagnostics).toHaveLength(1)
    })

    it("returns only the imports unchanged when there are no other statements", () => {
        const items: SWC.ModuleItem[] = [
            {
                type: "ImportDeclaration",
                span: { start: 0, end: 0, ctxt: 0 },
                specifiers: [],
                source: { type: "StringLiteral", span: { start: 0, end: 0, ctxt: 0 }, value: "bar" },
                typeOnly: false,
            },
        ]
        const result = wrapModuleItemsForResilience("file.ts", items)
        expect(result).toEqual(items)
    })

    it("returns an empty array for an empty input", () => {
        expect(wrapModuleItemsForResilience("file.ts", [])).toEqual([])
    })
})
