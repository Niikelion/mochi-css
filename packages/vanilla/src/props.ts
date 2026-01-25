/**
 * CSS property handling and type definitions.
 * Provides type-safe mappings from JavaScript objects to CSS properties,
 * with automatic unit conversion and value formatting.
 * @module props
 */

import {Properties, ObsoleteProperties } from "csstype"
import {asColor, asLength, CssLike, CssVar} from "@/values"
import properties from "known-css-properties"

/**
 * Converts a CSS-like value to its string representation.
 * Handles strings, numbers, and wrapped values with a `.value` property.
 * @param v - The value to convert
 * @returns The string representation of the value
 */
function asEnum<E extends string | number>(v: CssLike<E>): string {
    if (typeof v === "string") return v
    if (typeof v === "number") return v.toString()
    return v.value.toString()
}

/** All non-obsolete CSS properties from csstype */
type Props = Required<Omit<Properties, keyof ObsoleteProperties>>

const styles = {
    borderBlockEndWidth: asLength,
    borderBlockStartWidth: asLength,
    borderBottomColor: asColor,
    borderBottomLeftRadius: asLength,
    borderBottomRightRadius: asLength,
    borderBottomWidth: asLength,
    borderEndEndRadius: asLength,
    borderEndStartRadius: asLength,
    borderInlineEndWidth: asLength,
    borderInlineStartWidth: asLength,
    borderLeftWidth: asLength,
    borderRightWidth: asLength,
    borderStartEndRadius: asLength,
    borderStartStartRadius: asLength,
    borderTopLeftRadius: asLength,
    borderTopRightRadius: asLength,
    borderTopWidth: asLength,
    borderBlockWidth: asLength,
    borderInlineWidth: asLength,
    borderWidth: asLength,
    gap: asLength,
    height: asLength,
    lineHeight: asLength,
    marginBottom: asLength,
    marginLeft: asLength,
    marginRight: asLength,
    marginTop: asLength,
    paddingBottom: asLength,
    paddingLeft: asLength,
    paddingRight: asLength,
    paddingTop: asLength,
    width: asLength,
} satisfies { [K in keyof Props]?: (v: any, n: string) => string }

/** Set of all known CSS property names in camelCase format */
const knownPropertySet = new Set<string>(properties.all.map(kebabToCamel))

/**
 * Type guard that checks if a string starts with a specific prefix.
 */
function startsWith<P extends string>(value: string, prefix: P): value is `${P}${string}` {
    return value.startsWith(prefix)
}

/**
 * Checks if a property name is a CSS custom property (variable).
 */
export function isCssVariableName(key: string): key is CssVar {
    return startsWith(key, '--')
}

/**
 * Converts a CSS-like value to a string for use as a CSS variable value.
 * @param value - The value to convert (string, number, or wrapped value)
 * @returns The string representation
 */
export function asVar(value: CssLike<string | number>): string {
    switch (typeof value) {
        case 'string': return value
        case 'number': return `${value}`
        default: return asVar(value.value)
    }
}

/**
 * Checks if a property name is a known CSS property.
 */
export function isKnownPropertyName(key: string): key is keyof Props {
    return knownPropertySet.has(key)
}

/**
 * Converts a value to a CSS property string using the appropriate parser.
 * Uses specialized parsers for properties with unit requirements (lengths, colors).
 * @param value - The value to convert
 * @param key - The CSS property name
 * @returns The formatted CSS value string
 */
export function asKnownProp(value: any, key: keyof Props): string {
    const parser: ((v: any, k: string) => string) | undefined = key in styles ? styles[key as keyof typeof styles] : undefined
    if (!parser) return asEnum(value)
    return parser(value, key)
}

/**
 * Checks if a key represents a nested CSS selector.
 */
//TODO: make better validation, provide human readable errors
export function isNestedSelector(key: string): key is NestedCssSelector {
    return key.includes("&")
}

/**
 * Checks if a key represents a media query.
 */
//TODO: make better validation, provide human readable errors
export function isMediaSelector(key: string): key is MediaSelector {
    return key.startsWith("@")
}

/** A nested CSS selector pattern containing the parent reference `&` */
export type NestedCssSelector = `${string}&${string}`

/** A CSS media query starting with `@` */
export type MediaSelector = `@${string}`

type NestedStyleKeys = MediaSelector | NestedCssSelector

/**
 * Style properties without nesting support.
 * Includes all standard CSS properties with type-safe value converters,
 * plus CSS custom properties (variables).
 */
export type SimpleStyleProps
    = { [K in keyof typeof styles]?: Parameters<(typeof styles)[K]>[0] }
    & { [K in Exclude<keyof Props, keyof typeof styles>]?: CssLike<Props[K]> }
    & { [K in CssVar]?: Parameters<(typeof asVar)>[0] }

/**
 * Full style properties type with support for nested selectors and media queries.
 * Extends SimpleStyleProps to allow recursive style definitions.
 *
 * @example
 * const styles: StyleProps = {
 *   color: 'blue',
 *   padding: 16,
 *   '&:hover': { color: 'red' },
 *   '@min-width: 768px': { padding: 24 }
 * }
 */
export type StyleProps = SimpleStyleProps & { [K in NestedStyleKeys]?: StyleProps | CssLike<string | number> }

/**
 * Converts a camelCase string to kebab-case.
 */
export function camelToKebab(str: string): string {
    return str.replace(/[A-Z]/g, m => "-" + m.toLowerCase())
}

/**
 * Converts a kebab-case string to camelCase.
 */
export function kebabToCamel(str: string): string {
    return str.replace(/-[a-z]/g, m => m.substring(1).toUpperCase())
}

/**
 * Converts a SimpleStyleProps object to a CSS properties record.
 * Transforms camelCase property names to kebab-case and applies value converters.
 * @param props - The style properties object
 * @returns A record of CSS property names (kebab-case) to string values
 * @example
 * cssFromProps({ backgroundColor: 'blue', padding: 16 })
 * // { 'background-color': 'blue', 'padding': '16px' }
 */
export function cssFromProps(props: SimpleStyleProps): Record<string, string> {
    return Object.fromEntries(Object.entries(props).map(([key, value]) => {
        if (value === undefined) return undefined
        // transform variable
        if (isCssVariableName(key)) return [key, asVar(value as CssLike<string | number>)]
        // transform CSS prop
        if (isKnownPropertyName(key)) return [camelToKebab(key), asKnownProp(value, key)]
        return undefined
    }).filter(v => v !== undefined))
}
