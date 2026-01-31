/**
 * Hashing utilities for generating short, deterministic class names.
 * Uses djb2 algorithm for fast string hashing.
 * @module hash
 */

/** Characters used for base-62 encoding (css-name safe variant of base-64) */
const hashBase = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_"
const base = hashBase.length

/**
 * Converts a number to a base-62 string representation.
 * @param num - The number to convert
 * @param maxLength - Optional maximum length of the output string
 * @returns Base-62 encoded string representation of the number
 */
export function numberToBase62(num: number, maxLength?: number): string {
    let out = ""
    while (num > 0 && out.length < (maxLength ?? Infinity)) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        out = hashBase[num % base]! + out
        num = Math.floor(num / base)
    }
    return out.length > 0 ? out : "0"
}

/**
 * Generates a short hash string from input using the djb2 algorithm.
 * Used to create unique, deterministic CSS class names from style content.
 * @param input - The string to hash
 * @param length - Maximum length of the hash output (default: 8)
 * @returns A short, css-safe hash string
 * @example
 * shortHash("color: red;") // Returns something like "A1b2C3d4"
 */
export function shortHash(input: string, length = 8): string {
    // fast 32-bit integer hash (djb2 variant)
    let h = 5381
    for (let i = 0; i < input.length; i++) {
        h = (h * 33) ^ input.charCodeAt(i)
    }
    // force unsigned
    h >>>= 0

    return numberToBase62(h, length)
}
