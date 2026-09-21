import { createContext } from "react"
import type { PageMargin, PageOrientation, PageSize } from "../pageSizes"
import type { PageSlot } from "./pageSlots"

export type DocumentDefaults = {
    size: PageSize
    orientation: PageOrientation
    margin: PageMargin
    header?: PageSlot
    footer?: PageSlot
    /** Pages counted so far; 0 until the document has been laid out once. */
    pageCount: number
    /**
     * Changes whenever the document's pages change, including rearrangements that leave the
     * count the same — which a page's own number still depends on.
     */
    layoutVersion: number
}

export const DEFAULT_DOCUMENT: DocumentDefaults = {
    size: "a4",
    orientation: "portrait",
    margin: 0,
    pageCount: 0,
    layoutVersion: 0,
}

export const DocumentContext = createContext(DEFAULT_DOCUMENT)
