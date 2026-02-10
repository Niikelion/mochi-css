import { describe, it, expect } from "vitest"
import { css, MochiCSS } from "@/css"

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

    it("should skip null and non-object props", () => {
        const result = css(null as never, undefined as never, 42 as never, { color: "red" })
        expect(result.classNames).toHaveLength(1)

        const empty = css(null as never)
        expect(empty.classNames).toHaveLength(0)
        expect(empty.variant({})).toEqual("")
    })

    it("should not add compound variant classes at runtime (handled by CSS)", () => {
        const styles = css({
            variants: {
                color: {
                    red: { color: "red" },
                    blue: { color: "blue" },
                },
                size: {
                    small: { fontSize: 12 },
                    large: { fontSize: 18 },
                },
            },
            compoundVariants: [{ color: "red", size: "large", css: { fontWeight: "bold" } }],
        })

        // variant() output only contains base + variant classes, no compound-specific class
        const redLarge = styles.variant({ color: "red", size: "large" })
        const redSmall = styles.variant({ color: "red", size: "small" })
        const blueLarge = styles.variant({ color: "blue", size: "large" })

        // same number of classes regardless of compound match — compound is CSS-level
        expect(redLarge.split(" ").length).toEqual(redSmall.split(" ").length)
        expect(redLarge.split(" ").length).toEqual(blueLarge.split(" ").length)
    })

    it("should still resolve default variants correctly with compound variants present", () => {
        const styles = css({
            variants: {
                color: {
                    red: { color: "red" },
                    blue: { color: "blue" },
                },
                size: {
                    small: { fontSize: 12 },
                    large: { fontSize: 18 },
                },
            },
            defaultVariants: {
                color: "red",
                size: "large",
            },
            compoundVariants: [{ color: "red", size: "large", css: { fontWeight: "bold" } }],
        })

        // default variants still resolve correctly
        expect(styles.variant({})).toEqual(styles.variant({ color: "red", size: "large" }))

        // overriding one variant changes the output
        expect(styles.variant({ color: "blue" })).not.toEqual(styles.variant({}))
    })

    it("should handle variant() with missing variant group gracefully", () => {
        const mochi = new MochiCSS<{ broken: { value: object } }>(["base"], { broken: undefined } as never, {})
        expect(mochi.variant({ broken: "value" })).toEqual("base")
    })

    it("should handle variant() when variantKey resolves to null", () => {
        const styles = css({
            variants: {
                size: {
                    small: { fontSize: 12 },
                },
            },
        })
        expect(styles.variant({ size: undefined })).toEqual(styles.classNames.join(" "))
    })
})
