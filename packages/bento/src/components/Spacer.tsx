import { createElement, type HTMLAttributes } from "react"
import clsx from "clsx"
import { spacer } from "../generators/spacer"

export type SpacerProps = HTMLAttributes<HTMLDivElement>

export function Spacer({ className, ...rest }: SpacerProps) {
    return createElement("div", { className: clsx(spacer(), className), ...rest })
}
