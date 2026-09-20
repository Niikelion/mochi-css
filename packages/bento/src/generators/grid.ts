import { css } from "@mochi-css/vanilla"

export type SpanCell<N extends string> = {
    readonly __span: true
    readonly name: N
    readonly count: number
}

export type GridAreas<Names extends string> = {
    readonly template: string
} & Readonly<Record<Names, string>>

type Cell = string | SpanCell<string> | null

type ExtractCellName<C> = C extends string ? C : C extends SpanCell<infer N> ? N : never
type ExtractNames<Rows extends Cell[][]> = ExtractCellName<Rows[number][number]>

export interface GridProps {
    columns?: number | string
    rows?: number | string
    areas?: GridAreas<string>
}

// Dynamic column/row/area values are applied via CSS custom properties set
// by the Grid component. The base class just activates grid layout.
const _grid = css({
    display: "grid",
    gridTemplateColumns: "var(--bento-grid-cols, none)",
    gridTemplateRows: "var(--bento-grid-rows, none)",
    gridTemplateAreas: "var(--bento-grid-areas, none)",
})

function gridImpl(props: GridProps): string {
    // props are consumed by the Grid component to set CSS custom properties;
    // here we just return the base grid class
    void props
    return _grid.variant({})
}

function span<N extends string>(count: number, name: N): SpanCell<N> {
    return { __span: true as const, name, count }
}

function areas<const Rows extends Cell[][]>(rows: Rows): GridAreas<ExtractNames<Rows>> {
    const expanded: string[][] = rows.map((row) =>
        row.flatMap((cell) => {
            if (cell === null) return ["."]
            if (typeof cell === "object") return Array.from<string>({ length: cell.count }).fill(cell.name)
            return [cell]
        }),
    )

    if (process.env["NODE_ENV"] !== "production") {
        const firstLen = expanded[0]?.length ?? 0
        for (let i = 1; i < expanded.length; i++) {
            const rowLen = expanded[i]?.length ?? 0
            if (rowLen !== firstLen) {
                console.warn(`[bento] grid.areas: row ${i} has ${rowLen} column(s) but expected ${firstLen}`)
            }
        }
    }

    const template = expanded.map((row) => `"${row.join(" ")}"`).join(" ")

    const names: Record<string, string> = {}
    for (const row of expanded) {
        for (const cell of row) {
            if (cell !== ".") names[cell] = cell
        }
    }

    return { template, ...names } as GridAreas<ExtractNames<Rows>>
}

export type GridFunction = {
    (props: GridProps): string
    areas: typeof areas
    span: typeof span
}

export const grid: GridFunction = Object.assign(gridImpl, { areas, span })
