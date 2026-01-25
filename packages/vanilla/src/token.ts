/**
 * CSS custom property (design token) utilities.
 * Provides type-safe access to CSS variables with proper `var()` syntax.
 * @module token
 */

import {CssVar, CssVarVal} from "@/values";

/**
 * Represents a CSS custom property (design token) with type information.
 * Provides convenient access to both the variable name and its `var()` reference.
 * @template T - The expected value type of the token (for type checking)
 * @example
 * const primaryColor = new Token<string>('primary-color')
 * primaryColor.variable // '--primary-color'
 * primaryColor.value    // 'var(--primary-color)'
 */
export class Token<T> {
    /**
     * Creates a new CSS token.
     * @param name - The token name (without the `--` prefix)
     */
    constructor(public readonly name: string) {}

    /**
     * Gets the CSS custom property name (with `--` prefix).
     * Use this when defining the variable.
     */
    get variable(): CssVar {
        return `--${this.name}`
    }

    /**
     * Gets the CSS `var()` reference to this token.
     * Use this when consuming the variable value.
     */
    get value(): CssVarVal {
        return `var(${this.variable})`
    }

    /**
     * Returns the variable name for string coercion.
     */
    toString(): CssVar {
        return this.variable
    }
}

/**
 * Creates a new CSS design token.
 * @template T - The expected value type of the token
 * @param name - The token name (without the `--` prefix)
 * @returns A new Token instance
 * @example
 * const spacing = createToken<number>('spacing-md')
 * // Use in styles: { gap: spacing.value }
 */
export function createToken<T>(name: string): Token<T> {
    return new Token(name)
}
