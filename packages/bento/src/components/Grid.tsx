import { createElement, type CSSProperties, type HTMLAttributes } from "react"
import clsx from "clsx"
import { grid, type GridProps } from "../generators/grid"

export type GridComponentProps = GridProps & Omit<HTMLAttributes<HTMLDivElement>, keyof GridProps>

export function Grid({ columns, rows, areas, className, style, ...rest }: GridComponentProps) {
    const cssVars: Record<string, string> = {}

    if (columns !== undefined) {
        cssVars["--bento-grid-cols"] = typeof columns === "number" ? `repeat(${columns}, 1fr)` : columns
    }
    if (rows !== undefined) {
        cssVars["--bento-grid-rows"] = typeof rows === "number" ? `repeat(${rows}, 1fr)` : rows
    }
    if (areas !== undefined) {
        cssVars["--bento-grid-areas"] = areas.template
    }

    return createElement("div", {
        className: clsx(grid({ columns, rows, areas }), className),
        style: { ...(cssVars as CSSProperties), ...style },
        ...rest,
    })
}
