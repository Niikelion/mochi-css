/**
 * CSS property handling and type definitions.
 * Provides type-safe mappings from JavaScript objects to CSS properties,
 * with automatic unit conversion and value formatting.
 * @module props
 */

import { Properties, ObsoleteProperties } from "csstype"
import { CssLike, CssVar } from "@/values"
import properties from "known-css-properties"
import { propertyUnits, type PropertyWithUnit } from "./propertyUnits.generated"

/** All non-obsolete CSS properties from csstype */
type Props = Required<Omit<Properties, keyof ObsoleteProperties>>

/** Properties that have default units and are valid CSS properties */
type PropsWithUnit = PropertyWithUnit & keyof Props

/**
 * Converts a kebab-case string to camelCase.
 */
export function kebabToCamel(str: string): string {
    return str.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
}

/**
 * Converts a camelCase string to kebab-case.
 */
export function camelToKebab(str: string): string {
    return str.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase())
}

function getUnitForProperty(propertyName: string): string | undefined {
    return propertyName in propertyUnits ? propertyUnits[propertyName as PropertyWithUnit] : undefined
}

/**
 * Converts a CSS-like value to its string representation.
 * For properties with known units, numbers are automatically suffixed.
 */
function formatValue(value: CssLike<string | number>, propertyName: string, maxDepth = 10): string {
    if (maxDepth <= 0) return ""
    if (typeof value === "string") return value
    if (typeof value === "number") {
        const unit = getUnitForProperty(propertyName)
        return unit ? `${value.toString()}${unit}` : value.toString()
    }
    return formatValue(value.value, propertyName, maxDepth - 1)
}

const knownPropertySet = new Set<string>(properties.all.map(kebabToCamel))

/**
 * Checks if a property name is a CSS custom property (variable).
 */
export function isCssVariableName(key: string): key is CssVar {
    return key.startsWith("--")
}

/**
 * Converts a CSS-like value to a string for use as a CSS variable value.
 * @param value - The value to convert (string, number, or wrapped value)
 * @param maxDepth - Maximum recursion depth for evaluating the value
 * @returns The string representation
 */
export function asVar(value: CssLike<string | number>, maxDepth = 10): string {
    if (maxDepth <= 0) return ""
    switch (typeof value) {
        case "string":
            return value
        case "number":
            return value.toString()
        default:
            return asVar(value.value, maxDepth - 1)
    }
}

/**
 * Checks if a property name is a known CSS property.
 */
export function isKnownPropertyName(key: string): key is keyof Props {
    return knownPropertySet.has(key)
}

/**
 * Converts a value to a CSS property string.
 * Automatically appends units to numeric values for properties that require them.
 * @param value - The value to convert
 * @param key - The CSS property name
 * @returns The formatted CSS value string
 */
export function asKnownProp(value: unknown, key: keyof Props): string {
    return formatValue(value as CssLike<string | number>, key)
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
 *
 * Properties with known units (e.g., width, height, padding) accept numbers
 * that are automatically converted with their default unit (e.g., px, ms).
 */
export type SimpleStyleProps = { [K in PropsWithUnit]?: CssLike<number | Props[K]> } & {
    [K in Exclude<keyof Props, PropsWithUnit>]?: CssLike<Props[K]>
} & Partial<Record<CssVar, CssLike<string | number>>>

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
 * Converts a SimpleStyleProps object to a CSS properties record.
 * Transforms camelCase property names to kebab-case and applies value converters.
 * @param props - The style properties object
 * @returns A record of CSS property names (kebab-case) to string values
 * @example
 * cssFromProps({ backgroundColor: 'blue', padding: 16 })
 * // { 'background-color': 'blue', 'padding': '16px' }
 */
export function cssFromProps(props: SimpleStyleProps): Record<string, string> {
    return Object.fromEntries(
        Object.entries(props)
            .map(([key, value]): [string, string] | undefined => {
                if (value === undefined) return undefined
                // transform variable
                if (isCssVariableName(key)) return [key, asVar(value as CssLike<string | number>)]
                // transform CSS prop
                if (isKnownPropertyName(key)) return [camelToKebab(key), asKnownProp(value, key)]
                return undefined
            })
            .filter((v) => v !== undefined),
    )
}
