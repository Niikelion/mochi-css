import {cssFromProps, hashCss, StyleProps} from "@/props";
import clsx from "clsx";

function compareString<T extends string>(a: T, b: T) {
    return a < b ? -1 : a === b ? 0 : 1
}
function compareStringKey<T extends [string, any]>(a: T, b: T) {
    return compareString(a[0], b[0])
}

export class MochiCSS<V extends Record<string, Record<string, StyleProps>> = {}> {
    constructor(
        public readonly classNames: string[],
        public readonly variantClassNames: { [K in keyof V]: { [P in keyof V[K]]: string } },
        public readonly defaultVariants: Partial<RefineVariants<V>>
    ) {}

    toString() {
        return this.classNames.map(c => `.${c}`).join('')
    }

    variant(props: RefineVariants<V>): string {
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

export class CssObjectBlock {
    public readonly className: string
    public readonly cssProps: Record<string, string>

    constructor(
        styles: StyleProps
    ) {
        this.cssProps = cssFromProps(styles)
        this.className = hashCss(this.cssProps)
    }

    get selector(): string {
        return `.${this.className}`
    }

    asCssString(selectors: string[]): string {
        const props = Object.entries(this.cssProps)
            .toSorted(compareStringKey)
            .map(([k, v]) => `    ${k}: ${v};\n`)
            .join('')
        return selectors.map(s => `${s}${this.selector} {\n${props}}`).join('\n\n')
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
                this.variantBlocks[variantGroupName][variantItemName] = new CssObjectBlock(variantGroup[variantItemName] ?? {})
            }
        }
        this.variantDefaults = defaultVariants!
    }

    public asCssString(): string {
        return [
            this.mainBlock.asCssString([]),
            ...Object.entries(this.variantBlocks)
                .toSorted(compareStringKey)
                .flatMap(([_, b]) => Object.entries(b).toSorted(compareStringKey))
                .map(([_, b]) => b.asCssString([this.mainBlock.selector]))
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
