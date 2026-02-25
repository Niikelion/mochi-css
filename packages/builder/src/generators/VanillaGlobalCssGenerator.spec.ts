import { describe, it, expect, vi, afterEach } from "vitest"
import { VanillaGlobalCssGenerator } from "./VanillaGlobalCssGenerator"
import { GlobalCssObject } from "@mochi-css/vanilla"

describe("VanillaGlobalCssGenerator", () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe("collectArgs", () => {
        it("reports diagnostic for null arg", () => {
            const onDiagnostic = vi.fn()
            const gen = new VanillaGlobalCssGenerator(onDiagnostic)
            gen.collectArgs("a.ts", [null])
            expect(onDiagnostic).toHaveBeenCalledWith(
                expect.objectContaining({
                    code: "MOCHI_INVALID_GLOBAL_CSS_ARG",
                    severity: "warning",
                    file: "a.ts",
                }),
            )
        })

        it("reports diagnostic for non-object args", () => {
            const onDiagnostic = vi.fn()
            const gen = new VanillaGlobalCssGenerator(onDiagnostic)
            gen.collectArgs("a.ts", ["string", 42])
            expect(onDiagnostic).toHaveBeenCalledTimes(2)
        })

        it("does not collect when all args are invalid", async () => {
            const gen = new VanillaGlobalCssGenerator()
            gen.collectArgs("a.ts", [null])
            const result = await gen.generateStyles()
            expect(result.global).toBeUndefined()
        })
    })

    describe("generateStyles", () => {
        it("returns global CSS for collected styles", async () => {
            const gen = new VanillaGlobalCssGenerator()
            gen.collectArgs("a.ts", [{ body: { margin: 0 } }])
            const result = await gen.generateStyles()
            expect(result.global).toContain("body {")
            expect(result.global).toContain("margin: 0;")
        })

        it("accumulates styles from multiple collectArgs calls", async () => {
            const gen = new VanillaGlobalCssGenerator()
            gen.collectArgs("a.ts", [{ body: { margin: 0 } }])
            gen.collectArgs("b.ts", [{ h1: { color: "red" } }])
            const result = await gen.generateStyles()
            expect(result.global).toContain("body {")
            expect(result.global).toContain("h1 {")
        })

        it("deduplicates identical style blocks", async () => {
            const gen = new VanillaGlobalCssGenerator()
            gen.collectArgs("a.ts", [{ body: { margin: 0 } }])
            gen.collectArgs("b.ts", [{ body: { margin: 0 } }])
            const result = await gen.generateStyles()
            const count = (result.global ?? "").split("body {").length - 1
            expect(count).toBe(1)
        })

        it("returns undefined global when no styles collected", async () => {
            const gen = new VanillaGlobalCssGenerator()
            const result = await gen.generateStyles()
            expect(result.global).toBeUndefined()
        })

        it("reports diagnostic when CSS generation fails", async () => {
            const onDiagnostic = vi.fn()
            const gen = new VanillaGlobalCssGenerator(onDiagnostic)
            vi.spyOn(GlobalCssObject.prototype, "asCssString").mockImplementationOnce(() => {
                throw new Error("generation failed")
            })
            gen.collectArgs("a.ts", [{ body: { margin: 0 } }])
            await gen.generateStyles()
            expect(onDiagnostic).toHaveBeenCalledWith(
                expect.objectContaining({
                    code: "MOCHI_GLOBAL_CSS_GENERATION",
                    severity: "warning",
                    file: "a.ts",
                }),
            )
        })
    })
})