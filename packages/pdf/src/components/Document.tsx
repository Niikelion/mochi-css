import type { ComponentPropsWithRef } from "react"
import { styled } from "@mochi-css/vanilla-react"
import { DocumentContext } from "./context"
import type { PageMargin, PageOrientation, PageSize } from "../pageSizes"

const DocumentRoot = styled("div", {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    "@media screen": { gap: "16px", padding: "16px" },
})

export type DocumentProps = ComponentPropsWithRef<"div"> & {
    /** Default page size for every child page; individual pages may override it. */
    size?: PageSize
    orientation?: PageOrientation
    margin?: PageMargin
}

/**
 * Root of a printable document. Supplies page defaults to every descendant page and lays
 * them out as a stack of page-shaped boxes.
 */
export function Document({ size = "a4", orientation = "portrait", margin = 0, children, ...rest }: DocumentProps) {
    return (
        <DocumentContext.Provider value={{ size, orientation, margin }}>
            <DocumentRoot {...rest} data-mochi-document="">
                {children}
            </DocumentRoot>
        </DocumentContext.Provider>
    )
}
