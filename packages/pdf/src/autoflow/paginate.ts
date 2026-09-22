export type ItemRect = { top: number; bottom: number }

export type PaginateOptions = {
    /**
     * Group id per item. Items sharing an id are lines of one breakable run, and a break landing
     * between them is subject to {@link PaginateOptions.minLines}. Items with no id break freely.
     */
    groups?: (number | undefined)[]
    /** Fewest lines of a run allowed on either side of a break. Default: 2. */
    minLines?: number
}

/**
 * Assigns items to pages given their positions inside one continuous column of content.
 *
 * Items are measured once, in a single uninterrupted layout, so their rects already account for
 * margins, collapsing and line breaking. Pagination is then a sliding window over that column: a
 * page starts at the top of its first item and accepts every following item whose bottom edge
 * still falls within `pageHeight`.
 *
 * An item taller than a whole page cannot be placed anywhere, so it is placed alone and allowed to
 * overflow rather than looping forever.
 *
 * @returns item indices per page.
 */
export function paginateRects(rects: ItemRect[], pageHeight: number, options: PaginateOptions = {}): number[][] {
    const first = rects[0]
    if (first === undefined) return []
    // Without a usable page height (no layout available) everything stays on one page.
    if (!(pageHeight > 0)) return [rects.map((_, index) => index)]

    const { groups = [], minLines = 2 } = options
    const pages: number[][] = []

    let pageStart = 0
    let offset = first.top
    let index = 0

    while (index < rects.length) {
        const rect = rects[index]
        if (rect === undefined) {
            index++
            continue
        }

        if (index > pageStart && rect.bottom - offset > pageHeight) {
            const breakAt = chooseBreak(pageStart, index, groups, minLines)
            const start = rects[breakAt]

            pages.push(indices(pageStart, breakAt))
            pageStart = breakAt
            offset = start === undefined ? offset : start.top
            // Re-examine from the new page's first item rather than the one that did not fit,
            // since honouring the minimum may have pushed earlier items onto this page too.
            index = breakAt
            continue
        }

        index++
    }

    pages.push(indices(pageStart, rects.length))
    return pages
}

/**
 * Where the page should end, given that `breakIndex` is the first item that did not fit.
 *
 * A break inside a run may not strand fewer than `minLines` of it on either side, so the break
 * moves earlier — never later, which would overflow the page. Moving earlier is always safe: the
 * next page is then filled from that point by the same greedy pass.
 */
function chooseBreak(pageStart: number, breakIndex: number, groups: (number | undefined)[], minLines: number): number {
    const group = groups[breakIndex]
    if (group === undefined) return breakIndex

    let headStart = breakIndex
    while (headStart > pageStart && groups[headStart - 1] === group) headStart--

    const headCount = breakIndex - headStart
    // The break already falls at the run's first line, so nothing is stranded behind it.
    if (headCount === 0) return breakIndex

    let tailEnd = breakIndex
    while (tailEnd < groups.length && groups[tailEnd] === group) tailEnd++
    const tailCount = tailEnd - breakIndex

    const moved = linesToMove(headCount, tailCount, minLines)
    const adjusted = breakIndex - moved
    // Never empty the page: an orphan beats a blank sheet and an endless loop.
    return adjusted <= pageStart ? breakIndex : adjusted
}

function linesToMove(headCount: number, tailCount: number, minLines: number): number {
    // Too few lines left behind: move the whole run to the next page.
    if (headCount < minLines) return headCount

    if (tailCount >= minLines) return 0

    // Too few carried over: move just enough, unless doing so would strand the head instead.
    const needed = minLines - tailCount
    return headCount - needed >= minLines ? needed : headCount
}

function indices(from: number, to: number): number[] {
    const out: number[] = []
    for (let index = from; index < to; index++) out.push(index)
    return out
}
