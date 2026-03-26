import { describe, it, expect } from "vitest"
import { ProjectIndex, RefMap } from "@/ProjectIndex"
import { parseSource } from "@/parse"
import { mochiCssFunctionExtractor } from "@/extractors/VanillaCssExtractor"
import { defaultStages } from "@/analysis/stages"

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
        expect(map.find((v) => v > 15)).toBe(20)
        expect(map.find((v) => v > 100)).toBeUndefined()
    })
})

describe("ProjectIndex FileInfo.extractedCallExpressions", () => {
    it("is populated with the call expression node for each css call", async () => {
        const module = await parseSource(
            `import { css } from "@mochi-css/vanilla"
export const s = css({ color: "red" })`,
            "test.ts",
        )
        const index = new ProjectIndex([module], defaultStages, [mochiCssFunctionExtractor], () => null)
        index.propagateUsages()

        const fileInfo = index.files.find(([p]) => p === "test.ts")?.[1]
        expect.assert(fileInfo !== undefined)
        const callExprs = fileInfo.extractedCallExpressions.get(mochiCssFunctionExtractor)
        expect(callExprs).toHaveLength(1)
        expect(callExprs?.[0]?.type).toBe("CallExpression")
    })

    it("tracks each call separately for multiple css calls", async () => {
        const module = await parseSource(
            `import { css } from "@mochi-css/vanilla"
export const a = css({ color: "red" })
export const b = css({ color: "blue" })`,
            "multi.ts",
        )
        const index = new ProjectIndex([module], defaultStages, [mochiCssFunctionExtractor], () => null)
        index.propagateUsages()

        const fileInfo = index.files.find(([p]) => p === "multi.ts")?.[1]
        expect.assert(fileInfo !== undefined)
        const callExprs = fileInfo.extractedCallExpressions.get(mochiCssFunctionExtractor)
        expect(callExprs).toHaveLength(2)
    })
})

describe("ProjectIndex.reanalyzeFiles", () => {
    it("replaces FileInfo analysis after AST mutation", async () => {
        const module = await parseSource(
            `import { css } from "@mochi-css/vanilla"
export const s = css({ color: "red" })`,
            "test.ts",
        )
        const index = new ProjectIndex([module], defaultStages, [mochiCssFunctionExtractor], () => null)

        // Verify initial extraction found the style expression
        const before = index.files.find(([p]) => p === "test.ts")?.[1]
        expect.assert(before !== undefined)
        expect(before.extractedExpressions.get(mochiCssFunctionExtractor)?.length).toBe(1)

        // Re-analyze immediately — should still find 1 style expression
        index.reanalyzeFiles(new Set(["test.ts"]))
        const after = index.files.find(([p]) => p === "test.ts")?.[1]
        expect.assert(after !== undefined)
        expect(after.extractedExpressions.get(mochiCssFunctionExtractor)?.length).toBe(1)
        // usedBindings is reset
        expect(after.usedBindings.size).toBe(0)
    })

    it("skips file paths not in the index", async () => {
        const module = await parseSource(`export const x = 1`, "a.ts")
        const index = new ProjectIndex([module], defaultStages, [], () => null)

        // Should not throw for unknown paths
        expect(() => {
            index.reanalyzeFiles(new Set(["nonexistent.ts"]))
        }).not.toThrow()
    })
})

describe("ProjectIndex.resetCrossFileState", () => {
    it("clears usedBindings after propagateUsages", async () => {
        // Use a local variable in the style call so usedBindings gets populated
        const module = await parseSource(
            `import { css } from "@mochi-css/vanilla"
const primary = "red"
export const s = css({ color: primary })`,
            "test.ts",
        )
        const index = new ProjectIndex([module], defaultStages, [mochiCssFunctionExtractor], () => null)
        index.propagateUsages()

        const fileInfo = index.files.find(([p]) => p === "test.ts")?.[1]
        expect.assert(fileInfo !== undefined)
        expect(fileInfo.usedBindings.size).toBeGreaterThan(0)

        index.resetCrossFileState()

        expect(fileInfo.usedBindings.size).toBe(0)
    })
})
