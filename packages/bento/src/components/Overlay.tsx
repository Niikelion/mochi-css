import { createElement, type HTMLAttributes } from "react"
import clsx from "clsx"
import { overlay, type OverlayProps } from "../generators/overlay"

export type OverlayComponentProps = OverlayProps & Omit<HTMLAttributes<HTMLDivElement>, keyof OverlayProps>

export function Overlay({ alignX, alignY, className, ...rest }: OverlayComponentProps) {
    return createElement("div", {
        className: clsx(overlay({ alignX, alignY }), className),
        ...rest,
    })
}
