import {StyleProps} from "@/props";
import clsx from "clsx";
import {CSSObject, DefaultVariants, MergeCSSVariants, MochiCSSProps, RefineVariants} from "@/cssObject";

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

    static from<V extends Record<string, Record<string, StyleProps>> = {}>(object: CSSObject<V>): MochiCSS<V> {
        return new MochiCSS<V>(
            [object.mainBlock.className],
            Object.fromEntries(Object.entries(object.variantBlocks).map(([key, variantOptions]) => {
                return [key, Object.fromEntries(Object.entries(variantOptions).map(([optionKey, block]) => {
                    return [optionKey, block.className]
                }))]
            })) as { [K in keyof V]: { [P in keyof V[K]]: string } },
            object.variantDefaults ?? {}
        )
    }
}

export function css<V extends DefaultVariants[]>(...props: { [K in keyof V]: MochiCSSProps<V[K]> | MochiCSS }): MochiCSS<MergeCSSVariants<V>>
{
    const cssToMerge: MochiCSS<DefaultVariants>[] = props.map(p => {
        if (p instanceof MochiCSS) return p
        return MochiCSS.from(new CSSObject<DefaultVariants>(p))
    })

    return new MochiCSS<DefaultVariants>(
        cssToMerge.flatMap(css => css.classNames),
        cssToMerge.reduce((a, b) => Object.assign(a, b.variantClassNames), {}),
        cssToMerge.reduce((a, b) => Object.assign(a, b.defaultVariants), {})
    ) as MochiCSS<MergeCSSVariants<V>>
}
