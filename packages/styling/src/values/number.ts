import {LengthUnit} from "@/values/length";

export type Unit = "%" | "px" | "deg" | "rad" | "grad" | "rem" | "vw" | "vh"
export class NumericValue<T extends LengthUnit = LengthUnit> {
    constructor(
        private readonly value: number,
        private readonly suffix: T
    ) {}

    toString(): `${number}${T}` {
        return `${this.value}${this.suffix}`
    }
}
