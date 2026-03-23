declare const __VERSION__: string

export function mochiPackage(name: string): string {
    const major = parseInt(__VERSION__.split(".")[0] ?? "0", 10)
    return `${name}@^${major}.0.0`
}
