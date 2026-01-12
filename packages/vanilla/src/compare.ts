export function compareString<T extends string>(a: T, b: T) {
    return a < b ? -1 : a === b ? 0 : 1
}
export function compareStringKey<T extends [string, any]>(a: T, b: T) {
    return compareString(a[0], b[0])
}

export function compareStringProp<N extends string>(name: N) {
    return <T extends { [K in N]: string }>(a: T, b: T) => compareString(a[name], b[name])
}
