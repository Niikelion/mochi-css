// @vitest-environment happy-dom
import React from "react"
import { describe, it, expect } from "vitest"
import { createTestRenderer, toMatchCss } from "./utils"

expect.extend({ toMatchCss })

const renderer = createTestRenderer()

describe("globalCss integration", () => {
    it("applies styles to an element selector", () => {
        renderer.globalCss({ h1: { color: "red" } })
        const { getByText } = renderer.render(<h1>Heading</h1>)

        expect(getComputedStyle(getByText("Heading"))).toMatchCss({ color: "red" })
    })

    it("applies multiple properties", () => {
        renderer.globalCss({ p: { margin: 0, padding: 0 } })
        const { getByText } = renderer.render(<p>Paragraph</p>)

        expect(getComputedStyle(getByText("Paragraph"))).toMatchCss({ margin: "0px", padding: "0px" })
    })

    it("applies auto-unit numeric values", () => {
        renderer.globalCss({ h2: { fontSize: 20 } })
        const { getByText } = renderer.render(<h2>Subheading</h2>)

        expect(getComputedStyle(getByText("Subheading"))).toMatchCss({ fontSize: "20px" })
    })

    it("applies styles from multiple selectors", () => {
        renderer.globalCss({
            h3: { color: "blue" },
            h4: { color: "green" },
        })
        const { getByText } = renderer.render(
            <div>
                <h3>Blue</h3>
                <h4>Green</h4>
            </div>,
        )

        expect(getComputedStyle(getByText("Blue"))).toMatchCss({ color: "blue" })
        expect(getComputedStyle(getByText("Green"))).toMatchCss({ color: "green" })
    })

    it("applies CSS custom properties", () => {
        renderer.globalCss({ ":root": { "--text-color": "purple" } })
        renderer.globalCss({ h5: { color: "var(--text-color)" } })
        const { getByText } = renderer.render(<h5>Heading</h5>)

        expect(getComputedStyle(getByText("Heading"))).toMatchCss({ color: "purple" })
    })
})
