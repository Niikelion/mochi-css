import { describe, it, expect, vi, afterEach } from "vitest"
import { grid } from "./grid"

afterEach(() => {
    vi.restoreAllMocks()
})

describe("grid", () => {
    it("returns a non-empty class name", () => {
        expect(grid({})).toBeTruthy()
    })

    it("returns the same class regardless of props (CSS vars handle values)", () => {
        expect(grid({ columns: 3 })).toBe(grid({ columns: 5 }))
        expect(grid({ rows: "auto 1fr" })).toBe(grid({}))
    })
})

describe("grid.span", () => {
    it("returns a SpanCell with the correct properties", () => {
        const cell = grid.span(2, "header")
        expect(cell.__span).toBe(true)
        expect(cell.name).toBe("header")
        expect(cell.count).toBe(2)
    })

    it("preserves the name as a string", () => {
        const cell = grid.span(3, "sidebar")
        expect(cell.name).toBe("sidebar")
    })
})

describe("grid.areas", () => {
    it("produces a template string with quoted rows", () => {
        const layout = grid.areas([
            ["header", "header"],
            ["sidebar", "content"],
        ])
        expect(layout.template).toBe('"header header" "sidebar content"')
    })

    it("exposes area names as properties", () => {
        const layout = grid.areas([["sidebar", "content"]])
        expect(layout.sidebar).toBe("sidebar")
        expect(layout.content).toBe("content")
    })

    it("converts null cells to dots", () => {
        const layout = grid.areas([[null, "footer"]])
        expect(layout.template).toBe('". footer"')
        expect(layout.footer).toBe("footer")
    })

    it("expands span cells", () => {
        const layout = grid.areas([[grid.span(2, "header"), null]])
        expect(layout.template).toBe('"header header ."')
        expect(layout.header).toBe("header")
    })

    it("handles mixed spans and strings", () => {
        const layout = grid.areas([[grid.span(2, "a"), "b", grid.span(2, "c")]])
        expect(layout.template).toBe('"a a b c c"')
    })

    it("deduplicates repeated area names", () => {
        const layout = grid.areas([[grid.span(2, "header")], ["sidebar", "content"]])
        // header appears in both expanded rows — template should be correct
        expect(layout.template).toBe('"header header" "sidebar content"')
        expect(layout.header).toBe("header")
        expect(layout.sidebar).toBe("sidebar")
        expect(layout.content).toBe("content")
    })

    it("warns when row column counts differ", () => {
        const warn = vi.spyOn(console, "warn")
        grid.areas([["a", "b"], ["c"]])
        expect(warn).toHaveBeenCalledWith(expect.stringContaining("column"))
    })

    it("does not warn when column counts match", () => {
        const warn = vi.spyOn(console, "warn")
        grid.areas([
            ["a", "b"],
            ["c", "d"],
        ])
        expect(warn).not.toHaveBeenCalled()
    })
})
