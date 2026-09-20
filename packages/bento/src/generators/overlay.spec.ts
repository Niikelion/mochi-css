import { describe, it, expect } from "vitest"
import { overlay } from "./overlay"

describe("overlay", () => {
    it("returns a non-empty class name", () => {
        expect(overlay({})).toBeTruthy()
    })

    it("base class is always present", () => {
        const base = overlay({})
        expect(overlay({ alignX: "center" })).toContain(base.split(" ")[0])
    })

    it("different alignX values produce different class names", () => {
        expect(overlay({ alignX: "start" })).not.toBe(overlay({ alignX: "end" }))
        expect(overlay({ alignX: "center" })).not.toBe(overlay({ alignX: "start" }))
    })

    it("different alignY values produce different class names", () => {
        expect(overlay({ alignY: "start" })).not.toBe(overlay({ alignY: "end" }))
        expect(overlay({ alignY: "center" })).not.toBe(overlay({ alignY: "start" }))
    })

    it("returns deterministic results", () => {
        const props = { alignX: "center" as const, alignY: "end" as const }
        expect(overlay(props)).toBe(overlay(props))
    })
})
