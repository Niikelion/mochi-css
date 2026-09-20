import { describe, it, expect } from "vitest"
import { box } from "./box"

describe("box", () => {
    it("returns a non-empty class name", () => {
        expect(box()).toBeTruthy()
    })

    it("returns the same class name on repeated calls", () => {
        expect(box()).toBe(box())
    })
})
