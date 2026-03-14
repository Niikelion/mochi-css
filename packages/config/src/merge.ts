export function mergeArrays<T>(a: T[] | undefined, b: T[] | undefined): T[] | undefined {
    if (a !== undefined && b !== undefined) return a.concat(b)
    return a ?? b
}

type Callback<T extends unknown[]> = (...args: T) => void

export function mergeCallbacks<T extends unknown[]>(
    a: Callback<T> | undefined,
    b: Callback<T> | undefined,
): Callback<T> | undefined {
    if (a !== undefined && b !== undefined)
        return (...args: T) => {
            a(...args)
            b(...args)
        }
    return a ?? b
}
