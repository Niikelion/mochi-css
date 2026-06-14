import { describe, it, expect } from "vitest"
import { idToRef, topoSort } from "@/analysis/helpers"
import type { AnyStage } from "@/analysis/Stage"
import { noop } from "@mochi-css/core"

function makeStage(deps: AnyStage[] = []): AnyStage {
    return { dependsOn: deps, init: noop }
}

describe("idToRef", () => {
    it("maps value to name and ctxt to id", () => {
        expect(idToRef({ value: "foo", ctxt: 3 } as never)).toEqual({ name: "foo", id: 3 })
    })

    it("preserves ctxt 0", () => {
        expect(idToRef({ value: "bar", ctxt: 0 } as never)).toEqual({ name: "bar", id: 0 })
    })
})

describe("topoSort", () => {
    it("returns empty array for empty input", () => {
        expect(topoSort([])).toEqual([])
    })

    it("returns a single stage with no deps unchanged", () => {
        const a = makeStage()
        expect(topoSort([a])).toEqual([a])
    })

    it("places dependency before dependant", () => {
        const a = makeStage()
        const b = makeStage([a])
        const result = topoSort([b, a])
        expect(result.indexOf(a)).toBeLessThan(result.indexOf(b))
    })

    it("handles a linear chain", () => {
        const a = makeStage()
        const b = makeStage([a])
        const c = makeStage([b])
        const result = topoSort([c, b, a])
        expect(result.indexOf(a)).toBeLessThan(result.indexOf(b))
        expect(result.indexOf(b)).toBeLessThan(result.indexOf(c))
    })

    it("handles a diamond — shared dep appears once, before all dependants", () => {
        const a = makeStage()
        const b = makeStage([a])
        const c = makeStage([a])
        const d = makeStage([b, c])
        const result = topoSort([d, b, c, a])
        expect(result.filter((s) => s === a)).toHaveLength(1)
        expect(result.indexOf(a)).toBeLessThan(result.indexOf(b))
        expect(result.indexOf(a)).toBeLessThan(result.indexOf(c))
        expect(result.indexOf(b)).toBeLessThan(result.indexOf(d))
        expect(result.indexOf(c)).toBeLessThan(result.indexOf(d))
    })

    it("includes transitive deps not in the input array", () => {
        const a = makeStage()
        const b = makeStage([a])
        const result = topoSort([b]) // a not in input
        expect(result).toContain(a)
        expect(result.indexOf(a)).toBeLessThan(result.indexOf(b))
    })

    it("throws on a dependency cycle", () => {
        const a = makeStage()
        const b = makeStage([a])
        a.dependsOn.push(b)
        expect(() => topoSort([a, b])).toThrow("Cycle detected")
    })

    it("throws on a self-cycle", () => {
        const a = makeStage()
        a.dependsOn.push(a)
        expect(() => topoSort([a])).toThrow("Cycle detected")
    })
})
