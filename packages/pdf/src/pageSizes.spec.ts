import { describe, it, expect } from "vitest"
import { PAGE_SIZES, resolvePageMargin, resolvePageSize, toCssLength } from "./pageSizes"

describe("toCssLength", () => {
    it("treats a bare number as pixels", () => {
        expect(toCssLength(12)).toBe("12px")
    })

    it("passes a length through untouched", () => {
        expect(toCssLength("2cm")).toBe("2cm")
    })
})

describe("resolvePageSize", () => {
    it("resolves a named size", () => {
        expect(resolvePageSize("a4", "portrait")).toEqual(PAGE_SIZES.a4)
    })

    it("swaps the axes for landscape", () => {
        expect(resolvePageSize("a4", "landscape")).toEqual({ width: "297mm", height: "210mm" })
    })

    it("accepts explicit dimensions", () => {
        expect(resolvePageSize({ width: 400, height: 600 }, "portrait")).toEqual({ width: "400px", height: "600px" })
    })
})

describe("resolvePageMargin", () => {
    it("applies a single value to every side", () => {
        expect(resolvePageMargin("10mm")).toBe("10mm")
    })

    it("expands per-side values into a shorthand", () => {
        expect(resolvePageMargin({ top: "1cm", right: 20, bottom: "2cm", left: 20 })).toBe("1cm 20px 2cm 20px")
    })

    it("defaults omitted sides to zero", () => {
        expect(resolvePageMargin({ top: "1cm" })).toBe("1cm 0px 0px 0px")
    })
})
