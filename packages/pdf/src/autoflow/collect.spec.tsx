// @vitest-environment happy-dom
import { describe, it, expect } from "vitest"
import { collectAtoms, textGroups } from "./collect"
import type { Atom } from "./collect"

/** Builds a container whose children mirror the shape the React nodes would render to. */
function buildDom(shape: number[]): HTMLElement {
    const container = document.createElement("div")
    let top = 0

    for (const childCount of shape) {
        const element = document.createElement("div")
        stubRect(element, top, 100)
        for (let i = 0; i < childCount; i++) {
            const child = document.createElement("div")
            stubRect(child, top + i * 10, 10)
            element.appendChild(child)
        }
        container.appendChild(element)
        top += 100
    }

    return container
}

function stubRect(element: Element, top: number, height: number): void {
    element.getBoundingClientRect = () => ({ top, bottom: top + height }) as DOMRect
}

describe("collectAtoms", () => {
    it("descends into a node whose children map one to one onto the DOM", () => {
        const container = buildDom([2])
        const nodes = [
            <ul key="l">
                <li>a</li>
                <li>b</li>
            </ul>,
        ]

        expect(collectAtoms(nodes, container).map((atom) => atom.path)).toEqual([
            [0, 0],
            [0, 1],
        ])
    })

    it("stays atomic when the rendered DOM does not match the React children", () => {
        // One rendered child, two React children — the mapping is ambiguous, so do not guess.
        const container = buildDom([1])
        const nodes = [
            <ul key="l">
                <li>a</li>
                <li>b</li>
            </ul>,
        ]

        expect(collectAtoms(nodes, container).map((atom) => atom.path)).toEqual([[0]])
    })

    it("stays atomic for a single child, which offers no break point", () => {
        const container = buildDom([1])
        const nodes = [
            <div key="d">
                <p>only</p>
            </div>,
        ]

        expect(collectAtoms(nodes, container).map((atom) => atom.path)).toEqual([[0]])
    })

    it("does not descend into content marked break-inside: avoid", () => {
        const container = buildDom([2])
        const element = container.children[0]
        if (element === undefined) throw new Error("expected a child")

        // happy-dom does not implement break-inside, so report it the way a browser would.
        const original = window.getComputedStyle
        window.getComputedStyle = ((target: Element) => ({
            getPropertyValue: (property: string) => (target === element && property === "break-inside" ? "avoid" : ""),
        })) as unknown as typeof window.getComputedStyle

        try {
            const nodes = [
                <ul key="l">
                    <li>a</li>
                    <li>b</li>
                </ul>,
            ]

            expect(collectAtoms(nodes, container).map((atom) => atom.path)).toEqual([[0]])
        } finally {
            window.getComputedStyle = original
        }
    })

    it("groups consecutive lines of one paragraph, leaving whole nodes ungrouped", () => {
        const rect = { top: 0, bottom: 10 }
        const atoms: Atom[] = [
            { path: [0], rect },
            { path: [1], rect, text: { start: 0, end: 5 } },
            { path: [1], rect, text: { start: 5, end: 9 } },
            { path: [2], rect, text: { start: 0, end: 4 } },
            { path: [3], rect },
        ]

        // Lines of one paragraph share an id; a different paragraph starts a new one.
        expect(textGroups(atoms)).toEqual([undefined, 1, 1, 3, undefined])
    })

    it("reports the measured position of each atom", () => {
        const container = buildDom([0, 0])
        const nodes = [<p key="a">a</p>, <p key="b">b</p>]

        expect(collectAtoms(nodes, container).map((atom) => atom.rect)).toEqual([
            { top: 0, bottom: 100 },
            { top: 100, bottom: 200 },
        ])
    })
})
