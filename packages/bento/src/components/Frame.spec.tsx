// @vitest-environment happy-dom
import { describe, it, expect } from "vitest"
import { createElement } from "react"
import { createRoot } from "react-dom/client"
import { act } from "react"
import { Frame } from "./Frame"
import { frame } from "../generators/frame"

describe("Frame", () => {
    it("renders a div with the frame() class", () => {
        const container = document.createElement("div")
        act(() => {
            createRoot(container).render(createElement(Frame))
        })
        const el = container.firstElementChild
        expect(el?.tagName.toLowerCase()).toBe("div")
        const expected = frame({})
        for (const cls of expected.split(" ").filter(Boolean)) {
            expect(el?.className).toContain(cls)
        }
    })

    it("passes row/col/alignX/alignY to the generator", () => {
        const container = document.createElement("div")
        act(() => {
            createRoot(container).render(createElement(Frame, { row: true, alignX: "center", alignY: "stretch" }))
        })
        const el = container.firstElementChild
        const expected = frame({ row: true, alignX: "center", alignY: "stretch" })
        for (const cls of expected.split(" ").filter(Boolean)) {
            expect(el?.className).toContain(cls)
        }
    })

    it("merges additional className", () => {
        const container = document.createElement("div")
        act(() => {
            createRoot(container).render(createElement(Frame, { className: "custom" }))
        })
        expect(container.firstElementChild?.className).toContain("custom")
    })
})
