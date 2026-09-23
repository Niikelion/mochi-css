import type { CSSProperties } from "react"
import type { Atom } from "./collect"
import type { Fragment } from "./nodes"
import { paginateRects } from "./paginate"
import { textGroups } from "./collect"
import { tableSlots } from "./table"

export type ParallelLayout = {
    path: number[]
    style?: CSSProperties
    table?: boolean
    slots: {
        path: number[]
        style: CSSProperties
        structural?: boolean
        row?: { start: number; end: number }
        tableRow?: number[]
        rowSpan?: number
    }[]
}

/** Snapshot horizontal sizing before empty continuations can change intrinsic sizing. */
export function measureParallel(element: Element, path: number[]): ParallelLayout | undefined {
    const view = element.ownerDocument.defaultView
    if (view === null) return undefined
    const style = view.getComputedStyle(element)
    const display = style.display
    const flex = display.includes("flex") && !style.flexDirection.startsWith("column")
    const grid = display.includes("grid")
    const row = display === "table-row"
    const table = display === "table" || display === "inline-table"
    if (!flex && !grid && !row && !table) return undefined

    return {
        path,
        table,
        style: grid ? { gridTemplateColumns: style.gridTemplateColumns } : undefined,
        slots: table
            ? []
            : [...element.children].map((child, index) => {
                  const width = child.getBoundingClientRect().width
                  const placement = gridPlacement(element, child, style, grid)
                  return {
                      path: [...path, index],
                      ...(row ? { rowSpan: Number(child.getAttribute("rowspan") ?? 1) } : {}),
                      row: placement.row,
                      style: grid
                          ? (placement.style ?? {})
                          : {
                                boxSizing: "border-box",
                                width,
                                minWidth: width,
                                maxWidth: width,
                                ...(flex ? { flex: `0 0 ${width}px` } : {}),
                            },
                  }
              }),
    }
}

/** Parallel branches share a vertical window, rather than consuming pages in DOM order. */
export function paginateAtoms(atoms: Atom[], height: number): Fragment[][] {
    const layouts = [...new Set(atoms.flatMap((atom) => atom.layouts ?? []))]
    const groups = textGroups(atoms)
    const assigned =
        layouts.length === 0
            ? paginateRects(
                  atoms.map((atom) => atom.rect),
                  height,
                  { groups },
              )
            : parallelPages(atoms, height, groups)

    return assigned.map((page) => {
        const fragments: Fragment[] = page.flatMap((index) => {
            const atom = atoms[index]
            return atom === undefined ? [] : [{ path: atom.path, text: atom.text }]
        })
        const content = [...fragments]
        for (const layout of layouts) {
            if (!content.some((fragment) => inside(fragment.path, layout.path))) continue
            const activeRows = layout.slots
                .filter((slot) => content.some((fragment) => inside(fragment.path, slot.path)))
                .flatMap((slot) => (slot.row === undefined ? [] : [slot.row]))
            const firstRow = Math.min(...activeRows.map((row) => row.start))
            const lastRow = Math.max(...activeRows.map((row) => row.end))
            fragments.push({
                path: layout.path,
                style:
                    activeRows.length === 0
                        ? layout.style
                        : {
                              ...layout.style,
                              gridTemplateRows: `repeat(${lastRow - firstRow}, auto)`,
                              gridTemplateAreas: "none",
                          },
            })
            for (const slot of layout.table === true ? tableSlots(layout.slots, content) : layout.slots) {
                if (slot.row !== undefined && (slot.row.end <= firstRow || slot.row.start >= lastRow)) continue
                const empty = slot.structural !== true && !content.some((fragment) => inside(fragment.path, slot.path))
                const style =
                    slot.row === undefined
                        ? slot.style
                        : {
                              ...slot.style,
                              gridRowStart: Math.max(slot.row.start, firstRow) - firstRow + 1,
                              gridRowEnd: Math.min(slot.row.end, lastRow) - firstRow + 1,
                          }
                fragments.push({ ...slot, rowSpan: layout.table === true ? slot.rowSpan : undefined, style, empty })
            }
        }
        return fragments
    })
}

