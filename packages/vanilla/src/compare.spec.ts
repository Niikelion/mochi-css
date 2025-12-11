import {describe, it, expect} from "vitest"
import {compareString} from "@/compare";

describe("compareString", () => {
    it("should return 0 for equals strings", () => {
        const values = [
            "abcde",
            "some text",
            "some more text",
            "another random input",
            "Lorem ipsum dolor sit amet"
        ]

        for (const value of values)
            expect(compareString(value, value)).toEqual(0)
    })

    it("should return -1 when a is lexicographically smaller than b", () => {
        expect(compareString("a", "b")).toEqual(-1)
    })

    it("should return 1 when a is lexicographically larger than b", () => {
        expect(compareString("b", "a")).toEqual(1)
    })
})
