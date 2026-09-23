import { Children, cloneElement, createElement, isValidElement, type ReactNode, type CSSProperties } from "react"

/** A character range inside a text node, as `[start, end)`. */
export type TextRange = { start: number; end: number }

/** A piece of the tree kept on a page: a whole node, or a run of text inside one. */
export type Fragment = {
    /** Index chain from the root children array down to the node. */
    path: number[]
    text?: TextRange
    empty?: boolean
    style?: CSSProperties
    rowSpan?: number
}

/**
 * The children to flow, as a list that lines up with what the DOM will contain.
 *
 * Bare text renders as a text node, which does not appear among an element's children — so a list
 * mixing text with elements would pair the two sequences off by one and quietly drop the tail.
 * Wrapping the text gives it an element of its own without changing how it lays out.
 */
export function normalizeItems(children: ReactNode): ReactNode[] {
    return Children.toArray(children).map((child, index) =>
        typeof child === "string" || typeof child === "number"
            ? createElement("span", { key: `mochi-text-${index}` }, child)
            : child,
    )
}

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

/** The node's text, when its entire content is a single string. */
export function textContentOf(node: ReactNode): string | null {
    const children = elementChildren(node)
    if (children?.length !== 1) return null

    const [only] = children
    return typeof only === "string" ? only : null
}

type Trie = {
    children: Map<number, Trie>
    text?: TextRange
    empty?: boolean
    style?: CSSProperties
    rowSpan?: number
}

/**
 * Rebuilds the part of a node tree that belongs on one page.
 *
 * Every ancestor along a kept path is cloned with only its kept descendants, so splitting a list
 * across pages yields a real list on each. A node kept as text is cloned with just that run, which
 * is how a paragraph continues across a page break.
 */
export function rebuild(nodes: ReactNode[], fragments: Fragment[]): ReactNode[] {
    return rebuildLevel(nodes, buildTrie(fragments))
}

function buildTrie(fragments: Fragment[]): Trie {
    const root: Trie = { children: new Map() }

    for (const fragment of fragments) {
        let node = root
        for (const index of fragment.path) {
            let next = node.children.get(index)
            if (next === undefined) {
                next = { children: new Map() }
                node.children.set(index, next)
            }
            node = next
        }

        if (fragment.empty !== undefined) node.empty = fragment.empty
        if (fragment.style !== undefined) node.style = fragment.style
        if (fragment.rowSpan !== undefined) node.rowSpan = fragment.rowSpan
        if (fragment.text === undefined) continue
        // Lines of the same paragraph on the same page are contiguous, so their union is the run
        // of text that page shows.
        node.text =
            node.text === undefined
                ? { ...fragment.text }
                : {
                      start: Math.min(node.text.start, fragment.text.start),
                      end: Math.max(node.text.end, fragment.text.end),
                  }
    }

    return root
}

function rebuildLevel(nodes: ReactNode[], trie: Trie): ReactNode[] {
    const out: ReactNode[] = []

    for (const index of [...trie.children.keys()].sort((a, b) => a - b)) {
        let node = nodes[index]
        const sub = trie.children.get(index)
        if (node === undefined || sub === undefined) continue

        if (sub.rowSpan !== undefined && isValidElement<{ rowSpan?: number }>(node)) {
            node = cloneElement(node, { rowSpan: sub.rowSpan })
        }

        if (sub.style !== undefined && isValidElement<{ style?: CSSProperties }>(node)) {
            node = cloneElement(node, { style: { ...node.props.style, ...sub.style } })
        }
        if (sub.empty === true && isValidElement(node)) {
            out.push(cloneElement(node, undefined, null))
            continue
        }

        if (sub.text !== undefined) {
            out.push(sliceText(node, sub.text))
            continue
        }

        const children = sub.children.size === 0 ? null : elementChildren(node)
        if (children === null || !isValidElement(node)) {
            out.push(node)
            continue
        }

        const rebuilt = rebuildLevel(children, sub)
        // cloneElement with no children argument keeps the original ones, so an empty result has
        // to be passed explicitly or the whole subtree reappears.
        out.push(rebuilt.length === 0 ? cloneElement(node, undefined, null) : cloneElement(node, undefined, ...rebuilt))
    }

    return out
}

function sliceText(node: ReactNode, range: TextRange): ReactNode {
    const content = textContentOf(node)
    if (content === null || !isValidElement(node)) return node

    const slice = content.slice(range.start, range.end)
    return slice === content ? node : cloneElement(node, undefined, slice)
}
