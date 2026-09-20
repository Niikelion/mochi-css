import { css } from "@mochi-css/vanilla"

export interface DividerProps {
    vertical?: boolean
}

// Distinct constants so consumers can target each orientation via styled()
const _divH = css({ display: "block", alignSelf: "stretch", width: "100%" })
const _divV = css({ display: "block", alignSelf: "stretch", height: "100%" })

export function divider(props?: DividerProps): string {
    return props?.vertical === true ? _divV.variant({}) : _divH.variant({})
}
