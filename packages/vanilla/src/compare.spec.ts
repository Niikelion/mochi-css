import {describe, it, expect} from "vitest"
import {compareString, compareStringKey, stringPropComparator} from "@/compare";

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

describe("compareStringKey", () => {
    it("should compare based not first elements in tuples", () => {
        const table: { a: [string, any], b: [string, any], r: ReturnType<typeof compareStringKey> }[] = [
            { a: ["a", 5], b: ["a", 6], r: 0 },
            { a: ["a", 5], b: ["a", 5], r: 0 },
            { a: ["a", 6], b: ["a", 5], r: 0 },
            { a: ["b", 5], b: ["a", 6], r: 1 },
            { a: ["a", 6], b: ["b", 5], r: -1 },
        ]

        for (const entry of table)
            expect(compareStringKey(entry.a, entry.b)).toEqual(entry.r)
    })
})

describe("stringPropComparator", () => {
    it("should return comparator that compares given property of input as string", () => {
        const cmp1 = stringPropComparator("key")

        expect(cmp1({ key: "11" }, { key: "1" })).toEqual(1)
        expect(cmp1({ key: "1" }, { key: "2" })).toEqual(-1)
        expect(cmp1({ key: "1", value: 2 }, { key: "1", value: 1 })).toEqual(0)
    })
})
