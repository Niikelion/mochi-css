import { createContext } from "react"
import type { PageMargin, PageOrientation, PageSize } from "../pageSizes"

export type DocumentDefaults = {
    size: PageSize
    orientation: PageOrientation
    margin: PageMargin
}

export const DEFAULT_DOCUMENT: DocumentDefaults = {
    size: "a4",
    orientation: "portrait",
    margin: 0,
}

export const DocumentContext = createContext(DEFAULT_DOCUMENT)
