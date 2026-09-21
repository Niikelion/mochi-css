import type { ReactNode } from "react"

/** Where a page sits in the finished document. */
export type PageInfo = {
    /** 1-based position of this page. */
    pageNumber: number
    /** Total pages in the document, known only once every page has been laid out. */
    pageCount: number
}

/** Running content for a page: fixed, or derived from the page's position. */
export type PageSlot = ReactNode | ((info: PageInfo) => ReactNode)

export function renderSlot(slot: PageSlot | undefined, info: PageInfo): ReactNode {
    if (slot === undefined) return undefined
    // ReactNode is never a function, so this cannot misread a valid node.
    return typeof slot === "function" ? slot(info) : slot
}
