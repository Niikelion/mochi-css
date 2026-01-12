import {
    asKnownProp,
    asVar,
    camelToKebab,
    isCssVariableName,
    isKnownPropertyName, isMediaSelector, isNestedSelector,
    StyleProps
} from "@/props";
import clsx from "clsx";
import {compareStringKey, compareStringProp} from "@/compare";
import {shortHash} from "@/hash";

export class MochiSelector {
    constructor(
        private readonly cssSelectors: string[] = [],
        private readonly mediaSelectors: string[] = []
    ) {}

    get mediaQuery(): string | undefined {
        if (this.mediaSelectors.length === 0) return undefined
        return `@media ${this.mediaSelectors.join(", ")}`
    }
    get cssSelector(): string {
        if (this.cssSelectors.length === 0) return "*"
        return this.cssSelectors.join(", ")
    }

    substitute(root: string): MochiSelector {
        return new MochiSelector(
            this.cssSelectors.map(selector => selector.replace(/&/g, root)),
            this.mediaSelectors
        )
    }
    extend(child: string): MochiSelector {
        // TODO: parse and validate css
        const children = MochiSelector.split(child)
        const selectors = this.cssSelectors.flatMap(parentSelector => children.map(childSelector => {
            return childSelector.replace(/&/g, parentSelector)
        }))
        return new MochiSelector(selectors, this.mediaSelectors)
    }
    wrap(mediaQuery: string): MochiSelector {
        // TODO: validate query
        if (!mediaQuery.startsWith("@")) return this
        const mediaQueryPart = mediaQuery.substring(1)
        return new MochiSelector(this.cssSelectors, [...this.mediaSelectors, mediaQueryPart])
    }

    private static split(selector: string): string[] {
        return [selector]
    }
}

export class MochiCSS<V extends Record<string, Record<string, StyleProps>> = {}> {
    constructor(
        public readonly classNames: string[],
        public readonly variantClassNames: { [K in keyof V]: { [P in keyof V[K]]: string } },
        public readonly defaultVariants: Partial<RefineVariants<V>>
    ) {}

    variant(props: Partial<RefineVariants<V>>): string {
        const keys = new Set<keyof V & string>([
            ...Object.keys(props),
            ...Object.keys(this.defaultVariants)
        ].filter(k => k in this.variantClassNames))
        return clsx(this.classNames, ...keys.values().map(k => {
            const variantKey = (k in props ? props[k] : undefined) ?? this.defaultVariants[k]!
            return this.variantClassNames[k][`${variantKey}`]
        }))
    }
}

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
        const props = Object.entries(this.cssProps)
            .toSorted(compareStringKey)
            .map(([k, v]) => `    ${k}: ${v};\n`)
            .join('')

        const selector = this.selector.substitute(root)

        const blockCss = `${selector.cssSelector} {\n${props}}`
        const mediaQuery = selector.mediaQuery

        return mediaQuery === undefined ? blockCss : `@media ${mediaQuery} {\n${blockCss}\n}`
    }

    // this is expected to yield list in a consistent, deterministic manner
    static fromProps(props: StyleProps, selector?: MochiSelector): [CssObjectSubBlock, ...CssObjectSubBlock[]] {
        selector ??= new MochiSelector(["&"])

        const cssProps: Record<string, string> = {}
        const additionalSubBlocks: CssObjectSubBlock[] = []

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
                additionalSubBlocks.push(...CssObjectSubBlock.fromProps(value as StyleProps, selector.extend(key)))
                continue
            }

            // transform media selector
            if (isMediaSelector(key)) {
                additionalSubBlocks.push(...CssObjectSubBlock.fromProps(value as StyleProps, selector.wrap(key)))
            }
        }

        return [
            new CssObjectSubBlock(cssProps, selector),
            ...additionalSubBlocks
        ].toSorted(compareStringProp("hash")) as [CssObjectSubBlock, ...CssObjectSubBlock[]]
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

export class CSSObject<V extends Record<string, Record<string, StyleProps>> = {}> {
    public readonly mainBlock: CssObjectBlock
    public readonly variantBlocks: { [K in keyof V & string]: { [I in keyof V[K] & string]: CssObjectBlock } }
    public readonly variantDefaults: Partial<RefineVariants<V>>

    public constructor(
        { variants, defaultVariants, ...props }: MochiCSSProps<V>
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

    public asMochiCss(): MochiCSS<V> {
        return new MochiCSS<V>(
            [this.mainBlock.className],
            Object.fromEntries(Object.entries(this.variantBlocks).map(([key, variantOptions]) => {
                return [key, Object.fromEntries(Object.entries(variantOptions).map(([optionKey, block]) => {
                    return [optionKey, block.className]
                }))]
            })) as { [K in keyof V]: { [P in keyof V[K]]: string } },
            this.variantDefaults ?? {}
        )
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

export function css<V extends DefaultVariants[]>(...props: { [K in keyof V]: MochiCSSProps<V[K]> | MochiCSS }): MochiCSS<MergeCSSVariants<V>>
{
    const cssToMerge: MochiCSS<DefaultVariants>[] = props.map(p => {
        if (p instanceof MochiCSS) return p
        return new CSSObject<DefaultVariants>(p).asMochiCss()
    })

    return new MochiCSS<DefaultVariants>(
        cssToMerge.flatMap(css => css.classNames),
        cssToMerge.reduce((a, b) => Object.assign(a, b.variantClassNames), {}),
        cssToMerge.reduce((a, b) => Object.assign(a, b.defaultVariants), {})
    ) as MochiCSS<MergeCSSVariants<V>>
}
