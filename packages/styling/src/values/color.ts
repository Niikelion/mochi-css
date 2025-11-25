import {DataType} from "csstype"
import {CssLike} from "@/values/shared";

export type RGBColorString = `rgb(${number},${number},${number})`
export type RGBAColorString = `rgba(${number},${number},${number},${number})`

export type HSLColorString = `hsl(${number},${number},${number})`
export type HSLAColorString = `hsla(${number},${number},${number},${number})`

export type ColorString = RGBColorString | RGBAColorString | HSLColorString | HSLAColorString
export type CssColor = DataType.NamedColor | "transparent" | "currentColor" | "auto" | ColorString

export type CssColorLike = CssLike<CssColor>

export function asColor(value: CssColorLike): CssColor {
    if (typeof value === "string") return value
    return value.value
}
