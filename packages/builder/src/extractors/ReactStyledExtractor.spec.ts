import { describe, it, expect } from "vitest"
import { mochiStyledFunctionExtractor } from "./ReactStyledExtractor"
import { VanillaCssGenerator } from "@/generators/VanillaCssGenerator"
import { CallExpression, Expression } from "@swc/core"

function makeMockCall(count: number): CallExpression {
    return {
        arguments: Array.from({ length: count }, (_, i) => ({
            expression: { type: "Identifier", value: `arg${i}` } as Expression,
        })),
    } as unknown as CallExpression
}

describe("mochiStyledFunctionExtractor", () => {
    it("has correct importPath and symbolName", () => {
        expect(mochiStyledFunctionExtractor.importPath).toBe("@mochi-css/react")
        expect(mochiStyledFunctionExtractor.symbolName).toBe("styled")
    })

    it("skips the first argument", () => {
        const result = mochiStyledFunctionExtractor.extractStaticArgs(makeMockCall(3))
        expect(result).toHaveLength(2)
    })

    it("returns empty array when only one argument is present", () => {
        const result = mochiStyledFunctionExtractor.extractStaticArgs(makeMockCall(1))
        expect(result).toHaveLength(0)
    })

    it("startGeneration returns VanillaCssGenerator", () => {
        expect(mochiStyledFunctionExtractor.startGeneration()).toBeInstanceOf(VanillaCssGenerator)
    })
})
