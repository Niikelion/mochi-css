import { describe, it, expect, vi, afterEach } from "vitest"
import { VanillaCssGenerator } from "./VanillaCssGenerator"
import { CSSObject } from "@mochi-css/vanilla"

describe("VanillaCssGenerator", () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe("collectArgs", () => {
        it("reports diagnostic for null arg", () => {
            const onDiagnostic = vi.fn()
            const gen = new VanillaCssGenerator(onDiagnostic)
            gen.collectArgs("a.ts", [null])
            expect(onDiagnostic).toHaveBeenCalledWith(
                expect.objectContaining({
                    code: "MOCHI_INVALID_STYLE_ARG",
                    severity: "warning",
                    file: "a.ts",
                }),
            )
        })

        it("reports diagnostic for non-object, non-string args", () => {
            const onDiagnostic = vi.fn()
            const gen = new VanillaCssGenerator(onDiagnostic)
            gen.collectArgs("a.ts", [42])
            expect(onDiagnostic).toHaveBeenCalledTimes(1)
        })

        it("does not report diagnostic for string args", () => {
            const onDiagnostic = vi.fn()
            const gen = new VanillaCssGenerator(onDiagnostic)
            gen.collectArgs("a.ts", ["my-class", "s-Abc12345"])
            expect(onDiagnostic).not.toHaveBeenCalled()
        })

        it("does not collect when all args are invalid", async () => {
            const gen = new VanillaCssGenerator()
            gen.collectArgs("a.ts", [null, "invalid"])
            const result = await gen.generateStyles()
            expect(result.files).toEqual({})
        })
    })

    describe("stableId (string arg)", () => {
        it("uses string arg as the CSS class name", async () => {
            const gen = new VanillaCssGenerator()
            gen.collectArgs("a.ts", [{ color: "red" }, "s-abc"])
            const result = await gen.generateStyles()
            expect(result.files["a.ts"]).toContain(".s-abc")
            expect(result.files["a.ts"]).not.toMatch(/\.c[0-9a-f]+/)
        })

        it("uses last string arg as stableId when multiple strings provided", async () => {
            const gen = new VanillaCssGenerator()
            gen.collectArgs("a.ts", [{ color: "red" }, "s-first", "s-last"])
            const result = await gen.generateStyles()
            expect(result.files["a.ts"]).toContain(".s-last")
            expect(result.files["a.ts"]).not.toContain(".s-first")
        })

        it("ignores string when no style objects are present", async () => {
            const gen = new VanillaCssGenerator()
            gen.collectArgs("a.ts", ["s-abc"])
            const result = await gen.generateStyles()
            expect(result.files).toEqual({})
        })

        it("generates hash-based class name when no string arg provided", async () => {
            const gen = new VanillaCssGenerator()
            gen.collectArgs("a.ts", [{ color: "red" }])
            const result = await gen.generateStyles()
            expect(result.files["a.ts"]).toMatch(/\.c[0-9a-f]+/)
        })
    })

    describe("getArgReplacements", () => {
        it("returns a NewExpression for MochiCSS after generateStyles", async () => {
            const gen = new VanillaCssGenerator()
            gen.collectArgs("a.ts", [{ color: "red" }, "s-abc"])
            await gen.generateStyles()
            const replacements = gen.getArgReplacements()
            expect(replacements).toHaveLength(1)
            const expr = replacements[0]?.expression
            expect(expr?.type).toBe("NewExpression")
        })

        it("returns one replacement per collectArgs call", async () => {
            const gen = new VanillaCssGenerator()
            gen.collectArgs("a.ts", [{ color: "red" }])
            gen.collectArgs("b.ts", [{ color: "blue" }])
            await gen.generateStyles()
            const replacements = gen.getArgReplacements()
            expect(replacements).toHaveLength(2)
            expect(replacements[0]?.source).toBe("a.ts")
            expect(replacements[1]?.source).toBe("b.ts")
        })

        it("returns empty array before generateStyles is called", () => {
            const gen = new VanillaCssGenerator()
            gen.collectArgs("a.ts", [{ color: "red" }])
            const replacements = gen.getArgReplacements()
            expect(replacements).toHaveLength(0)
        })
    })

    describe("generateStyles", () => {
        it("accumulates styles from same source across multiple collectArgs calls", async () => {
            const gen = new VanillaCssGenerator()
            gen.collectArgs("a.ts", [{ color: "red" }])
            gen.collectArgs("a.ts", [{ color: "blue" }])
            const result = await gen.generateStyles()
            expect(result.files["a.ts"]).toContain("color: red")
            expect(result.files["a.ts"]).toContain("color: blue")
        })

        it("reports diagnostic when CSS generation fails", async () => {
            const onDiagnostic = vi.fn()
            const gen = new VanillaCssGenerator(onDiagnostic)
            vi.spyOn(CSSObject.prototype, "asCssString").mockImplementationOnce(() => {
                throw new Error("generation failed")
            })
            gen.collectArgs("a.ts", [{ color: "red" }])
            await gen.generateStyles()
            expect(onDiagnostic).toHaveBeenCalledWith(
                expect.objectContaining({
                    code: "MOCHI_STYLE_GENERATION",
                    severity: "warning",
                    file: "a.ts",
                }),
            )
        })
    })
})
