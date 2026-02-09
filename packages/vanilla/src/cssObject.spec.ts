import { describe, it, expect, vi } from "vitest"
import { createToken } from "@/token"
import { CSSObject, CssObjectBlock, CssObjectSubBlock } from "@/cssObject"
import { MochiSelector } from "@/selector"
import dedent from "dedent"
import { StyleProps } from "@/props"

describe("CssObjectSubBlock", () => {
    describe("hash", () => {
        it("should return same hash for same properties and selector", () => {
            const blocks = [
                new CssObjectSubBlock(
                    {
                        color: "red",
                    },
                    new MochiSelector(),
                ),
                new CssObjectSubBlock(
                    {
                        color: "green",
                    },
                    new MochiSelector(),
                ),
                new CssObjectSubBlock(
                    {
                        backgroundColor: "red",
                    },
                    new MochiSelector(),
                ),
                new CssObjectSubBlock(
                    {
                        color: "red",
                    },
                    new MochiSelector(["& > button"]),
                ),
                new CssObjectSubBlock(
                    {
                        color: "red",
                    },
                    new MochiSelector(["& > button"], ["width > 100px"]),
                ),
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
            const subBlock1 = new CssObjectSubBlock(
                {
                    color: "red",
                    backgroundColor: "blue",
                },
                new MochiSelector(),
            )

            const subBlock2 = new CssObjectSubBlock(
                {
                    backgroundColor: "blue",
                    color: "red",
                },
                new MochiSelector(),
            )

            expect(subBlock1.hash).toEqual(subBlock2.hash)
        })
    })

    describe("asCssString", () => {
        it("returns formatted css string including css selector with provided root and media queries with css properties sorted by name", () => {
            expect(
                new CssObjectSubBlock(
                    {
                        color: "white",
                        backgroundColor: "gray",
                    },
                    new MochiSelector(["&:hover"]),
                ).asCssString(".button"),
            ).toEqual(dedent`
                .button:hover {
                    backgroundColor: gray;
                    color: white;
                }
            `)

            expect(
                new CssObjectSubBlock(
                    {
                        width: "100%",
                    },
                    new MochiSelector(["&"], ["width <= 480px"]),
                ).asCssString(".test"),
            ).toEqual(dedent`
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
                color: undefined,
            })

            expect(blocks.map((b) => b.asCssString(".target"))).toEqual([
                dedent`
                    .target {
                    }
                `,
            ])
        })

        it("should properly construct single CssObjectSubBlock from props", () => {
            const blocks = CssObjectSubBlock.fromProps({
                color: "black",
            })

            expect(blocks.map((b) => b.asCssString(".test"))).toEqual([
                dedent`
                .test {
                    color: black;
                }
            `,
            ])
        })

        it("should flatten the nested structure into the list of CssObjectSubBlock", () => {
            const blocks = CssObjectSubBlock.fromProps({
                color: "black",
                "&:hover": {
                    color: "blue",
                    "@width <= 200px": {
                        color: "green",
                    },
                },
            })

            expect(blocks.map((b) => b.asCssString(".button"))).toEqual([
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
                `,
            ])
        })

        it("skips unrecognized patterns and warns in dev mode", () => {
            const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined)

            const blocks = CssObjectSubBlock.fromProps({
                span: {
                    color: "red",
                },
            } as StyleProps)

            expect(blocks.map((b) => b.asCssString(".target"))).toEqual([
                dedent`
                    .target {
                    }
                `,
            ])

            expect(warnSpy).toHaveBeenCalledWith('[mochi-css] Unknown style property "span" will be ignored')
            warnSpy.mockRestore()
        })

        it("skips unrecognized patterns without warning in production", () => {
            const origEnv = process.env["NODE_ENV"]
            process.env["NODE_ENV"] = "production"
            const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined)

            CssObjectSubBlock.fromProps({ span: { color: "red" } } as StyleProps)

            expect(warnSpy).not.toHaveBeenCalled()
            warnSpy.mockRestore()
            process.env["NODE_ENV"] = origEnv
        })
    })
})

