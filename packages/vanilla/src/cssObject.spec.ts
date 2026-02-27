import { describe, it, expect, vi } from "vitest"
import { parse, walk, generate, type CssNode, type WalkContext } from "css-tree"
import { createToken } from "@/token"
import { CSSObject, CssObjectBlock, CssObjectSubBlock, CompoundVariant } from "@/cssObject"
import { MochiSelector } from "@/selector"
import dedent from "dedent"
import { StyleProps } from "@/props"

interface ParsedRule {
    selector: string
    declarations: Record<string, string>
    media: string | undefined
}

function parseRules(cssSource: string): ParsedRule[] {
    const ast = parse(cssSource)
    const result: ParsedRule[] = []

    walk(ast, function (this: WalkContext, node: CssNode) {
        if (node.type !== "Rule") return

        const selector = generate(node.prelude)
        const declarations: Record<string, string> = {}

        walk(node.block, (decl: CssNode) => {
            if (decl.type === "Declaration") {
                declarations[decl.property] = generate(decl.value).trim()
            }
        })

        const atrule = this.atrule
        const media =
            atrule !== null && atrule.name === "media" && atrule.prelude !== null
                ? `@media ${generate(atrule.prelude)}`
                : undefined

        result.push({ selector, declarations, media })
    })

    return result
}

