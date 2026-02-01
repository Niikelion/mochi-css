import { describe, it, expect } from "vitest"
import { css } from "@/css"

describe("css", () => {
    it("should have a classname list that is deterministic and dependent on styles", () => {
        const css1 = css({
            border: "1px solid red",
            color: "blue",
        })
        const css2 = css({
            color: "blue",
            border: "1px solid red",
        })
        const css3 = css({
            color: "red",
            border: "1px solid red",
        })

        // order of properties in style definition does not matter
        expect(css2.classNames).toEqual(css1.classNames)

        // different style results in different class names
        expect(css1.classNames).not.toEqual(css3.classNames)
        expect(css2.classNames).not.toEqual(css3.classNames)

        // order of provided style definitions influences order of classes in classNames, but not the classes themselves
        expect(css({}, css1).classNames).not.toEqual(css(css1, {}).classNames)
        expect(new Set(css({}, css1).classNames)).toEqual(new Set(css(css1, {}).classNames))

        const cssWithVariants = css({
            color: "green",
            variants: {
                width: {
                    default: {
                        width: "auto",
                    },
                    wide: {
                        width: "100%",
                    },
                    narrow: {
                        width: 200,
                    },
                },
            },
        })

        // variants with different styles result in different classNames
        expect(cssWithVariants.classNames.join(" ")).toEqual(cssWithVariants.variant({}))
        expect(cssWithVariants.classNames.join(" ")).not.toEqual(cssWithVariants.variant({ width: "default" }))
        expect(cssWithVariants.classNames.join(" ")).not.toEqual(cssWithVariants.variant({ width: "wide" }))
        expect(cssWithVariants.classNames.join(" ")).not.toEqual(cssWithVariants.variant({ width: "narrow" }))
        expect(cssWithVariants.variant({ width: "default" })).not.toEqual(cssWithVariants.variant({ width: "wide" }))
        expect(cssWithVariants.variant({ width: "default" })).not.toEqual(cssWithVariants.variant({ width: "narrow" }))
        expect(cssWithVariants.variant({ width: "wide" })).not.toEqual(cssWithVariants.variant({ width: "narrow" }))
    })

    it("should fall back to default variant when specified", () => {
        const cssWithVariants = css({
            variants: {
                color: {
                    red: {
                        color: "red",
                    },
                    blue: {
                        color: "blue",
                    },
                },
            },
            defaultVariants: {
                color: "red",
            },
        })

        expect(cssWithVariants.variant({})).toEqual(cssWithVariants.variant({ color: "red" }))
        expect(cssWithVariants.variant({})).not.toEqual(cssWithVariants.variant({ color: "blue" }))
    })

    it("should silently skip invalid variant values", () => {
        const cssWithVariants = css({
            variants: {
                color: {
                    red: {
                        color: "red",
                    },
                    blue: {
                        color: "blue",
                    },
                },
                bold: {
                    true: {
                        fontWeight: "bold",
                    },
                },
            },
            defaultVariants: {
                color: "red",
            },
        })

        expect(cssWithVariants.variant({})).toEqual(cssWithVariants.variant({ color: "green" } as object))
        expect(cssWithVariants.variant({ color: "red" })).toEqual(
            cssWithVariants.variant({ color: "red", size: "large" } as { color: "red" }),
        )
        expect(cssWithVariants.variant({})).toEqual(cssWithVariants.variant({ bold: "yes" } as object))
    })
})
