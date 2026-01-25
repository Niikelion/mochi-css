/**
 * String comparison utilities for deterministic sorting.
 * Used internally to ensure consistent CSS output order.
 * @module compare
 */

/**
 * Compares two strings lexicographically.
 */
export function compareString<T extends string>(a: T, b: T) {
    return a < b ? -1 : a === b ? 0 : 1
}

/**
 * Compares two tuples by their first element (string key).
 * Useful for sorting Object.entries() results.
 */
export function compareStringKey<T extends [string, any]>(a: T, b: T) {
    return compareString(a[0], b[0])
}

/**
 * Creates a comparator function for objects with a specific string property.
 * @param name - The property name to compare by
 * @returns A comparator function that compares objects by the specified property
 * @example
 * const items = [{ key: 'b' }, { key: 'a' }]
 * items.sort(stringPropComparator('key')) // [{ key: 'a' }, { key: 'b' }]
 */
export function stringPropComparator<N extends string>(name: N) {
    return <T extends { [K in N]: string }>(a: T, b: T) => compareString(a[name], b[name])
}