function collectDeclarations(cssSource: string, containsClass: string): Record<string, string> {
    const result: Record<string, string> = {}
    for (const rule of parseRules(cssSource)) {
        if (rule.selector.includes(containsClass)) {
            Object.assign(result, rule.declarations)
        }
    }
    return result
}

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
                    new MochiSelector(["& > button"], ["@media (width > 100px)"]),
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
                    new MochiSelector(["&"], ["@media (width <= 480px)"]),
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
                "@media (max-width: 500px)": undefined,
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
                    "@media (width <= 200px)": {
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
                "@media (width <= 480px)": {
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

        const declarations = collectDeclarations(obj.asCssString(), `.${obj.mainBlock.className}`)

        expect(declarations).toMatchObject({
            width: "200px",
            display: "flex",
            "flex-direction": "column",
            "align-items": "center",
            "justify-content": "end",
            background: bg.value,
            [bg.variable]: "red",
        })
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

        expect(collectDeclarations(cssSource, `.${obj.variantBlocks.width.default.className}`)).toMatchObject({
            width: "auto",
        })
        expect(collectDeclarations(cssSource, `.${obj.variantBlocks.width.wide.className}`)).toMatchObject({
            width: "100%",
        })
        expect(collectDeclarations(cssSource, `.${obj.variantBlocks.width.narrow.className}`)).toMatchObject({
            width: "200px",
        })
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

        const rules = parseRules(obj.asCssString())
        const cls = obj.mainBlock.className

        const baseRule = rules.find(
            (r) => r.selector.includes(cls) && !r.selector.includes(":hover") && !r.selector.includes("span"),
        )
        expect(baseRule?.declarations).toMatchObject({ color: "blue" })

        const hoverRule = rules.find((r) => r.selector.includes(":hover"))
        expect(hoverRule?.declarations).toMatchObject({ color: "red" })

        const spanRule = rules.find((r) => r.selector.includes("span"))
        expect(spanRule?.declarations).toMatchObject({ "font-weight": "bold" })
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

        const rules = parseRules(obj.asCssString())
        const primaryCls = obj.variantBlocks.intent.primary.className
        const dangerCls = obj.variantBlocks.intent.danger.className

        expect(
            rules.find((r) => r.selector.includes(primaryCls) && !r.selector.includes(":hover"))?.declarations,
        ).toMatchObject({ color: "blue" })
        expect(
            rules.find((r) => r.selector.includes(primaryCls) && r.selector.includes(":hover"))?.declarations,
        ).toMatchObject({ color: "darkblue" })
        expect(
            rules.find((r) => r.selector.includes(dangerCls) && !r.selector.includes(":hover"))?.declarations,
        ).toMatchObject({ color: "red" })
        expect(
            rules.find((r) => r.selector.includes(dangerCls) && r.selector.includes(":hover"))?.declarations,
        ).toMatchObject({ color: "darkred" })
    })

    it("should generate css code for base styles with media selectors", () => {
        const obj = new CSSObject({
            width: "100%",
            "@media (width <= 480px)": {
                width: "auto",
            },
            "@media (width >= 1024px)": {
                width: 800,
            },
        })

        const rules = parseRules(obj.asCssString())
        const cls = obj.mainBlock.className

        expect(rules.find((r) => r.selector.includes(cls) && !r.media)?.declarations).toMatchObject({ width: "100%" })
        expect(rules.find((r) => r.selector.includes(cls) && r.media?.includes("480"))?.declarations).toMatchObject({
            width: "auto",
        })
        expect(rules.find((r) => r.selector.includes(cls) && r.media?.includes("1024"))?.declarations).toMatchObject({
            width: "800px",
        })
    })

    it("should generate css code for variant styles with media selectors", () => {
        const obj = new CSSObject({
            variants: {
                layout: {
                    stack: {
                        flexDirection: "column",
                        "@media (width >= 768px)": {
                            flexDirection: "row",
                        },
                    },
                    grid: {
                        display: "grid",
                        gridTemplateColumns: "1fr",
                        "@media (width >= 768px)": {
                            gridTemplateColumns: "1fr 1fr",
                        },
                    },
                },
            },
        })

        const rules = parseRules(obj.asCssString())
        const stackCls = obj.variantBlocks.layout.stack.className
        const gridCls = obj.variantBlocks.layout.grid.className

        expect(rules.find((r) => r.selector.includes(stackCls) && !r.media)?.declarations).toMatchObject({
            "flex-direction": "column",
        })
        expect(
            rules.find((r) => r.selector.includes(stackCls) && r.media?.includes("768"))?.declarations,
        ).toMatchObject({ "flex-direction": "row" })
        expect(rules.find((r) => r.selector.includes(gridCls) && !r.media)?.declarations).toMatchObject({
            display: "grid",
            "grid-template-columns": "1fr",
        })
        expect(rules.find((r) => r.selector.includes(gridCls) && r.media?.includes("768"))?.declarations).toMatchObject(
            { "grid-template-columns": "1fr 1fr" },
        )
    })

    it("should generate css code for compound variants using combined selectors", () => {
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

        const rules = parseRules(obj.asCssString())

        expect(obj.compoundVariants).toHaveLength(1)
        // compound variant should use combined variant selectors instead of its own class
        const compoundSelector = `${obj.mainBlock.selector}${obj.variantBlocks.color.red.selector}${obj.variantBlocks.size.large.selector}`
        expect(rules.find((r) => r.selector === compoundSelector)?.declarations).toMatchObject({
            "font-weight": "bold",
        })
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

        expect(obj.compoundVariants[0]?.conditions).toEqual({ color: "red", size: "large" })
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

        const rules = parseRules(obj.asCssString())
        const main = obj.mainBlock.selector

        expect(obj.compoundVariants).toHaveLength(2)
        const compound1 = `${main}${obj.variantBlocks.color.red.selector}${obj.variantBlocks.size.large.selector}`
        const compound2 = `${main}${obj.variantBlocks.color.blue.selector}${obj.variantBlocks.size.small.selector}`
        expect(rules.find((r) => r.selector === compound1)?.declarations).toMatchObject({ "font-weight": "bold" })
        expect(rules.find((r) => r.selector === compound2)?.declarations).toMatchObject({
            "text-decoration": "underline",
        })
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

        const rules = parseRules(obj.asCssString())
        const compoundSelector = `${obj.mainBlock.selector}${obj.variantBlocks.color.red.selector}${obj.variantBlocks.size.large.selector}`

        expect(rules.find((r) => r.selector === compoundSelector)?.declarations).toMatchObject({
            "font-weight": "bold",
        })
        expect(
            rules.find((r) => r.selector.startsWith(compoundSelector) && r.selector.includes(":hover"))?.declarations,
        ).toMatchObject({ "font-weight": "900" })
    })

    it("should have empty compoundVariants when none specified", () => {
        const obj = new CSSObject({
            variants: {
                color: {
                    red: { color: "red" },
                },
            },
        })

        expect(obj.compoundVariants).toEqual([])
    })

    it("should generate compound variant with partial conditions using single variant selector", () => {
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
            compoundVariants: [{ color: "red", css: { fontWeight: "bold" } }],
        })

        const rules = parseRules(obj.asCssString())
        const compoundSelector = `${obj.mainBlock.selector}${obj.variantBlocks.color.red.selector}`
        expect(rules.filter((r) => r.selector === compoundSelector).map((r) => r.declarations)).toEqual([
            { color: "red" },
            {
                "font-weight": "bold",
            },
        ])
    })

    it("should discard compound variant rule when any condition references an unknown variant", () => {
        const obj = new CSSObject({
            variants: {
                color: {
                    red: { color: "red" },
                },
            },
            compoundVariants: [
                { color: "red", size: "large", css: { fontWeight: "bold" } } as CompoundVariant<{
                    color: { red: StyleProps }
                }>,
            ],
        })

        // compound rule is discarded; only the regular color.red variant rule exists
        const rules = parseRules(obj.asCssString())
        const compoundSelector = `${obj.mainBlock.selector}${obj.variantBlocks.color.red.selector}`
        expect(rules.filter((r) => r.selector === compoundSelector).map((r) => r.declarations)).toEqual([
            { color: "red" },
        ])
    })

    it("should silently ignore undefined variants", () => {
        const obj = new CSSObject({
            variants: {
                color: {
                    red: null as unknown as StyleProps,
                },
            },
        })

        const rules = parseRules(obj.asCssString())

        expect(rules.some((r) => r.selector.includes(obj.variantBlocks.color.red.className))).toBe(true)
    })
})
