import { describe, it, expect } from "vitest"
import { mochiGlobalCssFunctionExtractor } from "./VanillaGlobalCssExtractor"
import { VanillaGlobalCssGenerator } from "@/generators/VanillaGlobalCssGenerator"
import { CallExpression, Expression } from "@swc/core"

function makeMockCall(count: number): CallExpression {
    return {
        arguments: Array.from({ length: count }, (_, i) => ({
            expression: { type: "Identifier", value: `arg${i}` } as Expression,
        })),
    } as unknown as CallExpression
}

describe("mochiGlobalCssFunctionExtractor", () => {
    it("has correct importPath and symbolName", () => {
        expect(mochiGlobalCssFunctionExtractor.importPath).toBe("@mochi-css/vanilla")
        expect(mochiGlobalCssFunctionExtractor.symbolName).toBe("globalCss")
    })

    it("extracts only the first argument", () => {
        const result = mochiGlobalCssFunctionExtractor.extractStaticArgs(makeMockCall(3))
        expect(result).toHaveLength(1)
    })

    it("extracts no arguments when call has no arguments", () => {
        const result = mochiGlobalCssFunctionExtractor.extractStaticArgs(makeMockCall(0))
        expect(result).toHaveLength(0)
    })

    it("startGeneration returns VanillaGlobalCssGenerator", () => {
        expect(mochiGlobalCssFunctionExtractor.startGeneration()).toBeInstanceOf(VanillaGlobalCssGenerator)
    })
})