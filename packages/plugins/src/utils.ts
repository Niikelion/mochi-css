export function getOrInsert<K, V>(target: Map<K, V>, key: K, compute: () => V): V {
    const value = target.get(key)
    if (value) return value
    const newValue = compute()
    target.set(key, newValue)
    return newValue
}

export function isLocalImport(source: string): boolean {
    return source.startsWith("./") || source.startsWith("../")
}
