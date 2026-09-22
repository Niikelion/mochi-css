import { describe, it, expect } from "vitest"
import { renderSlot } from "./pageSlots"

const info = { pageNumber: 2, pageCount: 7 }

describe("renderSlot", () => {
    it("has nothing to render without a slot", () => {
        expect(renderSlot(undefined, info)).toBeUndefined()
    })

    it("passes fixed content straight through", () => {
        expect(renderSlot("Confidential", info)).toBe("Confidential")
    })

    it("gives a function the page's position in the document", () => {
        expect(renderSlot((slot) => `${slot.pageNumber} of ${slot.pageCount}`, info)).toBe("2 of 7")
    })

    it("keeps falsy content rather than treating it as absent", () => {
        expect(renderSlot(0, info)).toBe(0)
        expect(renderSlot(null, info)).toBeNull()
    })
})
