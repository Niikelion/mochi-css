import { describe, it, expect } from "vitest"
import {
    asKnownProp,
    asVar,
    camelToKebab,
    cssFromProps,
    isCssVariableName,
    isKnownPropertyName,
    isMediaSelector,
    isNestedSelector,
    kebabToCamel,
    SimpleStyleProps,
} from "@/props"
import { createToken } from "@/token"

describe("isCssVariableName", () => {
    it("returns true for variable names", () => {
        expect(isCssVariableName("--test")).toEqual(true)
        expect(isCssVariableName("--backgroundColor")).toEqual(true)
        expect(isCssVariableName("--background-color")).toEqual(true)
        expect(isCssVariableName("---stitchesjs-like-name")).toEqual(true)
        expect(isCssVariableName("--test_2")).toEqual(true)
        expect(isCssVariableName("--2test")).toEqual(true)
    })

    it("returns false for properties, selectors and media queries", () => {
        expect(isCssVariableName("background-color")).toEqual(false)
        expect(isCssVariableName("color")).toEqual(false)
        expect(isCssVariableName("-webkit-text-stroke")).toEqual(false)
        expect(isCssVariableName(".test")).toEqual(false)
        expect(isCssVariableName(".button:active")).toEqual(false)
        expect(isCssVariableName("& > span")).toEqual(false)
        expect(isCssVariableName(".selected > &")).toEqual(false)
        expect(isCssVariableName("@max-width: 200px")).toEqual(false)
        expect(isCssVariableName("@screen")).toEqual(false)
    })
})

describe("asVar", () => {
    it("does not modify string values", () => {
        expect(asVar("test")).toEqual("test")
    })
    it("converts number values to strings", () => {
        expect(asVar(0)).toEqual("0")
        expect(asVar(17)).toEqual("17")
    })
    it("extracts value from CssLikeObject", () => {
        expect(asVar({ value: 7 })).toEqual("7")
        expect(asVar({ value: "some value" })).toEqual("some value")
    })
})

describe("isKnownPropertyName", () => {
    it("returns true for popular css property names in kebabCase", () => {
        expect(isKnownPropertyName("color")).toEqual(true)
        expect(isKnownPropertyName("backgroundColor")).toEqual(true)
        expect(isKnownPropertyName("fontSize")).toEqual(true)
        expect(isKnownPropertyName("border")).toEqual(true)
        expect(isKnownPropertyName("marginLeft")).toEqual(true)
        expect(isKnownPropertyName("paddingBottom")).toEqual(true)
        expect(isKnownPropertyName("width")).toEqual(true)
        expect(isKnownPropertyName("display")).toEqual(true)
    })
})

describe("asKnownProp", () => {
    it("appends px suffix to number values in length properties", () => {
        expect(asKnownProp(200, "height")).toEqual("200px")
        expect(asKnownProp(48, "gap")).toEqual("48px")
        expect(asKnownProp(16, "fontSize")).toEqual("16px")
        expect(asKnownProp(10, "borderRadius")).toEqual("10px")
    })

    it("appends ms suffix to number values in time properties", () => {
        expect(asKnownProp(300, "animationDuration")).toEqual("300ms")
        expect(asKnownProp(150, "transitionDelay")).toEqual("150ms")
        expect(asKnownProp(200, "transitionDuration")).toEqual("200ms")
    })

    it("appends % suffix to number values in percentage properties", () => {
        expect(asKnownProp(50, "opacity")).toEqual("50%")
        expect(asKnownProp(100, "fillOpacity")).toEqual("100%")
    })

    it("appends deg suffix to number values in angle properties", () => {
        expect(asKnownProp(45, "rotate")).toEqual("45deg")
        expect(asKnownProp(90, "imageOrientation")).toEqual("90deg")
    })

    it("converts number values to strings without suffix for plain number properties", () => {
        expect(asKnownProp(100, "zIndex")).toEqual("100")
        expect(asKnownProp(700, "fontWeight")).toEqual("700")
    })

    it("passes string values through unchanged", () => {
        expect(asKnownProp("100%", "width")).toEqual("100%")
        expect(asKnownProp("auto", "height")).toEqual("auto")
        expect(asKnownProp("1fr 2fr", "gridTemplateColumns")).toEqual("1fr 2fr")
    })

    it("extracts value from CssLikeObject", () => {
        expect(asKnownProp({ value: 200 }, "height")).toEqual("200px")
        expect(asKnownProp({ value: "auto" }, "width")).toEqual("auto")
    })
})

describe("isNestedSelector", () => {
    it("returns true only if input contains '&' character", () => {
        expect(isNestedSelector("&")).toEqual(true)
        expect(isNestedSelector("& span")).toEqual(true)
        expect(isNestedSelector("div.container > &")).toEqual(true)

        expect(isNestedSelector("button.primary")).toEqual(false)
        expect(isNestedSelector("@max-width: 400px")).toEqual(false)
        expect(isNestedSelector("--test")).toEqual(false)
    })
})

describe("isMediaSelector", () => {
    it("returns true only if input starts with '@' character", () => {
        expect(isMediaSelector("@max-width: 400px")).toEqual(true)

        expect(isMediaSelector("& span")).toEqual(false)
    })
})

describe("camelToKebab", () => {
    it("converts correct camelCase strings to according kebab-case ones", () => {
        expect(camelToKebab("backgroundColor")).toEqual("background-color")
        expect(camelToKebab("color")).toEqual("color")
        expect(camelToKebab("WebkitTextStroke")).toEqual("-webkit-text-stroke")
    })
})

describe("kebabToCamel", () => {
    it("converts correct kebab-case strings to according camelCase ones", () => {
        expect(kebabToCamel("background-color")).toEqual("backgroundColor")
        expect(kebabToCamel("color")).toEqual("color")
        expect(kebabToCamel("-webkit-text-stroke")).toEqual("WebkitTextStroke")
    })
})

describe("cssFromProps", () => {
    it("correctly transforms property names", () => {
        const props = cssFromProps({
            backgroundColor: "magenta",
            display: "block",
            WebkitAlignContent: "center",
        })

        expect(props).toHaveProperty("background-color")
    })

    it("skips properties with invalid names", () => {
        const props = cssFromProps({
            someIncorrectlyNamedProperty: "value",
        } as unknown as SimpleStyleProps)

        expect(props).not.toHaveProperty("some-incorrectly-named-property")
    })

    it("correctly handles tokens", () => {
        const backgroundToken = createToken("background")
        const widthToken = createToken("width")

        const props = cssFromProps({
            [backgroundToken.variable]: "red",
            width: widthToken,
            [widthToken.variable]: "200px",
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
                },
            },
            [bgColor.variable]: "red",
            [opacity.variable]: 0.7,
            [bg.variable]: bgColor,
            font: undefined,
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
