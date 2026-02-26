// @vitest-environment happy-dom
import React from "react"
import { describe, it, expect } from "vitest"
import { createTestRenderer, toMatchCss } from "./utils"

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
