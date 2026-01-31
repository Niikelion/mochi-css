/**
 * CSS object model for representing and serializing styles.
 * Converts JavaScript style objects into CSS blocks with proper
 * selector handling, nesting support, and deterministic output.
 * @module cssObject
 */

import {
    asKnownProp,
    asVar,
    camelToKebab,
    isCssVariableName,
    isKnownPropertyName,
    isMediaSelector,
    isNestedSelector,
    StyleProps,
} from "@/props"
import { shortHash } from "@/hash"
import { MochiSelector } from "@/selector"
import { compareStringKey, stringPropComparator } from "@/compare"

/**
 * Represents a single CSS rule block with properties and a selector.
 * Handles conversion to CSS string format and hash generation.
 */
export class CssObjectSubBlock {
    /**
     * Creates a new CSS sub-block.
     * @param cssProps - Map of CSS property names (kebab-case) to values
     * @param selector - The selector this block applies to
     */
    constructor(
        public readonly cssProps: Record<string, string>,
        public readonly selector: MochiSelector,
    ) {}

    /**
     * Computes a deterministic hash of this block's CSS content.
     * Used for generating unique class names.
     */
    get hash(): string {
        const str = this.asCssString("&")
        return shortHash(str)
    }

    /**
     * Converts this block to a CSS string.
     * Handles media query wrapping if the selector has media conditions.
     * @param root - The root selector to substitute for `&`
     * @returns Formatted CSS string
     */
    asCssString(root: string): string {
        const selector = this.selector.substitute(root)
        const mediaQuery = selector.mediaQuery

        const mediaIndent = mediaQuery === undefined ? "" : "    "

        const props = Object.entries(this.cssProps)
            .toSorted(compareStringKey)
            .map(([k, v]) => `${mediaIndent}    ${k}: ${v};\n`)
            .join("")

        const blockCss = `${mediaIndent}${selector.cssSelector} {\n${props}${mediaIndent}}`

        return mediaQuery === undefined ? blockCss : `${mediaQuery} {\n${blockCss}\n}`
    }

    /**
     * Parses StyleProps into an array of CSS sub-blocks.
     * Recursively processes nested selectors and media queries.
     * Output order is deterministic for consistent hash generation.
     *
     * @param props - The style properties to parse
     * @param selector - The parent selector context (defaults to `&`)
     * @returns Non-empty array of sub-blocks (main block first, then nested)
     */
    static fromProps(props: StyleProps, selector?: MochiSelector): [CssObjectSubBlock, ...CssObjectSubBlock[]] {
        selector ??= new MochiSelector(["&"])

        const cssProps: Record<string, string> = {}
        const propsToProcess: { key: string; selector: MochiSelector; props: StyleProps }[] = []

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
                    selector: selector.extend(key),
                })
                continue
            }

            // transform media selector
            if (isMediaSelector(key)) {
                propsToProcess.push({
                    key,
                    props: value as StyleProps,
                    selector: selector.wrap(key),
                })
            }
        }

        return [
            new CssObjectSubBlock(cssProps, selector),
            ...propsToProcess
                .toSorted(stringPropComparator("key"))
                .flatMap(({ props, selector }) => CssObjectSubBlock.fromProps(props, selector)),
        ] as const
    }
}

/**
 * Represents an abstract CSS block definition.
 * Contains one or more sub-blocks for nested selectors and media queries.
 */
export class CssObjectBlock {
    /** The generated unique class name for this block */
    public readonly className: string
    /** All sub-blocks (main styles and nested/media rules) */
    public readonly subBlocks: CssObjectSubBlock[] = []

    /**
     * Creates a new CSS block from style properties.
     * Generates a unique class name based on the content hash.
     * @param styles - The style properties to compile
     */
    constructor(styles: StyleProps) {
        const blocks = CssObjectSubBlock.fromProps(styles)

        this.className = "c" + shortHash(blocks.map((b) => b.hash).join("+"))
        this.subBlocks = blocks
    }

    /**
     * Gets the CSS class selector for this block.
     */
    get selector(): string {
        return `.${this.className}`
    }

