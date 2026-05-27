import { css } from "@mochi-css/vanilla"
import clsx from "clsx"
import type { CrossAxisAlign } from "./frame"

export interface OverlayProps {
    alignX?: CrossAxisAlign
    alignY?: CrossAxisAlign
}

// Base: makes the container a positioning context; all direct children are
// absolutely positioned. The translate CSS variables default to 0 so children
// sit at their natural (0,0) offset unless an alignment class overrides them.
const _overlayBase = css({
    position: "relative",
    "& > *": {
        position: "absolute",
        translate: "var(--bento-ov-tx, 0) var(--bento-ov-ty, 0)",
    },
})

// X-axis alignment classes
const _ovXStart = css({ "& > *": { left: 0, right: "auto" } })
const _ovXCenter = css({
    "& > *": { left: "50%", right: "auto", "--bento-ov-tx": "-50%" },
})
const _ovXEnd = css({ "& > *": { left: "auto", right: 0 } })
const _ovXStretch = css({ "& > *": { left: 0, right: 0 } })

// Y-axis alignment classes
const _ovYStart = css({ "& > *": { top: 0, bottom: "auto" } })
const _ovYCenter = css({
    "& > *": { top: "50%", bottom: "auto", "--bento-ov-ty": "-50%" },
})
const _ovYEnd = css({ "& > *": { top: "auto", bottom: 0 } })
const _ovYStretch = css({ "& > *": { top: 0, bottom: 0 } })

function xClass(a: CrossAxisAlign | undefined): string {
    switch (a) {
        case "start":
            return _ovXStart.variant({})
        case "center":
            return _ovXCenter.variant({})
        case "end":
            return _ovXEnd.variant({})
        case "stretch":
            return _ovXStretch.variant({})
        default:
            return ""
    }
}

function yClass(a: CrossAxisAlign | undefined): string {
    switch (a) {
        case "start":
            return _ovYStart.variant({})
        case "center":
            return _ovYCenter.variant({})
        case "end":
            return _ovYEnd.variant({})
        case "stretch":
            return _ovYStretch.variant({})
        default:
            return ""
    }
}

export function overlay(props: OverlayProps): string {
    return clsx(_overlayBase.variant({}), xClass(props.alignX), yClass(props.alignY))
}
