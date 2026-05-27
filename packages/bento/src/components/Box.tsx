import { createElement, type HTMLAttributes } from "react"
import clsx from "clsx"
import { box } from "../generators/box"

export type BoxProps = HTMLAttributes<HTMLDivElement>

export function Box({ className, ...rest }: BoxProps) {
    return createElement("div", { className: clsx(box(), className), ...rest })
}
