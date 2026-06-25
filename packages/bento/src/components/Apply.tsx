import { isValidElement, cloneElement, type ReactNode, type ReactElement } from "react"
import clsx from "clsx"

export interface ApplyProps {
    class: string
    children?: ReactNode
}

export function Apply({ class: className, children }: ApplyProps) {
    if (!isValidElement(children)) return <>{children}</>
    const child = children as ReactElement<{ className?: string }>
    return cloneElement(child, {
        className: clsx(child.props.className, className),
    })
}
