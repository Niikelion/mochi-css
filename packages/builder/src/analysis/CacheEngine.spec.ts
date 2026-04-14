import { describe, it, expect, vi } from "vitest"
import { createCacheEngine } from "@/analysis/CacheEngine"

describe("fileInput", () => {
    it("returns value after set", () => {
        const engine = createCacheEngine(["a.ts"])
        const input = engine.fileInput<string>()
        input.set("a.ts", "hello")
        expect(input.for("a.ts").get()).toBe("hello")
    })

    it("throws if get() called before set()", () => {
        const engine = createCacheEngine(["a.ts"])
        const input = engine.fileInput<string>()
        expect(() => input.for("a.ts").get()).toThrow("not initialized")
    })

    it("recomputes after set() with a new value", () => {
        const engine = createCacheEngine(["a.ts"])
        const input = engine.fileInput<string>()
        input.set("a.ts", "first")
        expect(input.for("a.ts").get()).toBe("first")
        input.set("a.ts", "second")
        expect(input.for("a.ts").get()).toBe("second")
    })

    it("invalidate() cascades to dependent fileCache", () => {
        const engine = createCacheEngine(["a.ts"])
        const input = engine.fileInput<string>()
        input.set("a.ts", "original")

        const compute = vi.fn((f: string) => input.for(f).get() + "!")
        const derived = engine.fileCache((f) => [input.for(f)], compute)

        expect(derived.for("a.ts").get()).toBe("original!")
        expect(compute).toHaveBeenCalledTimes(1)

        input.set("a.ts", "updated")
        expect(derived.for("a.ts").get()).toBe("updated!")
        expect(compute).toHaveBeenCalledTimes(2)
    })
})

describe("fileData", () => {
    it("returns value after setFileData", () => {
        const engine = createCacheEngine(["a.ts"])
        engine.fileData.set("a.ts", { filePath: "a.ts", ast: {} as never })
        expect(engine.fileData.for("a.ts").get().filePath).toBe("a.ts")
    })

    it("cascades invalidation to dependent fileCache", () => {
        const engine = createCacheEngine(["a.ts"])
        engine.fileData.set("a.ts", { filePath: "a.ts", ast: {} as never })

        const compute = vi.fn((f: string) => engine.fileData.for(f).get().filePath + "!")
        const derived = engine.fileCache((f) => [engine.fileData.for(f)], compute)

        expect(derived.for("a.ts").get()).toBe("a.ts!")
        expect(compute).toHaveBeenCalledTimes(1)

        engine.fileData.set("a.ts", { filePath: "a.ts", ast: {} as never })
        expect(derived.for("a.ts").get()).toBe("a.ts!")
        expect(compute).toHaveBeenCalledTimes(2)
    })
})

describe("fileCache", () => {
    it("caches the result and does not recompute on repeated get()", () => {
        const engine = createCacheEngine(["a.ts"])
        const input = engine.fileInput<number>()
        input.set("a.ts", 1)

        const compute = vi.fn((_f: string) => 42)
        const cache = engine.fileCache(() => [], compute)

        expect(cache.for("a.ts").get()).toBe(42)
        expect(cache.for("a.ts").get()).toBe(42)
        expect(compute).toHaveBeenCalledTimes(1)
    })

    it("recomputes after invalidate()", () => {
        const engine = createCacheEngine(["a.ts"])
        const compute = vi.fn(() => Math.random())
        const cache = engine.fileCache(() => [], compute)

        const first = cache.for("a.ts").get()
        cache.for("a.ts").invalidate()
        const second = cache.for("a.ts").get()

        expect(compute).toHaveBeenCalledTimes(2)
        expect(first).not.toBe(second)
    })

    it("cascade: invalidating A marks B stale when B depends on A", () => {
        const engine = createCacheEngine(["a.ts"])
        const input = engine.fileInput<number>()
        input.set("a.ts", 10)

        const computeA = vi.fn((f: string) => input.for(f).get() * 2)
        const cacheA = engine.fileCache((f) => [input.for(f)], computeA)

        const computeB = vi.fn((f: string) => cacheA.for(f).get() + 1)
        const cacheB = engine.fileCache((f) => [cacheA.for(f)], computeB)

        expect(cacheB.for("a.ts").get()).toBe(21)
        expect(computeA).toHaveBeenCalledTimes(1)
        expect(computeB).toHaveBeenCalledTimes(1)

        // Invalidate the root input — should cascade to A and B
        input.set("a.ts", 20)
        expect(cacheB.for("a.ts").get()).toBe(41)
        expect(computeA).toHaveBeenCalledTimes(2)
        expect(computeB).toHaveBeenCalledTimes(2)
    })

    it("does not recompute a sibling file when another file is invalidated", () => {
        const engine = createCacheEngine(["a.ts", "b.ts"])
        const inputA = engine.fileInput<number>()
        const inputB = engine.fileInput<number>()
        inputA.set("a.ts", 1)
        inputB.set("b.ts", 2)

        const computeA = vi.fn((f: string) => inputA.for(f).get())
        const computeB = vi.fn((f: string) => inputB.for(f).get())

        const cacheA = engine.fileCache((f) => [inputA.for(f)], computeA)
        const cacheB = engine.fileCache((f) => [inputB.for(f)], computeB)

        cacheA.for("a.ts").get()
        cacheB.for("b.ts").get()
        expect(computeA).toHaveBeenCalledTimes(1)
        expect(computeB).toHaveBeenCalledTimes(1)

        inputA.set("a.ts", 99)
        cacheA.for("a.ts").get()
        expect(computeA).toHaveBeenCalledTimes(2)
        expect(computeB).toHaveBeenCalledTimes(1) // b.ts untouched
    })
})

