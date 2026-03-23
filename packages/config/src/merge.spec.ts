import { describe, it, expect, vi } from "vitest"
import { mergeArrays, mergeCallbacks } from "./merge"

describe("mergeArrays", () => {
    it("returns undefined when both are undefined", () => {
        expect(mergeArrays(undefined, undefined)).toBeUndefined()
    })

    it("returns a when b is undefined", () => {
        expect(mergeArrays([1, 2], undefined)).toEqual([1, 2])
    })

    it("returns b when a is undefined", () => {
        expect(mergeArrays(undefined, [3, 4])).toEqual([3, 4])
    })

    it("concatenates a and b in order", () => {
        expect(mergeArrays([1, 2], [3, 4])).toEqual([1, 2, 3, 4])
    })
})

describe("mergeCallbacks", () => {
    it("returns undefined when both are undefined", () => {
        expect(mergeCallbacks(undefined, undefined)).toBeUndefined()
    })

    it("returns a when b is undefined", () => {
        const a = vi.fn()
        const merged = mergeCallbacks(a, undefined)
        merged?.("x")
        expect(a).toHaveBeenCalledWith("x")
    })

    it("returns b when a is undefined", () => {
        const b = vi.fn()
        const merged = mergeCallbacks(undefined, b)
        merged?.("x")
        expect(b).toHaveBeenCalledWith("x")
    })

    it("calls both a and b with the same args", () => {
        const a = vi.fn()
        const b = vi.fn()
        const merged = mergeCallbacks(a, b)
        merged?.("x", "y")
        expect(a).toHaveBeenCalledWith("x", "y")
        expect(b).toHaveBeenCalledWith("x", "y")
    })
})
