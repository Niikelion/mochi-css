import {describe, it, expect} from "vitest"
import {cssFromProps} from "@/props";
import {createToken} from "@/token";

describe("cssFromProps", () => {
    it("correctly transforms property names", () => {
        const props = cssFromProps({
            backgroundColor: "magenta",
            display: "block",
            WebkitAlignContent: "center"
        })

        expect(props).toHaveProperty("background-color")
    })

    it("skips properties with invalid names", () => {
        const props = cssFromProps({
            someIncorrectlyNamedProperty: "value"
        } as any)

        expect(props).not.toHaveProperty("some-incorrectly-named-property")
    })

    it("correctly handles tokens", () => {
        const backgroundToken = createToken("background")
        const widthToken = createToken("width")

        const props = cssFromProps({
            [backgroundToken.variable]: "red",
            width: widthToken,
            [widthToken.variable]: "200px"
        })

        expect(props).toHaveProperty("--background")
        expect(props).toHaveProperty("width")
        expect(props).toHaveProperty("--width")

        expect(props["width"]).toEqual(widthToken.value)
    })

    it("correctly handles different types of values", () => {
        const bg = createToken("bg")
        const opacity = createToken("opacity")
        const bgColor = createToken("bgColor")

        const props = cssFromProps({
            fontWeight: 700,
            display: "inline-block",
            color: {
                get value() {
                    return "white"
                }
            },
            [bgColor.variable]: "red",
            [opacity.variable]: 0.7,
            [bg.variable]: bgColor,
            font: undefined
        })

        expect(props).toEqual({
            ["font-weight"]: "700",
            display: "inline-block",
            color: "white",
            ["--bgColor"]: "red",
            ["--opacity"]: "0.7",
            ["--bg"]: "var(--bgColor)",
        })
    })
})
