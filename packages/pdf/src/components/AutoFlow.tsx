import { Children, useCallback, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"
import { styled } from "@mochi-css/vanilla-react"
import { Page } from "./Page"
import { collectAtoms } from "../autoflow/collect"
import { paginateRects } from "../autoflow/paginate"
import { rebuild } from "../autoflow/nodes"
import type { PageMargin, PageOrientation, PageSize } from "../pageSizes"

// The probe must be laid out to be measurable, so it cannot be display:none. Clipping it to a
// zero-sized box keeps it out of both the visible flow and the printed output instead.
//
// Inline rather than extracted: a probe that escapes its clip renders as a full extra page and
// prints as an extra sheet, so it must not depend on the build step having run.
const PROBE_CLIP_STYLE: CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: 0,
    height: 0,
    overflow: "hidden",
    visibility: "hidden",
    pointerEvents: "none",
}

/** Marks its content as a unit that may not be split across a page break. */
export const KeepTogether = styled("div", { breakInside: "avoid" })

export type AutoFlowProps = {
    size?: PageSize
    orientation?: PageOrientation
    margin?: PageMargin
    children?: ReactNode
}

/**
 * Flows its content across as many pages as it needs, instead of requiring one page per
 * `<Page>`.
 *
 * The content is laid out once in an off-screen probe page, measured, and then split at the
 * finest break points the markup allows. Because the measurement is real browser layout, the
 * breaks match what the exported PDF will do.
 */
export function AutoFlow({ size, orientation, margin, children }: AutoFlowProps) {
    const probeRef = useRef<HTMLDivElement | null>(null)
    const [pages, setPages] = useState<number[][][]>([])

    const remeasure = useCallback(() => {
        const probe = probeRef.current
        if (probe === null) return

        const items = Children.toArray(children)
        const atoms = collectAtoms(items, probe)
        const assigned = paginateRects(
            atoms.map((atom) => atom.rect),
            contentBoxHeight(probe),
        )
        const next = assigned.map((page) =>
            page.flatMap((index) => (atoms[index] === undefined ? [] : [atoms[index].path])),
        )

        setPages((previous) => (samePages(previous, next) ? previous : next))
    }, [children])

    useLayoutEffect(() => {
        remeasure()
    }, [remeasure])

    // Content can settle after the first layout — images decoding, late webfonts, a resized
    // preview. Each of those changes where the breaks belong.
    useLayoutEffect(() => {
        const probe = probeRef.current
        if (probe === null || typeof ResizeObserver === "undefined") return

        const observer = new ResizeObserver(() => {
            remeasure()
        })
        observer.observe(probe)
        for (const child of probe.children) observer.observe(child)

        return () => {
            observer.disconnect()
        }
    }, [remeasure])

    useLayoutEffect(() => {
        const fonts = typeof document === "undefined" ? undefined : document.fonts
        if (fonts === undefined) return

        let cancelled = false
        void fonts.ready.then(() => {
            if (!cancelled) remeasure()
        })

        return () => {
            cancelled = true
        }
    }, [remeasure])

    const items = Children.toArray(children)

    return (
        <>
            <div aria-hidden="true" style={PROBE_CLIP_STYLE}>
                <Page
                    ref={probeRef}
                    size={size}
                    orientation={orientation}
                    margin={margin}
                    data-mochi-probe=""
                    style={{ overflow: "visible" }}
                >
                    {items}
                </Page>
            </div>
            {pages.map((paths, index) => (
                <Page key={index} size={size} orientation={orientation} margin={margin}>
                    {rebuild(items, paths)}
                </Page>
            ))}
        </>
    )
}

function contentBoxHeight(element: HTMLElement): number {
    const view = element.ownerDocument.defaultView
    if (view === null) return 0

    const style = view.getComputedStyle(element)
    const padding = toPx(style.paddingTop) + toPx(style.paddingBottom)
    return Math.max(element.clientHeight - padding, 0)
}

function toPx(value: string): number {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : 0
}

function samePages(a: number[][][], b: number[][][]): boolean {
    return a.length === b.length && a.every((page, index) => samePaths(page, b[index]))
}

function samePaths(a: number[][], b: number[][] | undefined): boolean {
    if (a.length !== b?.length) return false
    return a.every((path, index) => {
        const other = b[index]
        return path.length === other?.length && path.every((step, i) => step === other[i])
    })
}
