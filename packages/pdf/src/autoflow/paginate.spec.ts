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

describe("paginateRects with widow and orphan control", () => {
    /** Six stacked lines of 10, all belonging to one run. */
    const lines = Array.from({ length: 6 }, (_, index) => rect(index * 10, 10))
    const oneRun = Array.from({ length: 6 }, () => 0)

    it("moves a lone trailing line to the next page rather than stranding it", () => {
        // A page fitting 1 line would orphan it, so the whole run moves down. The first item is
        // a standalone block, which gives the run somewhere to move away from.
        const rects = [rect(0, 10), ...lines.map((r) => rect(r.top + 10, 10))]
        const groups = [undefined, ...oneRun]

        const pages = paginateRects(rects, 20, { groups, minLines: 2 })

        expect(pages[0]).toEqual([0])
        expect(pages[1]?.slice(0, 2)).toEqual([1, 2])
    })

    it("breaks inside a run once both sides keep the minimum", () => {
        const pages = paginateRects(lines, 30, { groups: oneRun, minLines: 2 })

        expect(pages).toEqual([
            [0, 1, 2],
            [3, 4, 5],
        ])
    })

    it("pulls a line back so the continuation is not left with a single line", () => {
        // Five lines into pages of four would leave one line alone on the second page.
        const five = lines.slice(0, 5)
        const pages = paginateRects(five, 40, { groups: five.map(() => 0), minLines: 2 })

        expect(pages).toEqual([
            [0, 1, 2],
            [3, 4],
        ])
    })

    it("leaves runs alone when the minimum is already met", () => {
        const pages = paginateRects(lines, 20, { groups: oneRun, minLines: 2 })

        expect(pages).toEqual([
            [0, 1],
            [2, 3],
            [4, 5],
        ])
    })

    it("does not apply the minimum across two different runs", () => {
        // Two single-line runs: neither can satisfy a minimum of 2, and neither should try.
        const rects = [rect(0, 10), rect(10, 10)]
        const pages = paginateRects(rects, 10, { groups: [0, 1], minLines: 2 })

        expect(pages).toEqual([[0], [1]])
    })

    it("accepts an orphan rather than emitting an empty page", () => {
        // The run starts the page, so honouring the minimum would leave nothing behind.
        const pages = paginateRects(lines, 15, { groups: oneRun, minLines: 2 })

        expect(pages.every((page) => page.length > 0)).toBe(true)
        expect(pages.flat()).toEqual([0, 1, 2, 3, 4, 5])
    })

    it("places every item exactly once, in order", () => {
        const pages = paginateRects(lines, 25, { groups: oneRun, minLines: 2 })
        expect(pages.flat()).toEqual([0, 1, 2, 3, 4, 5])
    })
})
