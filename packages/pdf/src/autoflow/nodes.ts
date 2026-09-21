import { Children, cloneElement, isValidElement, type ReactNode } from "react"

/** Children of `node` as a flat array, or null when it has none to descend into. */
export function elementChildren(node: ReactNode): ReactNode[] | null {
    if (!isValidElement(node)) return null

    const props: unknown = node.props
    if (typeof props !== "object" || props === null || !("children" in props)) return null

    const children = (props as { children?: ReactNode }).children
    if (children === undefined || children === null) return null

    const array = Children.toArray(children)
    return array.length > 0 ? array : null
}

type Trie = Map<number, Trie>

/**
 * Rebuilds a subset of a node tree from the paths of the leaves that belong to it.
 *
 * Every ancestor along a kept path is cloned with only its kept descendants, so splitting a
 * list across pages yields a real list on each page instead of loose items.
 */
export function rebuild(nodes: ReactNode[], paths: number[][]): ReactNode[] {
    return rebuildLevel(nodes, buildTrie(paths))
}

function buildTrie(paths: number[][]): Trie {
    const root: Trie = new Map()
    for (const path of paths) {
        let node = root
        for (const index of path) {
            let next = node.get(index)
            if (next === undefined) {
                next = new Map()
                node.set(index, next)
            }
            node = next
        }
    }
    return root
}

function rebuildLevel(nodes: ReactNode[], trie: Trie): ReactNode[] {
    const out: ReactNode[] = []

    for (const index of [...trie.keys()].sort((a, b) => a - b)) {
        const node = nodes[index]
        if (node === undefined) continue

        const sub = trie.get(index)
        const children = sub === undefined || sub.size === 0 ? null : elementChildren(node)
        if (sub === undefined || children === null || !isValidElement(node)) {
            out.push(node)
            continue
        }

        out.push(cloneElement(node, undefined, ...rebuildLevel(children, sub)))
    }

    return out
}
