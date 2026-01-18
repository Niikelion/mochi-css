import {describe, it, expect} from "vitest"
import {css, CSSObject, MochiCSS} from "@/css"
import {CssColor} from "@/values"
import {createToken} from "@/token"

describe('css', () => {
    it("should have a classname list that is deterministic and dependent on styles", () => {
        const css1 = css({
            border: "1px solid red",
            color: "blue"
        })
        const css2 = css({
            color: "blue",
            border: "1px solid red"
        })
        const css3 = css({
            color: "red",
            border: "1px solid red"
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
                        width: "auto"
                    },
                    wide: {
                        width: "100%"
                    },
                    narrow: {
                        width: 200
                    }
                }
            }
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
                        color: "red"
                    },
                    blue: {
                        color: "blue"
                    }
                }
            },
            defaultVariants: {
                color: "red"
            }
        })

        expect(cssWithVariants.variant({})).toEqual(cssWithVariants.variant({ color: "red" }))
        expect(cssWithVariants.variant({})).not.toEqual(cssWithVariants.variant({ color: "blue" }))
    })
})

//TODO: move to separate file
describe("CssObject", () => {
    it("should generate css code that accurately reflects provided styles for base styles", () => {
        const bg = createToken<CssColor>("background-color")

        const obj = new CSSObject({
            width: 200,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "end",
            background: bg,
            [bg.variable]: "red"
        })

        const styles = MochiCSS.from(obj)

        const expectedParts: string[] = [
            "width: 200px;",
            "display: flex;",
            "flex-direction: column;",
            "align-items: center;",
            "justify-content: end;",
            `background: ${bg.value};`,
            `${bg}: red;`
        ]

        const cssSource = obj.asCssString()

        // classnames appear in the source
        for (const className of styles.classNames)
            expect(cssSource).toContain(`.${className}`)

        // all expected parts appear in the source
        for (const part of expectedParts)
            expect(cssSource).toContain(part)
    })

    it("should generate css code that accurately reflects provided styles for variant styles", () => {
        const obj = new CSSObject({
            variants: {
                width: {
                    default: {
                        width: "auto"
                    },
                    wide: {
                        width: "100%"
                    },
                    narrow: {
                        width: 200
                    }
                }
            },
            defaultVariants: {
                width: "default"
            }
        })

        const styles = MochiCSS.from(obj)
        const cssSource = obj.asCssString()

        expect(cssSource).toContain(styles.variant({ width: "default" }).split(" ").map(c => `.${c}`).join(""))
        expect(cssSource).toContain(styles.variant({ width: "wide" }).split(" ").map(c => `.${c}`).join(""))
        expect(cssSource).toContain(styles.variant({ width: "narrow" }).split(" ").map(c => `.${c}`).join(""))

        const expectedParts: string[] = [
            "width: auto;",
            "width: 100%;",
            "width: 200px;",
        ]

        for (const expectedPart of expectedParts)
            expect(cssSource).toContain(expectedPart)
    })
})
