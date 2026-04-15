import { describe, it, expect } from "vitest"
import { numberToBase62 } from "@/hash"

describe("numberToBase62", () => {
    it("should return 0 for 0", () => {
        expect(numberToBase62(0)).toEqual("0")
    })

    it("should respect maxLength parameter", () => {
        expect(numberToBase62(4328569, 4).length).toEqual(4)
        expect(numberToBase62(8942, 1).length).toEqual(1)
    })

    it("should be no longer than string representation", () => {
        for (let i = 0; i < 10_000_000; i += 1_000) {
            const v = numberToBase62(i)
            expect(v.length).toBeLessThanOrEqual(i.toString().length)
        }
    })

    it("should be deterministic", () => {
        for (let i = 0; i < 10_000; ++i) expect(numberToBase62(i)).toEqual(numberToBase62(i))
        for (let i = 10_000; i < 10_000_000; i += 1_000) expect(numberToBase62(i)).toEqual(numberToBase62(i))
    })
})
