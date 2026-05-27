import { css } from "@mochi-css/vanilla"
import clsx from "clsx"

export type MainAxisAlign = "start" | "center" | "end" | "stretch" | "space-between" | "space-around"
export type CrossAxisAlign = "start" | "center" | "end" | "stretch"
export type AxisAlign = MainAxisAlign

export interface FrameProps {
    row?: boolean
    col?: boolean
    alignX?: AxisAlign
    alignY?: AxisAlign
}

const _flex = css({ display: "flex" })
const _flexRow = css({ flexDirection: "row" })
const _flexCol = css({ flexDirection: "column" })

const _jStart = css({ justifyContent: "flex-start" })
const _jCenter = css({ justifyContent: "center" })
const _jEnd = css({ justifyContent: "flex-end" })
const _jStretch = css({ justifyContent: "stretch" })
const _jBetween = css({ justifyContent: "space-between" })
const _jAround = css({ justifyContent: "space-around" })

const _aStart = css({ alignItems: "flex-start" })
const _aCenter = css({ alignItems: "center" })
const _aEnd = css({ alignItems: "flex-end" })
const _aStretch = css({ alignItems: "stretch" })

function justifyClass(a: AxisAlign | undefined): string {
    switch (a) {
        case "start":
            return _jStart.variant({})
        case "center":
            return _jCenter.variant({})
        case "end":
            return _jEnd.variant({})
        case "stretch":
            return _jStretch.variant({})
        case "space-between":
            return _jBetween.variant({})
        case "space-around":
            return _jAround.variant({})
        default:
            return ""
    }
}

function alignClass(a: AxisAlign | undefined): string {
    switch (a) {
        case "start":
            return _aStart.variant({})
        case "center":
            return _aCenter.variant({})
        case "end":
            return _aEnd.variant({})
        case "stretch":
            return _aStretch.variant({})
        default:
            return ""
    }
}

export function frame(props: FrameProps): string {
    if (process.env["NODE_ENV"] !== "production" && props.row === true && props.col === true) {
        console.warn("[bento] Frame: both `row` and `col` were provided — `row` takes precedence.")
    }

    // row wins if both provided; col is the default when neither is provided
    const isRow = props.row === true

    const mainAlign = isRow ? props.alignX : props.alignY
    const crossAlign = isRow ? props.alignY : props.alignX

    return clsx(
        _flex.variant({}),
        isRow ? _flexRow.variant({}) : _flexCol.variant({}),
        justifyClass(mainAlign),
        alignClass(crossAlign),
    )
}
