import type { Fragment } from "./nodes"
import type { ParallelLayout } from "./parallel"

/** Retain only used rows plus the origins of cells spanning into those rows. */
export function tableSlots(slots: ParallelLayout["slots"], content: Fragment[]): ParallelLayout["slots"] {
    const rows = slots.filter((slot) => slot.structural === true)
    const active = new Set(rows.filter((row) => content.some((fragment) => inside(fragment.path, row.path))))
    const retained = new Set(active)
    const covered = (slot: ParallelLayout["slots"][number]) => {
        const start = rows.findIndex((row) => row.path === slot.tableRow)
        const section = slot.tableRow?.slice(0, -1) ?? []
        return rows
            .slice(start)
            .filter((row, offset) => inside(row.path, section) && (slot.rowSpan === 0 || offset < (slot.rowSpan ?? 1)))
    }
    for (const slot of slots) {
        if (slot.rowSpan === undefined || !covered(slot).some((row) => active.has(row))) continue
        const origin = rows.find((row) => row.path === slot.tableRow)
        if (origin !== undefined) retained.add(origin)
    }
    return slots
        .filter((slot) => rows.some((row) => row.path === slot.tableRow && retained.has(row)))
        .map((slot) => ({
            ...slot,
            // Removing finished rows must not extend a rowspan into an unrelated following row.
            rowSpan: slot.rowSpan === undefined ? undefined : covered(slot).filter((row) => retained.has(row)).length,
        }))
}

function inside(path: number[], parent: number[]): boolean {
    return parent.length <= path.length && parent.every((step, index) => step === path[index])
}
