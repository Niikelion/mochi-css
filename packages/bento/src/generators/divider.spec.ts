import { describe, it, expect } from "vitest"
import { divider } from "./divider"

describe("divider", () => {
    it("returns a non-empty class for horizontal (default)", () => {
        expect(divider()).toBeTruthy()
        expect(divider({ vertical: false })).toBeTruthy()
    })

    it("returns a non-empty class for vertical", () => {
        expect(divider({ vertical: true })).toBeTruthy()
    })

    it("horizontal and vertical return different class names", () => {
        expect(divider()).not.toBe(divider({ vertical: true }))
    })

    it("returns the same class on repeated calls with same props", () => {
        expect(divider()).toBe(divider())
        expect(divider({ vertical: true })).toBe(divider({ vertical: true }))
    })
})
