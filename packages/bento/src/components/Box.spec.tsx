// @vitest-environment happy-dom
import { describe, it, expect } from "vitest"
import { createElement } from "react"
import { createRoot } from "react-dom/client"
import { act } from "react"
import { Box } from "./Box"
import { box } from "../generators/box"

describe("Box", () => {
    it("renders a div with the box() class", () => {
        const container = document.createElement("div")
        act(() => {
            createRoot(container).render(createElement(Box))
        })
        const el = container.firstElementChild
        expect(el?.tagName.toLowerCase()).toBe("div")
        expect(el?.className).toContain(box())
    })

    it("merges additional className", () => {
        const container = document.createElement("div")
        act(() => {
            createRoot(container).render(createElement(Box, { className: "extra" }))
        })
        expect(container.firstElementChild?.className).toContain("extra")
        expect(container.firstElementChild?.className).toContain(box())
    })

    it("forwards HTML attributes", () => {
        const container = document.createElement("div")
        act(() => {
            createRoot(container).render(createElement(Box, { id: "my-box" }))
        })
        expect(container.firstElementChild?.id).toBe("my-box")
    })
})
