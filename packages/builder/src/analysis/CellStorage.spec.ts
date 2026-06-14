import { describe, it, expect, vi } from "vitest"
import { SimpleCell, VariableCell, FixpointCell, CellStorage } from "@/analysis/CellStorage"

describe("SimpleCell", () => {
    describe("value", () => {
        it("is computed lazily on first access", () => {
            const compute = vi.fn(() => 42)
            const cell = new SimpleCell(compute)
            expect(compute).not.toHaveBeenCalled()
            expect(cell.value).toBe(42)
            expect(compute).toHaveBeenCalledTimes(1)
        })

        it("is cached — compute not called again when not stale", () => {
            const compute = vi.fn(() => 42)
            const cell = new SimpleCell(compute)
            void cell.value
            void cell.value
            expect(compute).toHaveBeenCalledTimes(1)
        })

        it("recomputes after invalidation", () => {
            let n = 0
            const cell = new SimpleCell(() => ++n)
            expect(cell.value).toBe(1)
            cell.invalidate()
            expect(cell.value).toBe(2)
        })
    })

    describe("stale", () => {
        it("starts as true", () => {
            const cell = new SimpleCell(() => 0)
            expect(cell.stale).toBe(true)
        })

        it("becomes false after first read", () => {
            const cell = new SimpleCell(() => 0)
            void cell.value
            expect(cell.stale).toBe(false)
        })
    })

    describe("invalidate", () => {
        it("marks the cell stale", () => {
            const cell = new SimpleCell(() => 0)
            void cell.value
            cell.invalidate()
            expect(cell.stale).toBe(true)
        })

        it("is a no-op if already stale — does not propagate to dependants", () => {
            const dep = new SimpleCell(() => 0)
            const cell = new SimpleCell(() => dep.value)
            cell.addDependency(dep)

            const spy = vi.spyOn(cell, "invalidate")
            dep.invalidate() // dep is already stale — should return early
            expect(spy).not.toHaveBeenCalled()
        })

        it("propagates to registered dependants", () => {
            const dep = new SimpleCell(() => 1)
            const cell = new SimpleCell(() => dep.value)
            cell.addDependency(dep)

            void dep.value
            void cell.value
            expect(cell.stale).toBe(false)

            dep.invalidate()
            expect(cell.stale).toBe(true)
        })

        it("propagates transitively through a chain of dependants", () => {
            const a = new SimpleCell(() => 1)
            const b = new SimpleCell(() => a.value)
            const c = new SimpleCell(() => b.value)
            b.addDependency(a)
            c.addDependency(b)

            void a.value
            void b.value
            void c.value

            a.invalidate()
            expect(b.stale).toBe(true)
            expect(c.stale).toBe(true)
        })
    })

    describe("addDependency", () => {
        it("invalidating the dependency invalidates this cell", () => {
            const dep = new SimpleCell(() => 1)
            const cell = new SimpleCell(() => dep.value * 2)
            cell.addDependency(dep)

            void dep.value
            void cell.value
            dep.invalidate()
            expect(cell.stale).toBe(true)
        })
    })
})

describe("VariableCell", () => {
    it("starts with the provided value and is not stale", () => {
        const cell = new VariableCell(10)
        expect(cell.stale).toBe(false)
        expect(cell.value).toBe(10)
    })

    it("value setter updates the stored value", () => {
        const cell = new VariableCell(1)
        cell.value = 2
        expect(cell.value).toBe(2)
    })

    it("is clean after value setter", () => {
        const cell = new VariableCell(1)
        cell.value = 2
        expect(cell.stale).toBe(false)
    })

    it("value setter invalidates dependants", () => {
        const source = new VariableCell(1)
        const derived = new SimpleCell(() => source.value * 2)
        derived.addDependency(source)

        void derived.value
        expect(derived.stale).toBe(false)

        source.value = 2
        expect(derived.stale).toBe(true)
    })

    it("dependant recomputes with the new value after setter", () => {
        const source = new VariableCell(1)
        const derived = new SimpleCell(() => source.value * 2)
        derived.addDependency(source)

        expect(derived.value).toBe(2)
        source.value = 5
        expect(derived.value).toBe(10)
    })
})

describe("FixpointCell", () => {
    it("computes value normally when no re-invalidation occurs", () => {
        const compute = vi.fn(() => 42)
        const cell = new FixpointCell(compute)
        expect(cell.value).toBe(42)
        expect(compute).toHaveBeenCalledTimes(1)
    })

    it("reruns until stable when a dependency is invalidated mid-compute", () => {
        const input = new VariableCell(3)
        let runs = 0
        const cell = new FixpointCell(() => {
            runs++
            const val = input.value
            if (val > 0) input.value = 0
            return val
        })
        cell.addDependency(input)

        expect(cell.value).toBe(0)
        expect(runs).toBe(2)
    })
})

describe("CellStorage", () => {
    it("invalidate(key) invalidates the registered cell", () => {
        const storage = new CellStorage<string>()
        const cell = new SimpleCell(() => 42)
        storage.register("key", cell)

        void cell.value
        expect(cell.stale).toBe(false)

        storage.invalidate("key")
        expect(cell.stale).toBe(true)
    })

    it("invalidate(key) is a no-op for unregistered keys", () => {
        const storage = new CellStorage<string>()
        expect(() => {
            storage.invalidate("missing")
        }).not.toThrow()
    })

    it("addDependency wires cells so invalidating the dependency propagates", () => {
        const storage = new CellStorage<string>()
        const dep = new SimpleCell(() => 1)
        const cell = new SimpleCell(() => dep.value)
        storage.register("dep", dep)
        storage.register("cell", cell)
        storage.addDependency("cell", "dep")

        void dep.value
        void cell.value

        storage.invalidate("dep")
        expect(cell.stale).toBe(true)
    })

    it("addDependency is a no-op when either key is unregistered", () => {
        const storage = new CellStorage<string>()
        const cell = new SimpleCell(() => 1)
        storage.register("cell", cell)
        expect(() => {
            storage.addDependency("cell", "missing")
        }).not.toThrow()
        expect(() => {
            storage.addDependency("missing", "cell")
        }).not.toThrow()
    })

    it("clear() removes all mappings — subsequent invalidate is a no-op", () => {
        const storage = new CellStorage<string>()
        const cell = new SimpleCell(() => 42)
        storage.register("key", cell)

        void cell.value
        storage.clear()
        storage.invalidate("key")
        expect(cell.stale).toBe(false)
    })
})
