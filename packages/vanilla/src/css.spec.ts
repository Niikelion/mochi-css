import { describe, it, expect } from "vitest"
import { css, isMochiCSS, MochiCSS } from "@/css"
import { StyleProps } from "@/props"

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
        const mochi = new MochiCSS<{ broken: { value: StyleProps } }>(["base"], { broken: undefined } as never, {})
        expect(mochi.variant({ broken: "value" })).toEqual("base")
    })

    it("selector and toString return .className for the first class", () => {
        const styles = css({ color: "red" })
        expect(styles.selector).toBe(`.${styles.classNames[0]}`)
        expect(styles.toString()).toBe(`.${styles.classNames[0]}`)
    })

    it("selector and toString return empty string when there are no class names", () => {
        const empty = new MochiCSS([], {}, {})
        expect(empty.selector).toBe("")
        expect(empty.toString()).toBe("")
    })

    it("string arg becomes a class name without generating CSS", () => {
        const styles = css("my-class", { color: "red" })
        expect(styles.classNames).toContain("my-class")
        // still has the CSS-generated class
        expect(styles.classNames.length).toBe(2)
    })

    it("manual string first: selector includes all class names as CSS selector", () => {
        const styles = css("my-external-class", { color: "blue" })
        expect(styles.selector).toBe(styles.classNames.map((n) => `.${n}`).join(","))
        expect(styles.selector).toContain(".my-external-class")
    })

    it("injected s- string last: selector includes all class names as CSS selector", () => {
        const styles = css({ color: "blue" }, "s-Abc12345")
        expect(styles.selector).toBe(styles.classNames.map((n) => `.${n}`).join(","))
        expect(styles.classNames).toContain("s-Abc12345")
    })

    it("no string args: selector returns first class (unchanged behavior)", () => {
        const styles = css({ color: "blue" })
        expect(styles.selector).toBe(`.${styles.classNames[0]}`)
        expect(styles.classNames.length).toBe(1)
    })

    it("merged css preserves variants from a MochiCSS instance passed as arg", () => {
        const base = css({
            color: "red",
            variants: {
                size: {
                    small: { fontSize: 12 },
                    large: { fontSize: 18 },
                },
            },
            defaultVariants: { size: "small" },
        })
        const extended = css(base, { fontWeight: "bold" })

        // all base class names are present in merged result
        for (const cn of base.classNames) {
            expect(extended.classNames).toContain(cn)
        }

        // variants from base are preserved in the merged result
        expect(extended.variant({ size: "small" })).toContain(base.variant({ size: "small" }).split(" ")[1])
        expect(extended.variant({ size: "large" })).toContain(base.variant({ size: "large" }).split(" ")[1])

        // default variant from base is preserved
        expect(extended.variant({})).toEqual(extended.variant({ size: "small" }))
    })

    it("isMochiCSS returns true for MochiCSS instances and false for everything else", () => {
        expect(isMochiCSS(css({ color: "red" }))).toBe(true)
        expect(isMochiCSS(new MochiCSS([], {}, {}))).toBe(true)
        expect(isMochiCSS({ color: "red" })).toBe(false)
        expect(isMochiCSS({})).toBe(false)
        expect(isMochiCSS(null)).toBe(false)
        expect(isMochiCSS(undefined)).toBe(false)
        expect(isMochiCSS(42)).toBe(false)
        expect(isMochiCSS("string")).toBe(false)
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
