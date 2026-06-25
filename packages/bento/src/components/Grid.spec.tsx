// @vitest-environment happy-dom
import { describe, it, expect } from "vitest"
import { createElement } from "react"
import { createRoot } from "react-dom/client"
import { act } from "react"
import { Grid } from "./Grid"
import { grid } from "../generators/grid"

describe("Grid", () => {
    it("renders a div with the grid() class", () => {
        const container = document.createElement("div")
        act(() => {
            createRoot(container).render(createElement(Grid))
        })
        const el = container.firstElementChild
        expect(el?.tagName.toLowerCase()).toBe("div")
        expect(el?.className).toContain(grid({}))
    })

    it("sets --bento-grid-cols CSS variable for numeric columns", () => {
        const container = document.createElement("div")
        act(() => {
            createRoot(container).render(createElement(Grid, { columns: 3 }))
        })
        const el = container.firstElementChild as HTMLElement | null
        expect(el?.style.getPropertyValue("--bento-grid-cols")).toBe("repeat(3, 1fr)")
    })

    it("sets --bento-grid-cols CSS variable for string columns", () => {
        const container = document.createElement("div")
        act(() => {
            createRoot(container).render(createElement(Grid, { columns: "200px 1fr" }))
        })
        const el = container.firstElementChild as HTMLElement | null
        expect(el?.style.getPropertyValue("--bento-grid-cols")).toBe("200px 1fr")
    })

    it("sets --bento-grid-rows CSS variable for numeric rows", () => {
        const container = document.createElement("div")
        act(() => {
            createRoot(container).render(createElement(Grid, { rows: 2 }))
        })
        const el = container.firstElementChild as HTMLElement | null
        expect(el?.style.getPropertyValue("--bento-grid-rows")).toBe("repeat(2, 1fr)")
    })

    it("sets --bento-grid-areas from grid.areas()", () => {
        const layout = grid.areas([
            ["header", "header"],
            ["sidebar", "content"],
        ])
        const container = document.createElement("div")
        act(() => {
            createRoot(container).render(createElement(Grid, { areas: layout }))
        })
        const el = container.firstElementChild as HTMLElement | null
        expect(el?.style.getPropertyValue("--bento-grid-areas")).toBe(layout.template)
    })

    it("does not set CSS variables when props are omitted", () => {
        const container = document.createElement("div")
        act(() => {
            createRoot(container).render(createElement(Grid))
        })
        const el = container.firstElementChild as HTMLElement | null
        expect(el?.style.getPropertyValue("--bento-grid-cols")).toBe("")
        expect(el?.style.getPropertyValue("--bento-grid-rows")).toBe("")
    })
})
