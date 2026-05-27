// @vitest-environment happy-dom
import { describe, it, expect } from "vitest"
import { createElement } from "react"
import { createRoot } from "react-dom/client"
import { act } from "react"
import { Apply } from "./Apply"

describe("Apply", () => {
    it("merges the class into the child element's className", () => {
        const container = document.createElement("div")
        act(() => {
            createRoot(container).render(createElement(Apply, { class: "injected" }, createElement("nav")))
        })
        const nav = container.querySelector("nav")
        expect(nav?.className).toContain("injected")
    })

    it("preserves the child's existing className", () => {
        const container = document.createElement("div")
        act(() => {
            createRoot(container).render(
                createElement(Apply, { class: "injected" }, createElement("nav", { className: "original" })),
            )
        })
        const nav = container.querySelector("nav")
        expect(nav?.className).toContain("original")
        expect(nav?.className).toContain("injected")
    })

    it("does not add a wrapper DOM node", () => {
        const container = document.createElement("div")
        act(() => {
            createRoot(container).render(createElement(Apply, { class: "x" }, createElement("span")))
        })
        expect(container.children.length).toBe(1)
        expect(container.firstElementChild?.tagName.toLowerCase()).toBe("span")
    })

    it("silently no-ops for non-element children (plain text)", () => {
        const container = document.createElement("div")
        act(() => {
            createRoot(container).render(createElement(Apply, { class: "x" }, "plain text"))
        })
        expect(container.textContent).toBe("plain text")
    })
})
