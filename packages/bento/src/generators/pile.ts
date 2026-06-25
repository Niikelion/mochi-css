import { css } from "@mochi-css/vanilla"
import clsx from "clsx"

export interface PileItemProps {
    alignX?: "start" | "center" | "end" | "stretch"
    alignY?: "start" | "center" | "end" | "stretch"
}

// Stack all children in the same grid cell. The first child defines the
// container dimensions; all children share the same 1×1 grid cell.
const _pileBase = css({
    display: "grid",
    "& > *": { gridColumn: "1", gridRow: "1" },
})

// justify-self classes for pile items
const _ijStart = css({ justifySelf: "start" })
const _ijCenter = css({ justifySelf: "center" })
const _ijEnd = css({ justifySelf: "end" })
const _ijStretch = css({ justifySelf: "stretch" })

// align-self classes for pile items
const _iaStart = css({ alignSelf: "start" })
const _iaCenter = css({ alignSelf: "center" })
const _iaEnd = css({ alignSelf: "end" })
const _iaStretch = css({ alignSelf: "stretch" })

function justifySelfClass(a: PileItemProps["alignX"]): string {
    switch (a) {
        case "start":
            return _ijStart.variant({})
        case "center":
            return _ijCenter.variant({})
        case "end":
            return _ijEnd.variant({})
        case "stretch":
            return _ijStretch.variant({})
        default:
            return ""
    }
}

function alignSelfClass(a: PileItemProps["alignY"]): string {
    switch (a) {
        case "start":
            return _iaStart.variant({})
        case "center":
            return _iaCenter.variant({})
        case "end":
            return _iaEnd.variant({})
        case "stretch":
            return _iaStretch.variant({})
        default:
            return ""
    }
}

function pileImpl(): string {
    return _pileBase.variant({})
}

function pileItem(props: PileItemProps): string {
    return clsx(justifySelfClass(props.alignX), alignSelfClass(props.alignY))
}

export type PileFunction = {
    (): string
    item: (props: PileItemProps) => string
}

export const pile: PileFunction = Object.assign(pileImpl, { item: pileItem })
