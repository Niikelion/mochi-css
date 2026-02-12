import { describe, it, expect } from "vitest"
import { RefMap } from "@/ProjectIndex"

describe("RefMap", () => {
    it("stores and retrieves by ref", () => {
        const map = new RefMap<string>()
        const ref = { name: "foo", id: 1 }
        map.set(ref, "bar")
        expect(map.get(ref)).toBe("bar")
        expect(map.has(ref)).toBe(true)
    })

    it("returns undefined for missing ref", () => {
        const map = new RefMap<string>()
        expect(map.get({ name: "foo", id: 1 })).toBeUndefined()
        expect(map.has({ name: "foo", id: 1 })).toBe(false)
    })

    it("ignores refs with undefined id", () => {
        const map = new RefMap<string>()
        const ref = { name: "foo", id: undefined }
        map.set(ref, "bar")
        expect(map.get(ref)).toBeUndefined()
        expect(map.has(ref)).toBe(false)
    })

    it("distinguishes refs with same name but different id", () => {
        const map = new RefMap<string>()
        map.set({ name: "x", id: 1 }, "first")
        map.set({ name: "x", id: 2 }, "second")
        expect(map.get({ name: "x", id: 1 })).toBe("first")
        expect(map.get({ name: "x", id: 2 })).toBe("second")
    })

    it("deletes a ref", () => {
        const map = new RefMap<string>()
        const ref = { name: "foo", id: 1 }
        map.set(ref, "bar")
        expect(map.delete(ref)).toBe(true)
        expect(map.has(ref)).toBe(false)
        expect(map.delete(ref)).toBe(false)
    })

    it("delete returns false for undefined id", () => {
        const map = new RefMap<string>()
        expect(map.delete({ name: "foo", id: undefined })).toBe(false)
    })

    it("getByName returns first match for a name", () => {
        const map = new RefMap<string>()
        map.set({ name: "x", id: 1 }, "first")
        map.set({ name: "x", id: 2 }, "second")
        const result = map.getByName("x")
        expect(result === "first" || result === "second").toBe(true)
    })

    it("getByName returns undefined for missing name", () => {
        const map = new RefMap<string>()
        expect(map.getByName("missing")).toBeUndefined()
    })

    it("iterates all values", () => {
        const map = new RefMap<string>()
        map.set({ name: "a", id: 1 }, "one")
        map.set({ name: "b", id: 2 }, "two")
        const values = [...map.values()]
        expect(values).toHaveLength(2)
        expect(values).toContain("one")
        expect(values).toContain("two")
    })

    it("finds a value matching a predicate", () => {
        const map = new RefMap<number>()
        map.set({ name: "a", id: 1 }, 10)
        map.set({ name: "b", id: 2 }, 20)
        expect(map.find(v => v > 15)).toBe(20)
        expect(map.find(v => v > 100)).toBeUndefined()
    })
})