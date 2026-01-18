import {compareStringKey} from "@/compare";

const hashBase = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_";
const base = hashBase.length

export function numberToBase62(num: number, maxLength?: number): string {
    let out = ""
    while (num > 0 && out.length < (maxLength ?? Infinity)) {
        out = hashBase[num % base] + out
        num = Math.floor(num / base)
    }
    return out.length > 0 ? out : "0"
}

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
