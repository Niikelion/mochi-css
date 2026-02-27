// @vitest-environment happy-dom
import React from "react"
import { describe, it, expect } from "vitest"
import { createTestRenderer } from "./utils"
import { media } from "@/query"

const renderer = createTestRenderer()

// happy-dom does not evaluate media queries for computed styles, so these
// tests verify that the correct CSS is generated and injected into the DOM.
function injectedCss(): string {
    return document.getElementById("mochi-test-styles")?.textContent ?? ""
}

describe("media query integration", () => {
    it("generates @media rules using the string key syntax", () => {
        const Box = renderer.css({
            width: "100%",
            padding: 16,
            "@media (min-width: 768px)": {
                width: 800,
                padding: 32,
            },
        })

        renderer.render(<div className={Box.variant({})}>content</div>)

        const css = injectedCss()
        expect(css).toContain("width: 100%")
        expect(css).toContain("padding: 16px")
        expect(css).toContain("@media (min-width: 768px)")
        expect(css).toContain("width: 800px")
        expect(css).toContain("padding: 32px")
    })

    it("generates @media rules using the media() helper and media.dark shorthand", () => {
        const Card = renderer.css({
            backgroundColor: "white",
            color: "black",
            [media.dark]: {
                backgroundColor: "black",
                color: "white",
            },
            [media("min-width: 1024px")]: {
                padding: 24,
            },
        })

        renderer.render(<div className={Card.variant({})}>content</div>)

        const css = injectedCss()
        expect(css).toContain("@media (prefers-color-scheme: dark)")
        expect(css).toContain("background-color: black")
        expect(css).toContain("@media (min-width: 1024px)")
        expect(css).toContain("padding: 24px")
    })
})
