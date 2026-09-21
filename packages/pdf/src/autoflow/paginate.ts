export type ItemRect = { top: number; bottom: number }

/**
 * Assigns items to pages given their positions inside one continuous column of content.
 *
 * Items are measured once, in a single uninterrupted layout, so their rects already account
 * for margins, collapsing and line breaking. Pagination is then a sliding window over that
 * column: a page starts at the top of its first item and accepts every following item whose
 * bottom edge still falls within `pageHeight`.
 *
 * An item taller than a whole page cannot be placed anywhere, so it is placed alone and
 * allowed to overflow rather than looping forever.
 *
 * @returns item indices per page.
 */
export function paginateRects(rects: ItemRect[], pageHeight: number): number[][] {
    const first = rects[0]
    if (first === undefined) return []
    // Without a usable page height (no layout available) everything stays on one page.
    if (!(pageHeight > 0)) return [rects.map((_, index) => index)]

    const pages: number[][] = []
    let current: number[] = []
    let offset = first.top

    for (let index = 0; index < rects.length; index++) {
        const rect = rects[index]
        if (rect === undefined) continue

        if (current.length > 0 && rect.bottom - offset > pageHeight) {
            pages.push(current)
            current = []
            offset = rect.top
        }
        current.push(index)
    }

    if (current.length > 0) pages.push(current)
    return pages
}
