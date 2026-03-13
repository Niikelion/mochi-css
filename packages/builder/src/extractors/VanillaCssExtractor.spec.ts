import { describe, it, expect } from "vitest"
import { mochiCssFunctionExtractor } from "./VanillaCssExtractor"
import { VanillaCssGenerator } from "@/generators/VanillaCssGenerator"
import { CallExpression, Expression } from "@swc/core"

function makeMockCall(count: number): CallExpression {
    return {
        arguments: Array.from({ length: count }, (_, i) => ({
            expression: { type: "Identifier", value: `arg${i}` } as Expression,
        })),
    } as unknown as CallExpression
}

describe("mochiCssFunctionExtractor", () => {
    it("has correct importPath and symbolName", () => {
        expect(mochiCssFunctionExtractor.importPath).toBe("@mochi-css/vanilla")
        expect(mochiCssFunctionExtractor.symbolName).toBe("css")
    })

    it("extracts all arguments", () => {
        const result = mochiCssFunctionExtractor.extractStaticArgs(makeMockCall(3))
        expect(result).toHaveLength(3)
    })

    it("startGeneration returns VanillaCssGenerator", () => {
        expect(mochiCssFunctionExtractor.startGeneration()).toBeInstanceOf(VanillaCssGenerator)
    })
})
