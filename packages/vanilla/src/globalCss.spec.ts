import { describe, it, expect } from "vitest"
import { globalCss } from "@/globalCss"

describe("globalCss", () => {
    it("should not throw for valid styles", () => {
        expect(() => {
            globalCss({ body: { margin: 0 } })
        }).not.toThrow()
    })

    it("should not throw for multiple selectors", () => {
        expect(() => {
            globalCss({ body: { margin: 0 }, h1: { fontSize: 24 } })
        }).not.toThrow()
    })

    it("should not throw for empty styles", () => {
        expect(() => {
            globalCss({})
        }).not.toThrow()
    })
})
