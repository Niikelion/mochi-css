/**
 * Core CSS-in-JS runtime for generating and applying styles.
 * Provides the main `css` function and `MochiCSS` class for style management.
 * @module css
 */

import clsx from "clsx"
import { CSSObject, AllVariants, DefaultVariants, MergeCSSVariants, MochiCSSProps, RefineVariants } from "@/cssObject"

/**
 * Runtime representation of a CSS style definition with variant support.
 * Holds generated class names and provides methods to compute the final
 * className string based on selected variants.
 *
 * @template V - The variant definitions type mapping variant names to their options
 *
 * @example
 * const styles = MochiCSS.from(new CSSObject({
 *   color: 'blue',
 *   variants: { size: { small: { fontSize: 12 }, large: { fontSize: 18 } } }
 * }))
 * styles.variant({ size: 'large' }) // Returns combined class names
 */
export class MochiCSS<V extends AllVariants = DefaultVariants> {
    /**
     * Creates a new MochiCSS instance.
     * @param classNames - Base class names to always include
     * @param variantClassNames - Mapping of variant names to option class names
     * @param defaultVariants - Default variant selections when not specified
     */
    constructor(
        public readonly classNames: string[],
        public readonly variantClassNames: { [K in keyof V]: { [P in keyof V[K]]: string } },
        public readonly defaultVariants: Partial<RefineVariants<V>>,
    ) {}

    /**
     * Computes the final className string based on variant selections.
     * Compound variants are handled purely via CSS combined selectors,
     * so no runtime matching is needed here.
     * @param props - Variant selections
     * @returns Combined className string for use in components
     */
    variant(props: Partial<RefineVariants<V>>): string {
        const keys = new Set<keyof V & string>(
            [...Object.keys(props), ...Object.keys(this.defaultVariants)].filter((k) => k in this.variantClassNames),
        )

        return clsx(
            this.classNames,
            ...keys.values().map((k) => {
                const variantGroup = this.variantClassNames[k]
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                if (!variantGroup) return false

                const variantKey = ((k in props ? props[k] : undefined) ?? this.defaultVariants[k])?.toString()
                if (variantKey == null) return false

                const selectedClassname = variantGroup[variantKey]
                if (selectedClassname !== undefined) return selectedClassname

                const defaultKey = this.defaultVariants[k]
                if (defaultKey == null) return false

                return variantGroup[defaultKey.toString()]
            }),
        )
    }

    /**
     * Creates a MochiCSS instance from a CSSObject.
     * Extracts class names from the compiled CSS blocks.
     * @template V - The variant definitions type
     * @param object - The compiled CSSObject to extract from
     * @returns A new MochiCSS instance with the extracted class names
     */
    static from<V extends AllVariants = DefaultVariants>(object: CSSObject<V>): MochiCSS<V> {
        return new MochiCSS<V>(
            [object.mainBlock.className],
            Object.fromEntries(
                Object.entries(object.variantBlocks).map(([key, variantOptions]) => {
                    return [
                        key,
                        Object.fromEntries(
                            Object.entries(variantOptions).map(([optionKey, block]) => {
                                return [optionKey, block.className]
                            }),
                        ),
                    ]
                }),
            ) as { [K in keyof V]: { [P in keyof V[K]]: string } },
            object.variantDefaults,
        )
    }
}

/**
 * Creates a CSS style definition.
 * The primary API for defining styles in Mochi-CSS.
 *
 * @template V - Tuple of variant definition types
 * @param props - One or more style objects or existing MochiCSS instances to merge
 * @returns A MochiCSS instance with all styles and variants combined
 *
 * @example
 * // Simple usage
 * const button = css({ padding: 8, borderRadius: 4 })
 *
 * @example
 * // With variants
 * const button = css({
 *   padding: 8,
 *   variants: {
 *     size: {
 *       small: { padding: 4 },
 *       large: { padding: 16 }
 *     }
 *   },
 *   defaultVariants: { size: 'small' }
 * })
 * button.variant({ size: 'large' }) // Get class names for large size
 *
 * @example
 * // Merging multiple styles
 * const combined = css(baseStyles, additionalStyles)
 */
const emptyMochiCSS = new MochiCSS<AllVariants>([], {}, {})

export function css<V extends AllVariants[]>(
    ...props: { [K in keyof V]: MochiCSSProps<V[K]> | MochiCSS }
): MochiCSS<MergeCSSVariants<V>> {
    const cssToMerge: MochiCSS<AllVariants>[] = []
    for (const p of props) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (p == null || typeof p !== "object") continue
        if (p instanceof MochiCSS) {
            cssToMerge.push(p)
        } else {
            cssToMerge.push(MochiCSS.from(new CSSObject<AllVariants>(p)))
        }
    }

    if (cssToMerge.length === 0) return emptyMochiCSS as MochiCSS<MergeCSSVariants<V>>

    return new MochiCSS<AllVariants>(
        cssToMerge.flatMap((css) => css.classNames),
        cssToMerge.reduce((a, b) => Object.assign(a, b.variantClassNames), {}),
        cssToMerge.reduce((a, b) => Object.assign(a, b.defaultVariants), {}),
    ) as MochiCSS<MergeCSSVariants<V>>
}
