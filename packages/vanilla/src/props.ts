import {Properties, ObsoleteProperties, AtRules } from "csstype"
import {asColor, asLength, CssLike, CssVar} from "@/values"
import {all as allProperties} from "known-css-properties"

function asEnum<E extends string | number>(v: CssLike<E>): string {
    if (typeof v === "string") return v
    if (typeof v === "number") return v.toString()
    return v.value.toString()
}

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
    borderBlockWidth: asLength,
    borderInlineWidth: asLength,
    borderWidth: asLength,
} satisfies { [K in keyof Props]?: (v: any, n: string) => string }

const knownPropertySet = new Set<string>(allProperties.map(kebabToCamel))

function asVar(value: CssLike<string | number>): string {
    switch (typeof value) {
        case 'string': return value
        case 'number': return `${value}`
        default: return asVar(value.value)
    }
}

export type NestedCssSelector = `${string}&${string}`
export type MediaSelector = `${AtRules}${string}`
type NestedStyleKeys = MediaSelector | NestedCssSelector

export type SimpleStyleProps
    = { [K in keyof typeof styles]?: Parameters<(typeof styles)[K]>[0] }
    & { [K in Exclude<keyof Props, keyof typeof styles>]?: CssLike<Props[K]> }
    & { [K in CssVar]?: Parameters<(typeof asVar)>[0] }

export type StyleProps = SimpleStyleProps & { [K in NestedStyleKeys]?: StyleProps | CssLike<string | number> }

function startsWith<P extends string>(value: string, prefix: P): value is `${P}${string}` {
    return value.startsWith(prefix)
}

function camelToKebab(str: string): string {
    return str.replace(/[A-Z]/g, m => "-" + m.toLowerCase())
}
function kebabToCamel(str: string): string {
    return str.replace(/-[a-z]/g, m => m.substring(1).toUpperCase())
}

export function cssFromProps(props: SimpleStyleProps): Record<string, string> {
    return Object.fromEntries(Object.entries(props).map(([key, value]) => {
        if (value === undefined) return undefined
        // transform variable
        if (startsWith(key, "--")) return [key, asVar(value as CssLike<string | number>)]
        // transform CSS prop
        if (knownPropertySet.has(key)) {
            const parser = (styles as Record<string, (v: unknown, n: string) => string>)[key]
            const cssKey = camelToKebab(key)
            if (!parser) return [cssKey, asEnum(value)]
            return [cssKey, parser(value, key)]
        }
        return undefined
    }).filter(v => v !== undefined))
}
