import { describe, it, expect, vi, afterEach } from "vitest"
import { frame } from "./frame"

afterEach(() => {
    vi.restoreAllMocks()
})

describe("frame", () => {
    it("returns a non-empty class name", () => {
        expect(frame({})).toBeTruthy()
    })

    it("row and col directions produce different class names", () => {
        expect(frame({ row: true })).not.toBe(frame({ col: true }))
    })

    it("defaults to column direction when neither row nor col is specified", () => {
        expect(frame({})).toBe(frame({ col: true }))
    })

    it("row wins when both row and col are provided", () => {
        expect(frame({ row: true, col: true })).toBe(frame({ row: true }))
    })

    it("emits a warning when both row and col are provided (dev mode)", () => {
        const warn = vi.spyOn(console, "warn")
        frame({ row: true, col: true })
        expect(warn).toHaveBeenCalledWith(expect.stringContaining("both `row` and `col` were provided"))
    })

    it("alignX maps to justify-content in row direction", () => {
        const rowCenter = frame({ row: true, alignX: "center" })
        const rowStart = frame({ row: true, alignX: "start" })
        expect(rowCenter).not.toBe(rowStart)
    })

    it("alignX maps to align-items in col direction", () => {
        const colCenter = frame({ col: true, alignX: "center" })
        const colStart = frame({ col: true, alignX: "start" })
        expect(colCenter).not.toBe(colStart)
    })

    it("row alignX and col alignX produce different results for the same value", () => {
        // same align value but different axis → different CSS properties → different classes
        expect(frame({ row: true, alignX: "center" })).not.toBe(frame({ col: true, alignX: "center" }))
    })

    it("supports space-between on the main axis", () => {
        const withBetween = frame({ row: true, alignX: "space-between" })
        const withCenter = frame({ row: true, alignX: "center" })
        expect(withBetween).not.toBe(withCenter)
    })

    it("ignores space-between on the cross axis (no align-items class added)", () => {
        // col direction: alignX maps to cross axis (align-items); space-between is ignored
        const withBetween = frame({ col: true, alignX: "space-between" })
        const noAlign = frame({ col: true })
        expect(withBetween).toBe(noAlign)
    })

    it("returns deterministic results", () => {
        const props = { row: true, alignX: "center" as const, alignY: "stretch" as const }
        expect(frame(props)).toBe(frame(props))
    })
})
