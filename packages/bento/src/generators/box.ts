import { css } from "@mochi-css/vanilla"

const _box = css({ display: "block" })

export function box(): string {
    return _box.variant({})
}
