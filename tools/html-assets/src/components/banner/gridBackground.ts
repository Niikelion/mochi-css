import type { CSSProperties } from "react"

export interface GridBackgroundOptions {
    /** Cell size in px. Default: 62. Override at runtime via --grid-cell. */
    cell?: number
    /** Base background color. Default: #0d0d0f. Override via --grid-bg. */
    bg?: string
    /** Main grid horizontal line color. Default: #1e1c18. Override via --grid-main-h. */
    mainH?: string
    /** Main grid vertical line color. Default: #1a1814. Override via --grid-main-v. */
    mainV?: string
    /** Sub-grid horizontal line color. Default: #161412. Override via --grid-sub-h. */
    subH?: string
    /** Sub-grid vertical line color. Default: #131210. Override via --grid-sub-v. */
    subV?: string
    /** Line thickness in px. Default: 0.5. Override at runtime via --grid-line-width. */
    lineWidth?: number
}

/**
 * Returns React CSSProperties that paint a two-layer repeating grid using
 * only CSS gradients. The grid is always centered on the element — main lines
 * intersect at the element's center, sub-grid lines sit half a cell away.
 *
 * CSS custom properties for runtime overrides:
 *   --grid-cell, --grid-line-width, --grid-bg
 *   --grid-main-h, --grid-main-v
 *   --grid-sub-h,  --grid-sub-v
 */
export function gridBackground({
    cell = 62,
    bg = '#0d0d0f',
    mainH = '#1e1c18',
    mainV = '#1a1814',
    subH = '#161412',
    subV = '#131210',
    lineWidth = 1,
}: GridBackgroundOptions = {}): CSSProperties {
    // Line is placed at the midpoint of each tile using hard color stops.
    // background-position: 50% aligns that midpoint with the element's center.
    const half = lineWidth / 2
    const line = (dir: 'bottom' | 'right', color: string) =>
        `linear-gradient(to ${dir}, transparent calc(50% - ${half}px), ${color} calc(50% - ${half}px), ${color} calc(50% + ${half}px), transparent calc(50% + ${half}px))`

    return {
        // CSS vars exposed for runtime overrides (e.g. via inline style)
        '--grid-cell': `${cell}px`,
        '--grid-line-width': `${lineWidth}px`,
        '--grid-bg': bg,
        '--grid-main-h': mainH,
        '--grid-main-v': mainV,
        '--grid-sub-h': subH,
        '--grid-sub-v': subV,

        backgroundColor: bg,
        backgroundImage: [
            line('bottom', mainH),
            line('right',  mainV),
            line('bottom', subH),
            line('right',  subV),
        ].join(', '),
        backgroundSize: [
            `100% ${cell}px`,   // main H
            `${cell}px 100%`,   // main V
            `100% ${cell}px`,   // sub  H
            `${cell}px 100%`,   // sub  V
        ].join(', '),
        backgroundPosition: [
            '0 50%',                          // main H — centered
            '50% 0',                          // main V — centered
            `0 calc(50% + ${cell / 2}px)`,    // sub  H — half cell down
            `calc(50% + ${cell / 2}px) 0`,    // sub  V — half cell right
        ].join(', '),
        backgroundRepeat: 'repeat',
    } as CSSProperties
}