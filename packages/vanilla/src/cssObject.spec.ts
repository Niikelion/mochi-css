import {describe, it, expect} from "vitest"
import {createToken} from "@/token";
import {CssColor} from "@/values";
import {CSSObject, CssObjectSubBlock} from "@/cssObject";
import {MochiCSS} from "@/css";
import {MochiSelector} from "@/selector";
import dedent from "dedent";
import {StyleProps} from "@/props";

describe("CssObjectSubBlock", () => {
    describe("hash", () => {
        it("should return same hash for same properties and selector", () => {
            const blocks = [
                new CssObjectSubBlock({
                    color: "red"
                }, new MochiSelector()),
                new CssObjectSubBlock({
                    color: "green"
                }, new MochiSelector()),
                new CssObjectSubBlock({
                    backgroundColor: "red"
                }, new MochiSelector()),
                new CssObjectSubBlock({
                    color: "red"
                }, new MochiSelector(["& > button"])),
                new CssObjectSubBlock({
                    color: "red"
                }, new MochiSelector(["& > button"], ["width > 100px"]))
            ] as const

            expect(blocks[0].hash).toEqual(blocks[0].hash)
            expect(blocks[1].hash).toEqual(blocks[1].hash)
            expect(blocks[0].hash).not.toEqual(blocks[1].hash)

            expect(blocks[2].hash).toEqual(blocks[2].hash)
            expect(blocks[2].hash).not.toEqual(blocks[0].hash)
            expect(blocks[2].hash).not.toEqual(blocks[1].hash)

            expect(blocks[1].hash).not.toEqual(blocks[3].hash)
            expect(blocks[1].hash).not.toEqual(blocks[4].hash)
            expect(blocks[3].hash).not.toEqual(blocks[4].hash)
        })

        it("should return the same value regardless of the properties order", () => {
            const subBlock1 = new CssObjectSubBlock({
                color: "red",
                backgroundColor: "blue"
            }, new MochiSelector())

            const subBlock2 = new CssObjectSubBlock({
                backgroundColor: "blue",
                color: "red"
            }, new MochiSelector())

            expect(subBlock1.hash).toEqual(subBlock2.hash)
        })
    })

    describe("asCssString", () => {
        it("returns formatted css string including css selector with provided root and media queries with css properties sorted by name", () => {
            expect(new CssObjectSubBlock({
                color: "white",
                backgroundColor: "gray"
            }, new MochiSelector(["&:hover"])).asCssString(".button")).toEqual(dedent`
                .button:hover {
                    backgroundColor: gray;
                    color: white;
                }
            `)

            expect(new CssObjectSubBlock({
                width: "100%"
            }, new MochiSelector(["&"], ["width <= 480px"])).asCssString(".test")).toEqual(dedent`
                @media (width <= 480px) {
                    .test {
                        width: 100%;
                    }
                }
            `)
        })
    })

    describe("fromProps", () => {
        it("should ignore undefined values", () => {
            const blocks = CssObjectSubBlock.fromProps({
                "& > span": undefined,
                "@max-width: 500px": undefined,
                "color": undefined
            })

            expect(blocks.map(b => b.asCssString(".target"))).toEqual([
                dedent`
                    .target {
                    }
                `
            ])
        })

        it("should properly construct single CssObjectSubBlock from props", () => {
            const blocks = CssObjectSubBlock.fromProps({
                color: "black"
            })

            expect(blocks.map(b => b.asCssString(".test"))).toEqual([dedent`
                .test {
                    color: black;
                }
            `])
        })

        it("should flatten the nested structure into the list of CssObjectSubBlock", () => {
            const blocks = CssObjectSubBlock.fromProps({
                color: "black",
                "&:hover": {
                    color: "blue",
                    "@width <= 200px": {
                        color: "green"
                    }
                }
            })

            expect(blocks.map(b => b.asCssString(".button"))).toEqual([
                dedent`
                    .button {
                        color: black;
                    }
                `,
                dedent`
                    .button:hover {
                        color: blue;
                    }
                `,
                dedent`
                    @media (width <= 200px) {
                        .button:hover {
                            color: green;
                        }
                    }
                `
            ])
        })

        it("skips unrecognized patterns", () => {
            const blocks = CssObjectSubBlock.fromProps({
                "span": {
                    color: "red"
                }
            } as StyleProps)

            expect(blocks.map(b => b.asCssString(".target"))).toEqual([
                dedent`
                    .target {
                    }
                `
            ])
        })
    })
})

//TODO: write tests for CssObjectBlock

//TODO: it doesn't seem right to use MochiCSS type inside tests of CssObject, consider refactor
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