describe("CssObjectBlock", () => {
    describe("className", () => {
        it("should generate same className for same styles", () => {
            const block1 = new CssObjectBlock({ color: "red" })
            const block2 = new CssObjectBlock({ color: "red" })

            expect(block1.className).toEqual(block2.className)
        })

        it("should generate different className for different styles", () => {
            const block1 = new CssObjectBlock({ color: "red" })
            const block2 = new CssObjectBlock({ color: "blue" })

            expect(block1.className).not.toEqual(block2.className)
        })

        it("should generate same className regardless of property order", () => {
            const block1 = new CssObjectBlock({ color: "red", backgroundColor: "blue" })
            const block2 = new CssObjectBlock({ backgroundColor: "blue", color: "red" })

            expect(block1.className).toEqual(block2.className)
        })
    })

    describe("selector", () => {
        it("should return class selector for the block", () => {
            const block = new CssObjectBlock({ color: "red" })

            expect(block.selector).toEqual(`.${block.className}`)
        })
    })

    describe("asCssString", () => {
        it("should generate CSS with root selector combined with className", () => {
            const block = new CssObjectBlock({ color: "red" })
            const css = block.asCssString(".root")

            expect(css).toContain(`.root.${block.className}`)
            expect(css).toContain("color: red;")
        })

        it("should handle nested selectors", () => {
            const block = new CssObjectBlock({
                color: "red",
                "&:hover": {
                    color: "blue",
                },
            })
            const css = block.asCssString(".btn")

            expect(css).toContain(`.btn.${block.className}`)
            expect(css).toContain(`:hover`)
            expect(css).toContain("color: red;")
            expect(css).toContain("color: blue;")
        })

        it("should handle media queries", () => {
            const block = new CssObjectBlock({
                width: "100%",
                "@width <= 480px": {
                    width: "auto",
                },
            })
            const css = block.asCssString(".container")

            expect(css).toContain("@media (width <= 480px)")
            expect(css).toContain("width: 100%;")
            expect(css).toContain("width: auto;")
        })
    })

    describe("subBlocks", () => {
        it("should contain parsed sub-blocks from styles", () => {
            const block = new CssObjectBlock({
                color: "red",
                "&:hover": { color: "blue" },
            })

            expect(block.subBlocks).toHaveLength(2)
        })

        it("should always contain main block even for empty styles", () => {
            const block = new CssObjectBlock({})

            expect(block.subBlocks).toHaveLength(1)
        })
    })
})

