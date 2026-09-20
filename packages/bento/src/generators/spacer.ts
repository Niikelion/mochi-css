import { css } from "@mochi-css/vanilla"

const _spacer = css({ flex: "1" })

export function spacer(): string {
    return _spacer.variant({})
}