describe("nodeCache", () => {
    it("returns cached value for the same node", () => {
        const engine = createCacheEngine([])
        const compute = vi.fn((_n: object) => 42)
        const cache = engine.nodeCache(() => [], compute)
        const node = {}

        expect(cache.for(node).get()).toBe(42)
        expect(cache.for(node).get()).toBe(42)
        expect(compute).toHaveBeenCalledTimes(1)
    })

    it("returns different values for different nodes", () => {
        const engine = createCacheEngine([])
        let counter = 0
        const cache = engine.nodeCache(
            () => [],
            () => ++counter,
        )
        const nodeA = {}
        const nodeB = {}

        expect(cache.for(nodeA).get()).toBe(1)
        expect(cache.for(nodeB).get()).toBe(2)
        expect(cache.for(nodeA).get()).toBe(1) // cached, no recompute
    })

    it("cascades invalidation from a dep to a node cache entry", () => {
        const engine = createCacheEngine(["a.ts"])
        const input = engine.fileInput<number>()
        input.set("a.ts", 5)

        const node = { key: "x" }
        const compute = vi.fn((_n: object) => input.for("a.ts").get() * 3)
        const cache = engine.nodeCache(() => [input.for("a.ts")], compute)

        expect(cache.for(node).get()).toBe(15)
        input.set("a.ts", 10)
        expect(cache.for(node).get()).toBe(30)
        expect(compute).toHaveBeenCalledTimes(2)
    })
})

describe("projectCache", () => {
    it("computes and caches the result", () => {
        const engine = createCacheEngine([])
        const compute = vi.fn(() => 99)
        const cache = engine.projectCache(() => [], compute)

        expect(cache.get()).toBe(99)
        expect(cache.get()).toBe(99)
        expect(compute).toHaveBeenCalledTimes(1)
    })

    it("recomputes after invalidate()", () => {
        const engine = createCacheEngine([])
        let n = 0
        const cache = engine.projectCache(
            () => [],
            () => ++n,
        )

        expect(cache.get()).toBe(1)
        cache.invalidate()
        expect(cache.get()).toBe(2)
    })

    it("cascades from a dep invalidation", () => {
        const engine = createCacheEngine(["a.ts"])
        const input = engine.fileInput<number>()
        input.set("a.ts", 1)

        const compute = vi.fn(() => input.for("a.ts").get() + 100)
        const cache = engine.projectCache(() => [input.for("a.ts")], compute)

        expect(cache.get()).toBe(101)
        input.set("a.ts", 2)
        expect(cache.get()).toBe(102)
        expect(compute).toHaveBeenCalledTimes(2)
    })

    it("fixpoint: reruns compute when it invalidates its own dep during computation", () => {
        const engine = createCacheEngine(["a.ts"])
        const input = engine.fileInput<number>()
        input.set("a.ts", 3)

        let runs = 0
        const cache = engine.projectCache(
            () => [input.for("a.ts")],
            () => {
                runs++
                const val = input.for("a.ts").get()
                if (val > 0) {
                    // Simulate a fixpoint scenario: first run updates input to 0, triggering re-invalidation
                    input.set("a.ts", 0)
                }
                return val
            },
        )

        const result = cache.get()
        // First run sees val=3, sets to 0, triggers re-invalidation → second run sees val=0, stable
        expect(runs).toBe(2)
        expect(result).toBe(0)
    })
})