    /**
     * Converts style block to a CSS string.
     * @param root - The root selector to scope styles to
     * @returns Complete CSS string for this block
     */
    asCssString(root: string): string {
        return this.subBlocks
            .map((b) => b.asCssString(new MochiSelector([root]).extend(`&.${this.className}`).cssSelector))
            .join("\n\n")
    }
}

export type AllVariants = Record<string, Record<string, StyleProps>>
export type DefaultVariants = Record<never, Record<string, StyleProps>>

/**
 * Refines string literal types to their proper runtime types.
 * Converts "true"/"false" strings to boolean literals.
 */
type RefineVariantType<T extends string> = T extends "true"
    ? true
    : T extends "false"
      ? false
      : T extends string
        ? T
        : string

/**
 * Props for defining variants in a style object.
 * @template V - The variant definitions type
 */
export type VariantProps<V extends AllVariants> = {
    /** Variant definitions mapping names to options to styles */
    variants?: V
    /** Default variant selections for when not explicitly provided */
    defaultVariants?: { [K in keyof V]: keyof V[K] extends string ? RefineVariantType<keyof V[K] & string> : never }
}

/** Combined type for style props with optional variants */
export type MochiCSSProps<V extends AllVariants> = StyleProps & VariantProps<V>

/** Utility type to override properties of A with properties of B */
type Override<A extends object, B extends object> = B & Omit<A, keyof B>

/** Recursively merges variant types from a tuple, with later types overriding earlier */
export type MergeCSSVariants<V extends AllVariants[]> = V extends [
    infer V1 extends AllVariants,
    ...infer VRest extends AllVariants[],
]
    ? Override<V1, MergeCSSVariants<VRest>>
    : DefaultVariants

/** Refines all values in a string record to their proper variant types */
type RefineVariantTypes<V extends Record<string, string>> = { [K in keyof V]: RefineVariantType<V[K]> }

/** Extracts and refines variant option types from a DefaultVariants definition */
export type RefineVariants<T extends AllVariants> = RefineVariantTypes<{ [K in keyof T]: keyof T[K] & string }>

/**
 * Complete CSS object representation with main and variant styles.
 *
 * @template V - The variant definitions type
 *
 * @example
 * const obj = new CSSObject({
 *   color: 'blue',
 *   variants: {
 *     size: {
 *       small: { fontSize: 12 },
 *       large: { fontSize: 18 }
 *     }
 *   },
 *   defaultVariants: { size: 'small' }
 * })
 * obj.asCssString() // Returns complete CSS with all variants
 */
export class CSSObject<V extends AllVariants = DefaultVariants> {
    /** The main style block (non-variant styles) */
    public readonly mainBlock: CssObjectBlock
    /** Compiled blocks for each variant option */
    public readonly variantBlocks: { [K in keyof V & string]: Record<keyof V[K] & string, CssObjectBlock> }
    /** Default variant selections */
    public readonly variantDefaults: Partial<RefineVariants<V>>

    /**
     * Creates a new CSSObject from style props.
     * Compiles main styles and all variant options into CSS blocks.
     */
    public constructor({ variants, defaultVariants, ...props }: MochiCSSProps<V>) {
        this.mainBlock = new CssObjectBlock(props)
        this.variantBlocks = {} as typeof this.variantBlocks
        this.variantDefaults = defaultVariants ?? {}

        if (!variants) return
        for (const variantGroupName in variants) {
            this.variantBlocks[variantGroupName] = {} as (typeof this.variantBlocks)[keyof typeof this.variantBlocks]
            const variantGroup = variants[variantGroupName]
            for (const variantItemName in variantGroup) {
                this.variantBlocks[variantGroupName][variantItemName] = new CssObjectBlock(
                    variantGroup[variantItemName] ?? {},
                )
            }
        }
    }

    /**
     * Serializes the entire CSS object to a CSS string.
     * Outputs main block first, then all variant blocks in sorted order.
     * @returns Complete CSS string ready for injection into a stylesheet
     */
    public asCssString(): string {
        return [
            this.mainBlock.asCssString(this.mainBlock.selector),
            ...Object.entries(this.variantBlocks)
                .toSorted(compareStringKey)
                .flatMap(([_, b]) => Object.entries(b).toSorted(compareStringKey))
                .map(([_, b]) => b.asCssString(this.mainBlock.selector)),
        ].join("\n\n")
    }
}
