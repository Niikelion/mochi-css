import { describe, expect, it } from "vitest"
import { paginateAtoms, type ParallelLayout } from "./parallel"
import type { Atom } from "./collect"

const layout: ParallelLayout = {
    path: [0],
    slots: [
        { path: [0, 0], style: {} },
        { path: [0, 1], style: {} },
    ],
}
const atom = (column: number, line: number, top: number, height = 20): Atom => ({
    path: [0, column, line],
    rect: { top, bottom: top + height },
    layouts: [layout],
})
const content = (pages: ReturnType<typeof paginateAtoms>) =>
    pages.map((page) => page.filter((fragment) => fragment.path.length === 3))

describe("parallel pagination", () => {
    it("places a short later sibling alongside the first column, including when it ends at a different height", () => {
        const atoms = [atom(0, 0, 0, 60), atom(0, 1, 60, 60), atom(1, 0, 0, 40)]
        const pages = paginateAtoms(atoms, 100)
        expect(content(pages).map((page) => page.map((fragment) => fragment.path))).toEqual([
            [
                [0, 0, 0],
                [0, 1, 0],
            ],
            [[0, 0, 1]],
        ])
        expect(pages[1]).toContainEqual({ path: [0, 1], style: {}, empty: true })
    })

    it("does not strand a widow in either parallel text run", () => {
        const atoms: Atom[] = [0, 1].flatMap((column) =>
            Array.from({ length: 5 }, (_, line) => ({
                ...atom(column, 0, line * 20),
                text: { start: line, end: line + 1 },
            })),
        )
        const pages = content(paginateAtoms(atoms, 80))
        expect(pages.map((page) => page.length)).toEqual([6, 4])
        for (const column of [0, 1]) {
            expect(pages.map((page) => page.filter((fragment) => fragment.path[1] === column).length)).toEqual([3, 2])
        }
    })

    it("terminates for oversized atomic children and preserves every fragment", () => {
        const atoms = [atom(0, 0, 0, 300), atom(1, 0, 0, 250)]
        expect(
            content(paginateAtoms(atoms, 100))
                .flat()
                .map((fragment) => fragment.path),
        ).toEqual(atoms.map((atom) => atom.path))
    })

    it("keeps a single page when there is no usable height", () => {
        expect(paginateAtoms([atom(0, 0, 0), atom(1, 0, 0)], 0)).toHaveLength(1)
        expect(paginateAtoms([], 100)).toEqual([])
    })
})
