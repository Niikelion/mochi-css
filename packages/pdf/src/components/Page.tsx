import {
    useCallback,
    useContext,
    useLayoutEffect,
    useRef,
    useState,
    type ComponentPropsWithRef,
    type CSSProperties,
} from "react"
import { styled } from "@mochi-css/vanilla-react"
import { DocumentContext } from "./context"
import { renderSlot, type PageSlot } from "./pageSlots"
import { resolvePageMargin, resolvePageSize, type PageMargin, type PageOrientation, type PageSize } from "../pageSizes"

export const PAGE_SELECTOR = "[data-mochi-page]:not([data-mochi-probe])"

// Only appearance lives in extracted CSS. Everything that decides where content breaks or where
// a sheet ends is inline, because it has to hold wherever this renders — the build step may not
// have run, and a page that silently loses its geometry paginates wrongly rather than visibly.
const PageBox = styled("div", {
    background: "#fff",
    "@media screen": { boxShadow: "0 1px 4px rgba(0, 0, 0, 0.25)" },
})

const PAGE_LAYOUT_STYLE: CSSProperties = {
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    overflow: "hidden",
}

export type PageProps = Omit<ComponentPropsWithRef<"div">, "style"> & {
    size?: PageSize
    orientation?: PageOrientation
    margin?: PageMargin
    /** Overrides the document's running header for this page. */
    header?: PageSlot
    /** Overrides the document's running footer for this page. */
    footer?: PageSlot
    style?: CSSProperties
}

/**
 * A single page of a {@link Document}, rendered as a real fixed-size box so the on-screen
 * preview matches the exported PDF.
 */
export function Page({ size, orientation, margin, header, footer, style, children, ...rest }: PageProps) {
    const document = useContext(DocumentContext)
    const { width, height } = resolvePageSize(size ?? document.size, orientation ?? document.orientation)
    const padding = resolvePageMargin(margin ?? document.margin)

    const boxRef = useRef<HTMLDivElement | null>(null)
    const mergedRef = useMergedRef(boxRef, rest.ref)
    const pageNumber = usePageNumber(boxRef, document.layoutVersion)
    const info = { pageNumber, pageCount: document.pageCount }

    const headerContent = renderSlot(header ?? document.header, info)
    const footerContent = renderSlot(footer ?? document.footer, info)

    // A break after the final page would emit a trailing blank sheet.
    const isLast = document.pageCount > 0 && pageNumber === document.pageCount

    return (
        <PageBox
            {...rest}
            ref={mergedRef}
            data-mochi-page=""
            style={{
                ...PAGE_LAYOUT_STYLE,
                width,
                height,
                padding,
                breakAfter: isLast ? "auto" : "page",
                ...style,
            }}
        >
            {headerContent === undefined ? null : <div data-mochi-page-header="">{headerContent}</div>}
            {/* flex-basis 0 with min-height 0 makes this exactly the space the header and footer
                leave, which is the height the reflow has to fill. */}
            <div data-mochi-page-content="" style={{ flex: "1 1 0%", minHeight: 0 }}>
                {children}
            </div>
            {footerContent === undefined ? null : <div data-mochi-page-footer="">{footerContent}</div>}
        </PageBox>
    )
}

/**
 * This page's 1-based position among the document's pages.
 *
 * Taken from the rendered order rather than tracked in React, because the pages a document ends up
 * with are only known after content has been flowed into them. Recomputed whenever the document's
 * pages change, which is what a flow settling looks like from here.
 */
function usePageNumber(ref: React.RefObject<HTMLDivElement | null>, layoutVersion: number): number {
    const [pageNumber, setPageNumber] = useState(0)

    useLayoutEffect(() => {
        const element = ref.current
        // The probe page is a measuring device, not part of the document.
        if (element === null || element.hasAttribute("data-mochi-probe")) return

        const root = element.closest("[data-mochi-document]")
        if (root === null) return

        const index = [...root.querySelectorAll(PAGE_SELECTOR)].indexOf(element)
        if (index < 0) return

        setPageNumber((previous) => (previous === index + 1 ? previous : index + 1))
    }, [ref, layoutVersion])

    return pageNumber
}

/**
 * Keeps an internal ref alongside one the caller passed.
 *
 * Memoised because React detaches and reattaches a callback ref whenever its identity changes,
 * which for a new closure every render means on every render. The forwarded ref's return value is
 * passed back so a cleanup-style ref still gets cleaned up.
 */
function useMergedRef(
    own: React.RefObject<HTMLDivElement | null>,
    forwarded: React.Ref<HTMLDivElement> | undefined,
): React.RefCallback<HTMLDivElement> {
    return useCallback(
        (element: HTMLDivElement | null) => {
            own.current = element
            if (typeof forwarded === "function") return forwarded(element) as void
            if (forwarded !== null && forwarded !== undefined) forwarded.current = element
        },
        [own, forwarded],
    )
}
