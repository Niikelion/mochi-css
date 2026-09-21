import { useLayoutEffect, useRef, useState, type ComponentPropsWithRef } from "react"
import { styled } from "@mochi-css/vanilla-react"
import { DocumentContext } from "./context"
import { PAGE_SELECTOR } from "./Page"
import type { PageSlot } from "./pageSlots"
import { resolvePageSize, type PageMargin, type PageOrientation, type PageSize } from "../pageSizes"

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
    /** Running content at the top of every page. Given the page's number and the total. */
    header?: PageSlot
    /** Running content at the foot of every page. Given the page's number and the total. */
    footer?: PageSlot
}

/**
 * Root of a printable document. Supplies page defaults to every descendant page and lays
 * them out as a stack of page-shaped boxes.
 */
export function Document({
    size = "a4",
    orientation = "portrait",
    margin = 0,
    header,
    footer,
    children,
    ...rest
}: DocumentProps) {
    const sheet = resolvePageSize(size, orientation)
    const rootRef = useRef<HTMLDivElement | null>(null)
    const pageCount = usePageCount(rootRef)

    return (
        <DocumentContext.Provider value={{ size, orientation, margin, header, footer, pageCount }}>
            {/* Sizes the printed sheet to match the page boxes. Margins live inside the box as
                padding, so the sheet itself takes none. This also makes printing straight from
                the browser produce the same result as exporting. */}
            <style>{`@page { size: ${sheet.width} ${sheet.height}; margin: 0 }`}</style>
            <DocumentRoot {...rest} ref={rootRef} data-mochi-document="">
                {children}
            </DocumentRoot>
        </DocumentContext.Provider>
    )
}

/**
 * How many pages the document currently has.
 *
 * A document's length is a result of laying it out, not something known while rendering it —
 * flowed content decides how many pages it needs. The count is therefore read back from the
 * rendered pages, and watched, since a flow settles after its first paint.
 */
function usePageCount(ref: React.RefObject<HTMLDivElement | null>): number {
    const [pageCount, setPageCount] = useState(0)

    useLayoutEffect(() => {
        const root = ref.current
        if (root === null) return

        const update = () => {
            const count = root.querySelectorAll(PAGE_SELECTOR).length
            setPageCount((previous) => (previous === count ? previous : count))
        }

        update()

        if (typeof MutationObserver === "undefined") return
        const observer = new MutationObserver(update)
        observer.observe(root, { childList: true, subtree: true })

        return () => {
            observer.disconnect()
        }
    }, [ref])

    return pageCount
}
