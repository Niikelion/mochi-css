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
    const { pageCount, layoutVersion } = usePageLayout(rootRef)

    return (
        <DocumentContext.Provider value={{ size, orientation, margin, header, footer, pageCount, layoutVersion }}>
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
 * The document's pages as they currently stand.
 *
 * A document's length is a result of laying it out, not something known while rendering it —
 * flowed content decides how many pages it needs. The pages are therefore read back from what
 * rendered, and watched, since a flow settles after its first paint.
 *
 * The version changes whenever the pages themselves change, not merely how many there are: two
 * flows where one gains a page as another loses one leaves the count alone while every number
 * after that point moves.
 */
function usePageLayout(ref: React.RefObject<HTMLDivElement | null>): { pageCount: number; layoutVersion: number } {
    const [layout, setLayout] = useState({ pageCount: 0, layoutVersion: 0 })
    const seen = useRef<Element[]>([])

    useLayoutEffect(() => {
        const root = ref.current
        if (root === null) return

        const update = () => {
            const pages = [...root.querySelectorAll(PAGE_SELECTOR)]
            if (samePages(pages, seen.current)) return

            seen.current = pages
            setLayout((previous) => ({ pageCount: pages.length, layoutVersion: previous.layoutVersion + 1 }))
        }

        update()

        if (typeof MutationObserver === "undefined") return
        const observer = new MutationObserver(update)
        observer.observe(root, { childList: true, subtree: true })

        return () => {
            observer.disconnect()
        }
    }, [ref])

    return layout
}

function samePages(a: Element[], b: Element[]): boolean {
    return a.length === b.length && a.every((element, index) => element === b[index])
}
