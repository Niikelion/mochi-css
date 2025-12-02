import {Properties, ObsoleteProperties, AtRules } from "csstype"
import {asColor, asLength, CssLike, CssVar} from "@/values";

function asEnum<E extends string>(v: CssLike<E>): string {
    if (typeof v === "string") return v
    return v.value
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

function asVar(value: CssLike<string | number>): string {
    switch (typeof value) {
        case 'string': return value
        case 'number': return `${value}`
        default: return asVar(value.value)
    }
}

export type NestedSelector = `&${string}`
export type MediaSelector = `${AtRules}${string}`
type NestedStyleKeys = Exclude<string, keyof Props | CssVar>

export type StyleProps
    = { [K in keyof typeof styles]?: Parameters<(typeof styles)[K]>[0] }
    & { [K in Exclude<keyof Props, keyof typeof styles>]?: CssLike<Props[K]> }
    & { [K in CssVar]?: Parameters<(typeof asVar)>[0] }
    // & { [K in NestedStyleKeys]?: StyleProps }

function startsWith<P extends string>(value: string, prefix: P): value is `${P}${string}` {
    return value.startsWith(prefix)
}

function camelToKebab(str: string): string {
    return str.replace(/[A-Z]/g, m => "-" + m.toLowerCase());
}

export function cssFromProps(props: StyleProps): Record<string, string> {
    return Object.fromEntries(Object.entries(props).map(([key, value]) => {
        // transform variable
        if (startsWith(key, "--")) return [key, asVar(value as CssLike<string | number>)]
        const parser = (styles as Record<string, (v: unknown, n: string) => string>)[key]
        if (value === undefined || value === null) return undefined
        const cssKey = camelToKebab(key)
        if (!parser) return [cssKey, asEnum(`${value}`)]
        return [cssKey, parser(value, key)]
    }).filter(v => v !== undefined))
}

const hashBase = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_";
const base = hashBase.length

function shortHash(input: string, length = 8): string {
    // fast 32-bit integer hash (djb2 variant)
    let h = 5381;
    for (let i = 0; i < input.length; i++) {
        h = (h * 33) ^ input.charCodeAt(i);
    }
    h >>>= 0; // force unsigned

    // convert number to base
    let out = "";
    let num = h;

    while (num > 0 && out.length < length) {
        out = hashBase[num % base] + out;
        num = Math.floor(num / base);
    }
    return out || "0";
}

export function hashCss(value: Record<string, string>): string {
    const items = [...Object.entries(value)]
    const stringified = items
        .sort(([a], [b]) => a === b ? 0 : a > b ? 1 : -1)
        .map(([key, value]) => `${key}: ${value};`)
        .join('\n')
    return `s${shortHash(stringified)}`
}
