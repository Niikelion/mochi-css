// @vitest-environment happy-dom
import React from "react"
import { describe, it, expect } from "vitest"
import { createTestRenderer, toMatchCss } from "./utils"
import { styled } from "@/styled"
import { _mochiPrebuilt, isMochiCSS } from "@mochi-css/vanilla"

expect.extend({ toMatchCss })

const renderer = createTestRenderer()

describe("base styles", () => {
    it("applies color", () => {
        const RedText = renderer.styled("div", { color: "red" })
        const { getByText } = renderer.render(<RedText>Red text</RedText>)

        expect(getComputedStyle(getByText("Red text"))).toMatchCss({ color: "red" })
    })

    it("applies width", () => {
        const Box = renderer.styled("div", { width: 200, height: 200 })
        const { getByText } = renderer.render(<Box>Box content</Box>)

        expect(getComputedStyle(getByText("Box content"))).toMatchCss({ width: "200px", height: "200px" })
    })
})

describe("merging css() result with variants into styled", () => {
    it("preserves variants from a MochiCSS arg passed to styled", () => {
        const base = renderer.css({
            color: "red",
            variants: {
                size: {
                    small: { fontSize: "12px" },
                    large: { fontSize: "18px" },
                },
            },
            defaultVariants: { size: "small" },
        })
        const Button = renderer.styled("button", base, { fontWeight: "bold" })
        const { getByText } = renderer.render(<Button size="large">Click</Button>)

        expect(getComputedStyle(getByText("Click"))).toMatchCss({ fontSize: "18px", fontWeight: "bold" })
    })

    it("applies default variant from merged MochiCSS", () => {
        const base = renderer.css({
            variants: {
                color: {
                    red: { color: "red" },
                    blue: { color: "blue" },
                },
            },
            defaultVariants: { color: "red" },
        })
        const Box = renderer.styled("div", base)
        const { getByText } = renderer.render(<Box>Content</Box>)

        expect(getComputedStyle(getByText("Content"))).toMatchCss({ color: "red" })
    })
})

describe("variant prop stripping", () => {
    it("does not pass variant props to the DOM element", () => {
        const Button = renderer.styled("button", {
            variants: { size: { sm: { fontSize: 12 }, lg: { fontSize: 18 } } },
        })
        const { container } = renderer.render(<Button size="lg">click</Button>)
        const btn = container.querySelector("button")
        expect(btn?.hasAttribute("size")).toBe(false)
    })
})

describe("_mochiPrebuilt fast path", () => {
    it("isMochiCSS recognizes _mochiPrebuilt result", () => {
        const instance = _mochiPrebuilt(["s-test"], { color: { red: "cRed", green: "cGreen" } }, { color: "red" })
        expect(isMochiCSS(instance)).toBe(true)
    })

    it("styled fast path strips variant props from DOM when given _mochiPrebuilt result", () => {
        const instance = _mochiPrebuilt(["s-fp"], { size: { sm: "c-sm", lg: "c-lg" } }, {})
        const Button = styled("button", instance)
        const { container } = renderer.render(<Button size="lg">click</Button>)
        const btn = container.querySelector("button")
        expect(btn?.hasAttribute("size")).toBe(false)
    })

    it("styled fast path applies variant class from _mochiPrebuilt result", () => {
        const instance = _mochiPrebuilt(["s-fp2"], { size: { sm: "c-sm2", lg: "c-lg2" } }, {})
        const Button = styled("button", instance)
        const { container } = renderer.render(<Button size="lg">click</Button>)
        const btn = container.querySelector("button")
        expect(btn?.className).toContain("c-lg2")
    })
})

describe("component targeting selector", () => {
    it("toString() returns a CSS selector string", () => {
        const Button = renderer.styled("button", { color: "red" })
        expect(Button.toString()).toMatch(/^\.[a-zA-Z0-9]+$/)
    })

    it("selector property matches toString()", () => {
        const Button = renderer.styled("button", { color: "blue" })
        expect(Button.selector).toBe(Button.toString())
    })

    it("selector can be used to target the component from another style", () => {
        const Inner = renderer.styled("span", { color: "blue" })
        const Outer = renderer.styled("div", {
            [`& ${Inner}`]: { color: "red" },
        })
        const { getByText } = renderer.render(
            <Outer>
                <Inner>text</Inner>
            </Outer>,
        )

        expect(getComputedStyle(getByText("text"))).toMatchCss({ color: "red" })
    })
})
