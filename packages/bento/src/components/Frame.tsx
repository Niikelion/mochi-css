import { createElement, type HTMLAttributes } from "react"
import clsx from "clsx"
import { frame, type FrameProps } from "../generators/frame"

export type FrameComponentProps = FrameProps & Omit<HTMLAttributes<HTMLDivElement>, keyof FrameProps>

export function Frame({ row, col, alignX, alignY, className, ...rest }: FrameComponentProps) {
    return createElement("div", {
        className: clsx(frame({ row, col, alignX, alignY }), className),
        ...rest,
    })
}
