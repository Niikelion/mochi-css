import { describe, it, expect } from "vitest"
import { KeyframesObject } from "@/keyframesObject"
import dedent from "dedent"

describe("KeyframesObject", () => {
    it("should generate a deterministic name with 'kf' prefix", () => {
        const obj = new KeyframesObject({ from: { opacity: 0 }, to: { opacity: 1 } })
        expect(obj.name).toMatch(/^kf/)
        expect(obj.name).toEqual(new KeyframesObject({ from: { opacity: 0 }, to: { opacity: 1 } }).name)
    })

    it("should produce same name regardless of stop order", () => {
        const obj1 = new KeyframesObject({ from: { opacity: 0 }, to: { opacity: 1 } })
        const obj2 = new KeyframesObject({ to: { opacity: 1 }, from: { opacity: 0 } })
        expect(obj1.name).toEqual(obj2.name)
    })

    it("should produce same name regardless of property order within stops", () => {
        const obj1 = new KeyframesObject({ "0%": { opacity: 0, transform: "scale(1)" } })
        const obj2 = new KeyframesObject({ "0%": { transform: "scale(1)", opacity: 0 } })
        expect(obj1.name).toEqual(obj2.name)
    })

    it("should produce different names for different stops", () => {
        const obj1 = new KeyframesObject({ from: { opacity: 0 }, to: { opacity: 1 } })
        const obj2 = new KeyframesObject({ from: { opacity: 0.5 }, to: { opacity: 1 } })
        expect(obj1.name).not.toEqual(obj2.name)
    })

    it("should generate valid @keyframes CSS with kebab-case properties", () => {
        const obj = new KeyframesObject({
            from: { backgroundColor: "red" },
            to: { backgroundColor: "blue" },
        })
        const css = obj.asCssString()

        expect(css).toContain(`@keyframes ${obj.name}`)
        expect(css).toContain("from {")
        expect(css).toContain("to {")
        expect(css).toContain("background-color: red;")
        expect(css).toContain("background-color: blue;")
    })

    it("should apply auto-units to numeric values", () => {
        const obj = new KeyframesObject({
            "0%": { fontSize: 12 },
            "100%": { fontSize: 24 },
        })
        const css = obj.asCssString()

        expect(css).toContain("font-size: 12px;")
        expect(css).toContain("font-size: 24px;")
    })

    it("should handle percentage stops", () => {
        const obj = new KeyframesObject({
            "0%": { transform: "translateY(0)" },
            "50%": { transform: "translateY(-20px)" },
            "100%": { transform: "translateY(0)" },
        })
        const css = obj.asCssString()

        expect(css).toContain("0% {")
        expect(css).toContain("50% {")
        expect(css).toContain("100% {")
    })

    it("should produce correctly formatted CSS output", () => {
        const obj = new KeyframesObject({
            to: { opacity: 1, transform: "scale(1)" },
            from: { opacity: 0, transform: "scale(0.5)" },
        })

        expect(obj.asCssString()).toEqual(dedent`
            @keyframes ${obj.name} {
                from {
                    opacity: 0%;
                    transform: scale(0.5);
                }

                to {
                    opacity: 100%;
                    transform: scale(1);
                }
            }
        `)
    })

    it("should handle empty stops", () => {
        const obj = new KeyframesObject({})
        expect(obj.asCssString()).toEqual(`@keyframes ${obj.name} {\n\n}`)
    })
})
