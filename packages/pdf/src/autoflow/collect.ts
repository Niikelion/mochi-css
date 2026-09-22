import type { ReactNode } from "react"
import { elementChildren, type Fragment } from "./nodes"
import { measureTextLines } from "./text"
import type { ItemRect } from "./paginate"

/** A unit of content that can be placed on a page, with where it sits in the measured layout. */
export type Atom = Fragment & { rect: ItemRect }

/** How far to descend when looking for finer break points. */
const MAX_DEPTH = 4

/**
 * Marks which atoms are lines of the same run of text, so pagination can keep a minimum number of
 * them together. Atoms that are whole nodes break freely and get no group.
 */
export function textGroups(atoms: Atom[]): (number | undefined)[] {
    const groups: (number | undefined)[] = []
    let current: number | undefined
    let previous: Atom | undefined

    for (const [index, atom] of atoms.entries()) {
        if (atom.text === undefined) {
            groups.push(undefined)
            current = undefined
        } else {
            // Lines of one paragraph are emitted consecutively and share its path.
            if (current === undefined || previous?.text === undefined || !samePath(atom.path, previous.path)) {
                current = index
            }
            groups.push(current)
        }
        previous = atom
    }

    return groups
}

function samePath(a: number[], b: number[]): boolean {
    return a.length === b.length && a.every((step, index) => step === b[index])
}

/**
 * Finds the smallest units the content can be broken into, measured against the live layout
 * of `container`.
 *
 * Descent stops at a node that declares `break-inside: avoid`, or whose rendered DOM does not
 * map one-to-one onto its React children — a component rendering a fragment or nothing at all
 * breaks that correspondence, and guessing there would split the wrong element. Such a node
 * stays atomic, which costs packing density but never produces wrong output.
 */
export function collectAtoms(nodes: ReactNode[], container: Element): Atom[] | null {
    const elements = [...container.children]
    // The same correspondence the descent requires has to hold at the root too. Without it the
    // two sequences pair off by one, which attaches the wrong measurement to the wrong node and
    // drops whatever falls off the end — wrong output, silently.
    if (elements.length !== nodes.length) return null

    const out: Atom[] = []
    walk(nodes, elements, 0, [], out)
    return out
}

function walk(nodes: ReactNode[], elements: Element[], depth: number, path: number[], out: Atom[]): void {
    for (let index = 0; index < nodes.length; index++) {
        const element = elements[index]
        if (element === undefined) continue

        const children = depth < MAX_DEPTH && !isAtomic(element) ? elementChildren(nodes[index]) : null
        // A single child is worth descending into: it cannot be split here, but a paragraph
        // nested inside a wrapper can still be split between its own lines further down.
        const canDescend = children !== null && element.children.length === children.length

        if (canDescend) {
            walk(children, [...element.children], depth + 1, [...path, index], out)
            continue
        }

        const here = [...path, index]

        // Nothing smaller to break at structurally — but a run of text can still be broken
        // between its own lines, which is what lets a paragraph continue onto the next page.
        const lines = isAtomic(element) ? null : measureTextLines(element)
        if (lines === null) {
            out.push({ path: here, rect: rectOf(element) })
            continue
        }

        for (const line of lines) {
            out.push({ path: here, rect: line.rect, text: { start: line.start, end: line.end } })
        }
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
