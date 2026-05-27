import { describe, it, expect } from "vitest"
import { pile } from "./pile"

describe("pile", () => {
    it("returns a non-empty class name", () => {
        expect(pile()).toBeTruthy()
    })

    it("returns the same class on repeated calls", () => {
        expect(pile()).toBe(pile())
    })

    describe("pile.item", () => {
        it("returns a non-empty class for aligned items", () => {
            expect(pile.item({ alignX: "center", alignY: "start" })).toBeTruthy()
        })

        it("returns an empty string when no alignment is provided", () => {
            expect(pile.item({})).toBe("")
        })

        it("different alignX values produce different classes", () => {
            expect(pile.item({ alignX: "start" })).not.toBe(pile.item({ alignX: "end" }))
        })

        it("different alignY values produce different classes", () => {
            expect(pile.item({ alignY: "start" })).not.toBe(pile.item({ alignY: "end" }))
        })

        it("returns deterministic results", () => {
            const props = { alignX: "center" as const, alignY: "stretch" as const }
            expect(pile.item(props)).toBe(pile.item(props))
        })
    })
})
