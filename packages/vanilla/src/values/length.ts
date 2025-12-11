import {CssLike, CssVarVal} from "./shared";
import { NumericValue } from "./number";
import {Globals} from "csstype"

export class PixelValue extends NumericValue<"px"> {
    constructor(value: number) { super(value, "px") }
}

export class PercentValue extends NumericValue<"%"> {
    constructor(value: number) { super(value, "%") }
}

export type LengthUnit = "%" | "px" | "vw" | "vh" | "rem"
export type CssLengthString = `${number}${LengthUnit}` | CssVarVal | Globals | "auto"
export type CssLength = number | CssLengthString | CssVarVal
export type CssLengthLike = CssLike<CssLength>

export function asLength(value: CssLengthLike): CssLengthString {
    switch (typeof value) {
        case "number": return `${value}px`
        case "string": return value
        default: return asLength(value.value)
    }
}
