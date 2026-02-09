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

    it("should apply compound variant class only when all conditions match", () => {
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

        const bothMatch = styles.variant({ color: "red", size: "large" })
        const onlyColorMatch = styles.variant({ color: "red", size: "small" })
        const onlySizeMatch = styles.variant({ color: "blue", size: "large" })
        const neitherMatch = styles.variant({ color: "blue", size: "small" })

        // compound class should be present only when both conditions match
        expect(bothMatch).not.toEqual(onlyColorMatch)
        expect(bothMatch).not.toEqual(onlySizeMatch)
        expect(bothMatch).not.toEqual(neitherMatch)

        // the compound class name is accessible from compoundVariantClassNames
        const compoundClassName = styles.compoundVariantClassNames[0]?.className
        expect(compoundClassName).toBeDefined()

        expect(bothMatch).toContain(compoundClassName)
        expect(onlyColorMatch).not.toContain(compoundClassName)
        expect(onlySizeMatch).not.toContain(compoundClassName)
        expect(neitherMatch).not.toContain(compoundClassName)
    })

    it("should apply compound variant with default variants", () => {
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

        // default variants match the compound condition
        expect(styles.variant({})).toEqual(styles.variant({ color: "red", size: "large" }))

        // overriding one variant should break the compound match
        expect(styles.variant({ color: "blue" })).not.toEqual(styles.variant({}))
    })

    it("should support multiple compound variants", () => {
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
            compoundVariants: [
                { color: "red", size: "large", css: { fontWeight: "bold" } },
                { color: "blue", size: "small", css: { textDecoration: "underline" } },
            ],
        })

        const redLarge = styles.variant({ color: "red", size: "large" })
        const blueSmall = styles.variant({ color: "blue", size: "small" })
        const redSmall = styles.variant({ color: "red", size: "small" })

        // each compound variant applies to its own combination
        expect(redLarge).not.toEqual(redSmall)
        expect(blueSmall).not.toEqual(redSmall)

        // redSmall matches neither compound variant, so it has fewer classes
        const redLargeClasses = redLarge.split(" ")
        const redSmallClasses = redSmall.split(" ")
        expect(redLargeClasses.length).toBeGreaterThan(redSmallClasses.length)
    })

    it("should merge compound variants when composing css objects", () => {
        const base = css({
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

        const extended = css(base, {
            padding: 8,
        })

        expect(extended.compoundVariantClassNames).toHaveLength(1)
        expect(extended.compoundVariantClassNames).toEqual(base.compoundVariantClassNames)
    })

    it("should handle compound variant with partial conditions", () => {
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
            compoundVariants: [{ color: "red", css: { fontWeight: "bold" } }],
        })

        // compound with only color: red should match whenever color is red, regardless of size
        const redLarge = styles.variant({ color: "red", size: "large" })
        const redSmall = styles.variant({ color: "red", size: "small" })
        const blueLarge = styles.variant({ color: "blue", size: "large" })

        // both red variants should have the compound class
        const redLargeClasses = new Set(redLarge.split(" "))
        const redSmallClasses = new Set(redSmall.split(" "))
        const blueLargeClasses = new Set(blueLarge.split(" "))

        // find compound class (present in both red variants but not in blue)
        const compoundClass = [...redLargeClasses].find(
            (c) => redSmallClasses.has(c) && !blueLargeClasses.has(c) && c !== "",
        )
        expect(compoundClass).toBeDefined()
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
