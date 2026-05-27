import { createElement, type HTMLAttributes } from "react"
import clsx from "clsx"
import { divider, type DividerProps } from "../generators/divider"

export type DividerComponentProps = DividerProps & Omit<HTMLAttributes<HTMLDivElement>, keyof DividerProps>

export function Divider({ vertical, className, ...rest }: DividerComponentProps) {
    return createElement("div", {
        className: clsx(divider({ vertical }), className),
        ...rest,
    })
}
