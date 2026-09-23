import { expect, it } from "vitest"
import { tableSlots } from "./table"
import type { ParallelLayout } from "./parallel"

it("retains a rowspan origin, removes finished rows, and shortens the span before unrelated rows", () => {
    const rows = [0, 1, 2, 3].map((index) => [0, 0, index])
    const slots: ParallelLayout["slots"] = rows.flatMap((path, index) => [
        { path, tableRow: path, structural: true, style: {} },
        { path: [...path, 0], tableRow: path, rowSpan: index === 0 ? 3 : 1, style: {} },
    ])
    const selected = tableSlots(slots, [{ path: [0, 0, 2, 0] }, { path: [0, 0, 3, 0] }])
    expect(selected.filter((slot) => slot.structural).map((slot) => slot.path)).toEqual([rows[0], rows[2], rows[3]])
    expect(selected.find((slot) => slot.path.length === 4)?.rowSpan).toBe(2)
})
