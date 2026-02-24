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
            expect(onDiagnostic).toHaveBeenCalledWith(expect.objectContaining({
                code: "MOCHI_INVALID_STYLE_ARG",
                severity: "warning",
                file: "a.ts",
            }))
        })

        it("reports diagnostic for non-object args", () => {
            const onDiagnostic = vi.fn()
            const gen = new VanillaCssGenerator(onDiagnostic)
            gen.collectArgs("a.ts", ["string", 42])
            expect(onDiagnostic).toHaveBeenCalledTimes(2)
        })

        it("does not collect when all args are invalid", async () => {
            const gen = new VanillaCssGenerator()
            gen.collectArgs("a.ts", [null, "invalid"])
            const result = await gen.generateStyles()
            expect(result.files).toEqual({})
        })
    })

    describe("generateStyles", () => {
        it("accumulates styles from same source across multiple collectArgs calls", async () => {
            const gen = new VanillaCssGenerator()
            gen.collectArgs("a.ts", [{ color: "red" }])
            gen.collectArgs("a.ts", [{ color: "blue" }])
            const result = await gen.generateStyles()
            expect(result.files?.["a.ts"]).toContain("color: red")
            expect(result.files?.["a.ts"]).toContain("color: blue")
        })

        it("reports diagnostic when CSS generation fails", async () => {
            const onDiagnostic = vi.fn()
            const gen = new VanillaCssGenerator(onDiagnostic)
            vi.spyOn(CSSObject.prototype, "asCssString").mockImplementationOnce(() => {
                throw new Error("generation failed")
            })
            gen.collectArgs("a.ts", [{ color: "red" }])
            await gen.generateStyles()
            expect(onDiagnostic).toHaveBeenCalledWith(expect.objectContaining({
                code: "MOCHI_STYLE_GENERATION",
                severity: "warning",
                file: "a.ts",
            }))
        })
    })
})