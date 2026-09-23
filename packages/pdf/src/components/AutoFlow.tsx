import {
    useCallback,
    useLayoutEffect,
    useRef,
    useState,
    type ComponentPropsWithRef,
    type CSSProperties,
    type ReactNode,
} from "react"
import { Page } from "./Page"
import { collectAtoms } from "../autoflow/collect"
import { paginateAtoms } from "../autoflow/parallel"
import { normalizeItems, rebuild, type Fragment } from "../autoflow/nodes"
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

/**
 * Marks its content as a unit that may not be split across a page break.
 *
 * Inline rather than extracted, for the same reason as the probe clip: silently losing the
 * guarantee wherever the build step has not run would be worse than the extra attribute.
 * Any element carrying `break-inside: avoid` from ordinary CSS is honoured too.
 */
export function KeepTogether({ style, ...rest }: ComponentPropsWithRef<"div">) {
    return <div {...rest} data-mochi-keep-together="" style={{ ...style, breakInside: "avoid" }} />
}

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
    const [pages, setPages] = useState<Fragment[][]>([])

    const remeasure = useCallback(() => {
        const probe = probeRef.current
        if (probe === null) return

        // Measure the content area, not the whole page: a running header and footer take space
        // the flowed content cannot use, and the flex layout has already subtracted it.
        const content = probe.querySelector("[data-mochi-page-content]")
        if (content === null) return

        const items = normalizeItems(children)
        const atoms = collectAtoms(items, content)

        // Nothing here can be paired with its measurement, so keep the content whole on one page.
        // It overflows, which is visible and fixable, rather than paginating it wrongly.
        if (atoms === null) {
            warnUnmeasurable()
            const fallback = [items.map((_, index) => ({ path: [index] }))]
            setPages((previous) => (samePages(previous, fallback) ? previous : fallback))
            return
        }

        const next = paginateAtoms(atoms, contentBoxHeight(content))

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

        const content = probe.querySelector("[data-mochi-page-content]")
        for (const child of content?.children ?? []) observer.observe(child)

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

    const items = normalizeItems(children)

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
            {pages.map((fragments, index) => (
                <Page key={index} size={size} orientation={orientation} margin={margin}>
                    {rebuild(items, fragments)}
                </Page>
            ))}
        </>
    )
}

let warnedUnmeasurable = false

function warnUnmeasurable(): void {
    if (warnedUnmeasurable) return
    warnedUnmeasurable = true
    console.warn(
        "[@mochi-css/pdf] AutoFlow could not match its children to what they rendered, so its content is on a single page. " +
            "This happens when a child renders nothing, renders a fragment of several elements, or renders into a portal. " +
            "Give each child a single element of its own to make it flowable.",
    )
}

function contentBoxHeight(element: Element): number {
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

function samePages(a: Fragment[][], b: Fragment[][]): boolean {
    return a.length === b.length && a.every((page, index) => samePage(page, b[index]))
}

function samePage(a: Fragment[], b: Fragment[] | undefined): boolean {
    if (a.length !== b?.length) return false
    return a.every((fragment, index) => sameFragment(fragment, b[index]))
}

function sameFragment(a: Fragment, b: Fragment | undefined): boolean {
    if (b === undefined) return false
    if (a.empty !== b.empty || a.rowSpan !== b.rowSpan || JSON.stringify(a.style) !== JSON.stringify(b.style))
        return false
    if (a.text?.start !== b.text?.start || a.text?.end !== b.text?.end) return false
    return a.path.length === b.path.length && a.path.every((step, index) => step === b.path[index])
}
