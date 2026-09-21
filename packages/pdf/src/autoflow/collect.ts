import type { ReactNode } from "react"
import { elementChildren } from "./nodes"
import type { ItemRect } from "./paginate"

export type Atom = {
    /** Index chain from the root children array down to this node. */
    path: number[]
    rect: ItemRect
}

/** How far to descend when looking for finer break points. */
const MAX_DEPTH = 4

/**
 * Finds the smallest units the content can be broken into, measured against the live layout
 * of `container`.
 *
 * Descent stops at a node that declares `break-inside: avoid`, or whose rendered DOM does not
 * map one-to-one onto its React children — a component rendering a fragment or nothing at all
 * breaks that correspondence, and guessing there would split the wrong element. Such a node
 * stays atomic, which costs packing density but never produces wrong output.
 */
export function collectAtoms(nodes: ReactNode[], container: Element): Atom[] {
    const out: Atom[] = []
    walk(nodes, [...container.children], 0, [], out)
    return out
}

function walk(nodes: ReactNode[], elements: Element[], depth: number, path: number[], out: Atom[]): void {
    for (let index = 0; index < nodes.length; index++) {
        const element = elements[index]
        if (element === undefined) continue

        const children = depth < MAX_DEPTH && !isAtomic(element) ? elementChildren(nodes[index]) : null
        const canDescend = children !== null && children.length >= 2 && element.children.length === children.length

        if (canDescend) walk(children, [...element.children], depth + 1, [...path, index], out)
        else out.push({ path: [...path, index], rect: rectOf(element) })
    }
}

function isAtomic(element: Element): boolean {
    const view = element.ownerDocument.defaultView
    if (view === null) return false
    return view.getComputedStyle(element).getPropertyValue("break-inside") === "avoid"
}

function rectOf(element: Element): ItemRect {
    const { top, bottom } = element.getBoundingClientRect()
    return { top, bottom }
}
