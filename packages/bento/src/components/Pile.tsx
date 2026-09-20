import { createElement, type HTMLAttributes } from "react"
import clsx from "clsx"
import { pile } from "../generators/pile"

export type PileProps = HTMLAttributes<HTMLDivElement>

export function Pile({ className, ...rest }: PileProps) {
    return createElement("div", {
        className: clsx(pile(), className),
        ...rest,
    })
}
