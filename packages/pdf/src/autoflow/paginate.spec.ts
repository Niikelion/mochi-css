import { describe, it, expect } from "vitest"
import { paginateRects } from "./paginate"

const rect = (top: number, height: number) => ({ top, bottom: top + height })

describe("paginateRects", () => {
    it("returns no pages for no content", () => {
        expect(paginateRects([], 100)).toEqual([])
    })

    it("keeps everything on one page when it all fits", () => {
        const rects = [rect(0, 30), rect(30, 30), rect(60, 30)]
        expect(paginateRects(rects, 100)).toEqual([[0, 1, 2]])
    })

    it("treats an item ending exactly on the boundary as fitting", () => {
        const rects = [rect(0, 50), rect(50, 50)]
        expect(paginateRects(rects, 100)).toEqual([[0, 1]])
    })

    it("breaks before the first item that would overflow", () => {
        const rects = [rect(0, 60), rect(60, 60), rect(120, 60)]
        expect(paginateRects(rects, 100)).toEqual([[0], [1], [2]])
    })

    it("measures each page from the top of its first item, so gaps do not accumulate", () => {
        // Item 1 starts at 110; measured from there it needs only 100 of the 150 available.
        const rects = [rect(0, 100), rect(110, 100)]
        expect(paginateRects(rects, 150)).toEqual([[0], [1]])
    })

    it("places an item taller than a page alone rather than looping", () => {
        const rects = [rect(0, 20), rect(20, 500), rect(520, 20)]
        expect(paginateRects(rects, 100)).toEqual([[0], [1], [2]])
    })

    it("falls back to a single page when no usable height is available", () => {
        const rects = [rect(0, 30), rect(30, 30)]
        expect(paginateRects(rects, 0)).toEqual([[0, 1]])
    })
})
