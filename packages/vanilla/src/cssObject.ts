import {
    asKnownProp,
    asVar,
    camelToKebab,
    isCssVariableName,
    isKnownPropertyName,
    isMediaSelector,
    isNestedSelector,
    StyleProps
} from "@/props";
import {shortHash} from "@/hash";
import {MochiSelector} from "@/selector";
import {compareStringKey, stringPropComparator} from "@/compare";

export class CssObjectSubBlock {
    constructor(
        public readonly cssProps: Record<string, string>,
        public readonly selector: MochiSelector
    ) {}

    get hash(): string {
        const str = this.asCssString("&")
        return shortHash(str)
    }

    asCssString(root: string): string {
        const selector = this.selector.substitute(root)
        const mediaQuery = selector.mediaQuery

        const mediaIndent = mediaQuery === undefined ? "" : "    "

        const props = Object.entries(this.cssProps)
            .toSorted(compareStringKey)
            .map(([k, v]) => `${mediaIndent}    ${k}: ${v};\n`)
            .join('')

        const blockCss = `${mediaIndent}${selector.cssSelector} {\n${props}${mediaIndent}}`

        return mediaQuery === undefined ? blockCss : `${mediaQuery} {\n${blockCss}\n}`
    }

    // this is expected to yield list in a consistent, deterministic manner
    static fromProps(props: StyleProps, selector?: MochiSelector): [CssObjectSubBlock, ...CssObjectSubBlock[]] {
        selector ??= new MochiSelector(["&"])

        const cssProps: Record<string, string> = {}
        const propsToProcess: { key: string, selector: MochiSelector, props: StyleProps }[] = []

        for (const [key, value] of Object.entries(props)) {
            // skip undefined value
            if (value === undefined) continue

            // transform variable
            if (isCssVariableName(key)) {
                cssProps[key] = asVar(value as StyleProps[typeof key] & {})
                continue
            }

            // transform known CSS prop
            if (isKnownPropertyName(key)) {
                cssProps[camelToKebab(key)] = asKnownProp(value, key)
                continue
            }

            // transform nested and media selectors
            if (isNestedSelector(key)) {
                propsToProcess.push({
                    key,
                    props: value as StyleProps,
                    selector: selector.extend(key)
                })
                continue
            }

            // transform media selector
            if (isMediaSelector(key)) {
                propsToProcess.push({
                    key,
                    props: value as StyleProps,
                    selector: selector.wrap(key)
                })
            }
        }

        return [
            new CssObjectSubBlock(cssProps, selector),
            ...propsToProcess
                .toSorted(stringPropComparator("key"))
                .flatMap(({ props, selector }) =>
                    CssObjectSubBlock.fromProps(props, selector)
                )
        ] as const
    }
}

export class CssObjectBlock {
    public readonly className: string
    public readonly subBlocks: CssObjectSubBlock[] = []

    constructor(
        styles: StyleProps
    ) {
        const blocks = CssObjectSubBlock.fromProps(styles)

        this.className = "c" + shortHash(blocks.map(b => b.hash).join('+'))
        this.subBlocks = blocks
    }

    get selector(): string {
        return `.${this.className}`
    }

    asCssString(root: string): string {
        return this.subBlocks.map(b => b.asCssString(new MochiSelector([root]).extend(`&.${this.className}`).cssSelector)).join('\n\n')
    }
}

export type DefaultVariants = Record<string, Record<string, StyleProps>>
type RefineVariantType<T extends string> = T extends "true" ? true : T extends "false" ? false : T extends string ? T : string
export type VariantProps<V extends DefaultVariants> = {
    variants?: V
    defaultVariants?: { [K in keyof V]: (keyof V[K]) extends any ? RefineVariantType<keyof V[K] & string> : never }
}
export type MochiCSSProps<V extends DefaultVariants> = StyleProps & VariantProps<V>
type Override<A extends object, B extends object> = B & Omit<A, keyof B>
export type MergeCSSVariants<V extends DefaultVariants[]> = V extends [infer V1 extends DefaultVariants, ...infer VRest extends DefaultVariants[]] ? Override<V1, MergeCSSVariants<VRest>> : {}
type RefineVariantTypes<V extends Record<string, string>> = { [K in keyof V]: RefineVariantType<V[K]> }
export type RefineVariants<T extends DefaultVariants> = RefineVariantTypes<{ [K in keyof T]: keyof T[K] & string }>

export class CSSObject<V extends Record<string, Record<string, StyleProps>> = {}> {
    public readonly mainBlock: CssObjectBlock
    public readonly variantBlocks: { [K in keyof V & string]: { [I in keyof V[K] & string]: CssObjectBlock } }
    public readonly variantDefaults: Partial<RefineVariants<V>>

    public constructor(
        {variants, defaultVariants, ...props}: MochiCSSProps<V>
    ) {
        this.mainBlock = new CssObjectBlock(props)
        this.variantBlocks = {} as typeof this.variantBlocks
        this.variantDefaults = {} as typeof this.variantDefaults

        if (!variants) return
        for (const variantGroupName in variants) {
            this.variantBlocks[variantGroupName] = {} as typeof this.variantBlocks[keyof typeof this.variantBlocks]
            const variantGroup = variants[variantGroupName]
            for (const variantItemName in variantGroup) {
                this.variantBlocks[variantGroupName][variantItemName] = new CssObjectBlock(variantGroup[variantItemName]!)
            }
        }
        this.variantDefaults = defaultVariants!
    }

    public asCssString(): string {
        return [
            this.mainBlock.asCssString(this.mainBlock.selector),
            ...Object.entries(this.variantBlocks)
                .toSorted(compareStringKey)
                .flatMap(([_, b]) => Object.entries(b).toSorted(compareStringKey))
                .map(([_, b]) => b.asCssString(this.mainBlock.selector))
        ].join('\n\n')
    }
}