function gridPlacement(
    parent: Element,
    child: Element,
    style: CSSStyleDeclaration,
    grid: boolean,
): { row?: { start: number; end: number }; style?: CSSProperties } {
    if (!grid) return {}
    const parentRect = parent.getBoundingClientRect()
    const rect = child.getBoundingClientRect()
    const row = trackRange(
        style.gridTemplateRows,
        style.rowGap,
        parentRect.top + (Number.parseFloat(style.borderTopWidth) || 0) + (Number.parseFloat(style.paddingTop) || 0),
        rect.top,
        rect.bottom,
    )
    const column = trackRange(
        style.gridTemplateColumns,
        style.columnGap,
        parentRect.left + (Number.parseFloat(style.borderLeftWidth) || 0) + (Number.parseFloat(style.paddingLeft) || 0),
        rect.left,
        rect.right,
    )
    return {
        row,
        style: column === undefined ? undefined : { gridColumnStart: column.start + 1, gridColumnEnd: column.end + 1 },
    }
}

function trackRange(
    template: string,
    spacing: string,
    origin: number,
    from: number,
    to: number,
): { start: number; end: number } | undefined {
    const tracks = template
        .replace(/\[[^\]]*\]/g, "")
        .trim()
        .split(/\s+/)
        .map(Number.parseFloat)
    if (tracks.length === 0 || tracks.some((track) => !Number.isFinite(track))) return undefined
    const gap = Number.parseFloat(spacing) || 0
    let top = origin
    let start = 0
    let end = tracks.length
    for (const [index, height] of tracks.entries()) {
        if (from >= top - 1) start = index
        if (to <= top + height + 1) {
            end = index + 1
            break
        }
        top += height + gap
    }
    return { start, end }
}

function inside(path: number[], parent: number[]): boolean {
    return parent.length <= path.length && parent.every((step, index) => step === path[index])
}

function parallelPages(atoms: Atom[], height: number, groups: (number | undefined)[]): number[][] {
    let remaining = atoms.map((_, index) => index)
    if (remaining.length === 0) return []
    if (!(height > 0)) return [remaining]
    const pages: number[][] = []
    while (remaining.length > 0) {
        const top = Math.min(...remaining.map((index) => atoms[index]?.rect.top ?? Infinity))
        let end = top + height
        let page = remaining.filter((index) => (atoms[index]?.rect.bottom ?? Infinity) <= end)
        // Moving a widow/orphan boundary applies to every parallel branch, not just its text run.
        while (page.length > 0) {
            const boundary = widowBoundary(atoms, remaining, page, groups)
            if (boundary >= end) break
            const adjusted = page.filter((index) => (atoms[index]?.rect.bottom ?? Infinity) <= boundary)
            if (adjusted.length === 0 || adjusted.length === page.length) break
            page = adjusted
            end = boundary
        }
        // Unsplittable oversized content must still make progress.
        if (page.length === 0) {
            const first = remaining.find((index) => atoms[index]?.rect.top === top)
            if (first === undefined) break
            page = [first]
        }
        pages.push(page)
        const kept = new Set(page)
        remaining = remaining.filter((index) => !kept.has(index))
    }
    return pages
}

function widowBoundary(atoms: Atom[], remaining: number[], page: number[], groups: (number | undefined)[]): number {
    let boundary = Infinity
    const selected = new Set(page)
    for (const group of new Set(page.map((index) => groups[index]))) {
        if (group === undefined) continue
        const run = remaining.filter((index) => groups[index] === group)
        const head = run.filter((index) => selected.has(index))
        const tail = run.length - head.length
        if (tail === 0) continue
        const move = head.length < 2 || (tail < 2 && head.length < 3) ? head[0] : tail < 2 ? head.at(-1) : undefined
        if (move !== undefined) boundary = Math.min(boundary, atoms[move]?.rect.top ?? Infinity)
    }
    return boundary
}
