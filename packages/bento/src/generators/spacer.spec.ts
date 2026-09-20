import { describe, it, expect } from "vitest"
import { spacer } from "./spacer"
import { box } from "./box"

describe("spacer", () => {
    it("returns a non-empty class name", () => {
        expect(spacer()).toBeTruthy()
    })

    it("returns the same class name on repeated calls", () => {
        expect(spacer()).toBe(spacer())
    })

    it("returns a different class from box()", () => {
        expect(spacer()).not.toBe(box())
    })
})
