import {CssVar, CssVarVal} from "@/values";

export class Token<T> {
    constructor(public readonly name: string) {}

    get variable(): CssVar {
        return `--${this.name}`
    }
    get value(): CssVarVal {
        return `var(${this.variable})`
    }

    toString(): CssVar {
        return this.variable
    }
}

export function createToken<T>(name: string): Token<T> {
    return new Token(name)
}
