import {CssVar, CssVarVal} from "@/values";

export class Token<T> {
    constructor(public readonly name: String) {}

    get variable(): CssVar {
        return `--${this.name}`
    }
    get value(): CssVarVal {
        return `var(${this.variable})`
    }

    toString(): CssVar {
        return this.variable
    }

    set(value: T): Record<CssVar, T> {
        return {
            [this.variable]: value
        } as Record<CssVar, T>
    }
}

export function createToken<T>(name: string): Token<T> {
    return new Token(name)
}