describe("CssObject", () => {
    it("should generate css code that accurately reflects provided styles for base styles", () => {
        const bg = createToken("background-color")

        const obj = new CSSObject({
            width: 200,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "end",
            background: bg,
            [bg.variable]: "red",
        })

        const cssSource = obj.asCssString()

        // main className appears in the source
        expect(cssSource).toContain(`.${obj.mainBlock.className}`)

        // all expected parts appear in the source
        const expectedParts: string[] = [
            "width: 200px;",
            "display: flex;",
            "flex-direction: column;",
            "align-items: center;",
            "justify-content: end;",
            `background: ${bg.value};`,
            `${bg.variable}: red;`,
        ]

        for (const part of expectedParts) expect(cssSource).toContain(part)
    })

    it("should generate css code that accurately reflects provided styles for variant styles", () => {
        const obj = new CSSObject({
            variants: {
                width: {
                    default: { width: "auto" },
                    wide: { width: "100%" },
                    narrow: { width: 200 },
                },
            },
            defaultVariants: {
                width: "default",
            },
        })

        const cssSource = obj.asCssString()

        // variant classNames appear in the source
        expect(cssSource).toContain(`.${obj.variantBlocks.width.default.className}`)
        expect(cssSource).toContain(`.${obj.variantBlocks.width.wide.className}`)
        expect(cssSource).toContain(`.${obj.variantBlocks.width.narrow.className}`)

        const expectedParts: string[] = ["width: auto;", "width: 100%;", "width: 200px;"]

        for (const expectedPart of expectedParts) expect(cssSource).toContain(expectedPart)
    })

    it("should generate css code for base styles with nested selectors", () => {
        const obj = new CSSObject({
            color: "blue",
            "&:hover": {
                color: "red",
            },
            "& > span": {
                fontWeight: "bold",
            },
        })

        const cssSource = obj.asCssString()

        expect(cssSource).toContain("color: blue;")
        expect(cssSource).toContain(":hover")
        expect(cssSource).toContain("color: red;")
        expect(cssSource).toContain("> span")
        expect(cssSource).toContain("font-weight: bold;")
    })

    it("should generate css code for variant styles with nested selectors", () => {
        const obj = new CSSObject({
            variants: {
                intent: {
                    primary: {
                        color: "blue",
                        "&:hover": {
                            color: "darkblue",
                        },
                    },
                    danger: {
                        color: "red",
                        "&:hover": {
                            color: "darkred",
                        },
                    },
                },
            },
        })

        const cssSource = obj.asCssString()

        expect(cssSource).toContain(`.${obj.variantBlocks.intent.primary.className}`)
        expect(cssSource).toContain(`.${obj.variantBlocks.intent.danger.className}`)
        expect(cssSource).toContain("color: blue;")
        expect(cssSource).toContain("color: darkblue;")
        expect(cssSource).toContain("color: red;")
        expect(cssSource).toContain("color: darkred;")
        expect(cssSource).toContain(":hover")
    })

    it("should generate css code for base styles with media selectors", () => {
        const obj = new CSSObject({
            width: "100%",
            "@width <= 480px": {
                width: "auto",
            },
            "@width >= 1024px": {
                width: 800,
            },
        })

        const cssSource = obj.asCssString()

        expect(cssSource).toContain("width: 100%;")
        expect(cssSource).toContain("@media (width <= 480px)")
        expect(cssSource).toContain("width: auto;")
        expect(cssSource).toContain("@media (width >= 1024px)")
        expect(cssSource).toContain("width: 800px;")
    })

    it("should generate css code for variant styles with media selectors", () => {
        const obj = new CSSObject({
            variants: {
                layout: {
                    stack: {
                        flexDirection: "column",
                        "@width >= 768px": {
                            flexDirection: "row",
                        },
                    },
                    grid: {
                        display: "grid",
                        gridTemplateColumns: "1fr",
                        "@width >= 768px": {
                            gridTemplateColumns: "1fr 1fr",
                        },
                    },
                },
            },
        })

        const cssSource = obj.asCssString()

        expect(cssSource).toContain(obj.variantBlocks.layout.stack.selector)
        expect(cssSource).toContain(obj.variantBlocks.layout.grid.selector)
        expect(cssSource).toContain("flex-direction: column;")
        expect(cssSource).toContain("flex-direction: row;")
        expect(cssSource).toContain("grid-template-columns: 1fr;")
        expect(cssSource).toContain("grid-template-columns: 1fr 1fr;")
        expect(cssSource).toContain("@media (width >= 768px)")
    })

    it("should generate css code for compound variants", () => {
        const obj = new CSSObject({
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

        const cssSource = obj.asCssString()

        expect(obj.compoundVariantBlocks).toHaveLength(1)
        expect(cssSource).toContain(obj.compoundVariantBlocks[0]?.block.selector)
        expect(cssSource).toContain("font-weight: bold;")
    })

    it("should store compound variant conditions correctly", () => {
        const obj = new CSSObject({
            variants: {
                color: {
                    red: { color: "red" },
                },
                size: {
                    large: { fontSize: 18 },
                },
            },
            compoundVariants: [{ color: "red", size: "large", css: { fontWeight: "bold" } }],
        })

        expect(obj.compoundVariantBlocks[0]?.conditions).toEqual({ color: "red", size: "large" })
    })

    it("should handle multiple compound variants", () => {
        const obj = new CSSObject({
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

        const cssSource = obj.asCssString()

        expect(obj.compoundVariantBlocks).toHaveLength(2)
        expect(cssSource).toContain("font-weight: bold;")
        expect(cssSource).toContain("text-decoration: underline;")
    })

    it("should handle compound variants with nested selectors", () => {
        const obj = new CSSObject({
            variants: {
                color: {
                    red: { color: "red" },
                },
                size: {
                    large: { fontSize: 18 },
                },
            },
            compoundVariants: [
                {
                    color: "red",
                    size: "large",
                    css: {
                        fontWeight: "bold",
                        "&:hover": { fontWeight: 900 },
                    },
                },
            ],
        })

        const cssSource = obj.asCssString()

        expect(cssSource).toContain("font-weight: bold;")
        expect(cssSource).toContain(":hover")
        expect(cssSource).toContain("font-weight: 900;")
    })

    it("should have empty compoundVariantBlocks when none specified", () => {
        const obj = new CSSObject({
            variants: {
                color: {
                    red: { color: "red" },
                },
            },
        })

        expect(obj.compoundVariantBlocks).toEqual([])
    })

    it("should silently ignore undefined variants", () => {
        const obj = new CSSObject({
            variants: {
                color: {
                    red: null as unknown as object,
                },
            },
        })

        const cssSource = obj.asCssString()

        expect(cssSource).toContain(obj.variantBlocks.color.red.selector)
    })
})
