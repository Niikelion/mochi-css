import { describe, it, expect } from "vitest"
import { GlobalCssObject } from "@/globalCssObject"
import dedent from "dedent"

describe("GlobalCssObject", () => {
    it("should generate CSS for a simple selector", () => {
        const obj = new GlobalCssObject({ body: { margin: 0 } })
        const css = obj.asCssString()

        expect(css).toContain("body {")
        expect(css).toContain("margin: 0;")
    })

    it("should apply auto-units to numeric values", () => {
        const obj = new GlobalCssObject({ h1: { fontSize: 24 } })
        expect(obj.asCssString()).toContain("font-size: 24px;")
    })

    it("should sort selectors deterministically", () => {
        const obj1 = new GlobalCssObject({ h2: { color: "blue" }, h1: { color: "red" } })
        const obj2 = new GlobalCssObject({ h1: { color: "red" }, h2: { color: "blue" } })
        expect(obj1.asCssString()).toEqual(obj2.asCssString())

        const css = obj1.asCssString()
        expect(css.indexOf("h1 {")).toBeLessThan(css.indexOf("h2 {"))
    })

    it("should sort properties within a rule deterministically", () => {
        const obj1 = new GlobalCssObject({ body: { margin: 0, padding: 0 } })
        const obj2 = new GlobalCssObject({ body: { padding: 0, margin: 0 } })
        expect(obj1.asCssString()).toEqual(obj2.asCssString())
    })

    it("should handle pseudo-class selectors", () => {
        const obj = new GlobalCssObject({ "a:hover": { color: "blue" } })
        const css = obj.asCssString()

        expect(css).toContain("a:hover {")
        expect(css).toContain("color: blue;")
    })

    it("should handle universal selector", () => {
        const obj = new GlobalCssObject({ "*": { boxSizing: "border-box" } })
        const css = obj.asCssString()

        expect(css).toContain("* {")
        expect(css).toContain("box-sizing: border-box;")
    })

    it("should handle nested selectors inside a rule", () => {
        const obj = new GlobalCssObject({
            body: { margin: 0, "&:hover": { color: "red" } },
        })
        const css = obj.asCssString()

        expect(css).toContain("body {")
        expect(css).toContain("margin: 0;")
        expect(css).toContain("body:hover {")
        expect(css).toContain("color: red;")
    })

    it("should handle media queries inside a rule", () => {
        const obj = new GlobalCssObject({
            body: { "@media (min-width: 768px)": { margin: 8 } },
        })
        const css = obj.asCssString()

        expect(css).toContain("@media")
        expect(css).toContain("body {")
        expect(css).toContain("margin: 8px;")
    })

    it("should produce correctly formatted CSS", () => {
        const obj = new GlobalCssObject({
            h1: { color: "red", fontSize: 24 },
        })

        expect(obj.asCssString()).toEqual(dedent`
            h1 {
                color: red;
                font-size: 24px;
            }
        `)
    })

    it("should separate multiple selectors with double newlines", () => {
        const obj = new GlobalCssObject({
            body: { margin: 0 },
            h1: { color: "red" },
        })
        const css = obj.asCssString()

        expect(css).toContain("body {")
        expect(css).toContain("h1 {")
        expect(css).toContain("\n\n")
    })

    it("should return empty string for empty styles", () => {
        const obj = new GlobalCssObject({})
        expect(obj.asCssString()).toEqual("")
    })

    it("should handle CSS custom properties", () => {
        const obj = new GlobalCssObject({ ":root": { "--primary": "blue" } })
        const css = obj.asCssString()

        expect(css).toContain(":root {")
        expect(css).toContain("--primary: blue;")
    })
})
