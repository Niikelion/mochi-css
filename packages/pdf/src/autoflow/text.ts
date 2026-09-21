import type { ItemRect } from "./paginate"
import type { TextRange } from "./nodes"

export type TextLine = TextRange & { rect: ItemRect }

const TEXT_NODE = 3
/** Line tops can differ by a sub-pixel from the rect the browser reports for the line box. */
const EPSILON = 1

/**
 * Splits an element's text into its rendered lines.
 *
 * The browser has already broken the text into lines, so the line boxes are read back from it
 * rather than re-derived — which is the only way a break can land where the PDF will put it.
 * `getClientRects()` gives one rect per line but no character offsets, so each line's starting
 * offset is found by bisecting for the first character that sits on it.
 *
 * Returns null when the element is not a single run of text, or renders as one line and so offers
 * no break point.
 */
export function measureTextLines(element: Element): TextLine[] | null {
    if (element.childNodes.length !== 1) return null

    const textNode = element.firstChild
    if (textNode?.nodeType !== TEXT_NODE) return null

    const content = textNode.nodeValue ?? ""
    if (content.length === 0) return null

    const range = element.ownerDocument.createRange()
    range.selectNodeContents(textNode)

    const lineRects = [...range.getClientRects()]
    // One line (or a browser that does no layout) leaves nothing to split.
    if (lineRects.length <= 1) return null

    const lines: TextLine[] = []
    let start = 0

    for (let index = 0; index < lineRects.length; index++) {
        const rect = lineRects[index]
        if (rect === undefined) continue

        const next = lineRects[index + 1]
        const end =
            next === undefined ? content.length : firstOffsetAtOrBelow(range, textNode, next.top, start, content.length)

        // A line we cannot locate offsets for would silently drop or duplicate text.
        if (end <= start) return null

        lines.push({ start, end, rect: { top: rect.top, bottom: rect.bottom } })
        start = end
    }

    return lines.length > 1 ? lines : null
}

/** Smallest offset in `(low, high]` whose character renders at or below `top`. */
function firstOffsetAtOrBelow(range: Range, textNode: ChildNode, top: number, low: number, high: number): number {
    let lo = low
    let hi = high

    while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2)
        if (offsetTop(range, textNode, mid, high) >= top - EPSILON) hi = mid
        else lo = mid + 1
    }

    return lo
}

function offsetTop(range: Range, textNode: ChildNode, offset: number, length: number): number {
    range.setStart(textNode, offset)
    range.setEnd(textNode, Math.min(offset + 1, length))
    return range.getBoundingClientRect().top
}
