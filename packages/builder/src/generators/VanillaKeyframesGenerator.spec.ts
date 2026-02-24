import { describe, it, expect, vi, afterEach } from "vitest"
import { VanillaKeyframesGenerator } from "./VanillaKeyframesGenerator"
import { KeyframesObject } from "@mochi-css/vanilla"

describe("VanillaKeyframesGenerator", () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe("collectArgs", () => {
        it("reports diagnostic for null arg", () => {
            const onDiagnostic = vi.fn()
            const gen = new VanillaKeyframesGenerator(onDiagnostic)
            gen.collectArgs("a.ts", [null])
            expect(onDiagnostic).toHaveBeenCalledWith(expect.objectContaining({
                code: "MOCHI_INVALID_KEYFRAMES_ARG",
                severity: "warning",
                file: "a.ts",
            }))
        })

        it("reports diagnostic for non-object args", () => {
            const onDiagnostic = vi.fn()
            const gen = new VanillaKeyframesGenerator(onDiagnostic)
            gen.collectArgs("a.ts", ["string", 42])
            expect(onDiagnostic).toHaveBeenCalledTimes(2)
        })

        it("does not collect when all args are invalid", async () => {
            const gen = new VanillaKeyframesGenerator()
            gen.collectArgs("a.ts", [null])
            const result = await gen.generateStyles()
            expect(result.files).toEqual({})
        })
    })

    describe("generateStyles", () => {
        it("accumulates keyframes from same source across multiple collectArgs calls", async () => {
            const gen = new VanillaKeyframesGenerator()
            gen.collectArgs("a.ts", [{ from: { opacity: "0" }, to: { opacity: "1" } }])
            gen.collectArgs("a.ts", [{ from: { opacity: "1" }, to: { opacity: "0" } }])
            const result = await gen.generateStyles()
            expect(result.files?.["a.ts"]).toBeDefined()
        })

        it("reports diagnostic when keyframes generation fails", async () => {
            const onDiagnostic = vi.fn()
            const gen = new VanillaKeyframesGenerator(onDiagnostic)
            vi.spyOn(KeyframesObject.prototype, "asCssString").mockImplementationOnce(() => {
                throw new Error("generation failed")
            })
            gen.collectArgs("a.ts", [{ from: { opacity: "0" }, to: { opacity: "1" } }])
            await gen.generateStyles()
            expect(onDiagnostic).toHaveBeenCalledWith(expect.objectContaining({
                code: "MOCHI_KEYFRAMES_GENERATION",
                severity: "warning",
                file: "a.ts",
            }))
        })
    })
})