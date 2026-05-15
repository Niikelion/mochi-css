// @generated — do not edit; regenerated from mochi-vanilla-react by codegen/index.ts

import { style } from "@vanilla-extract/css"
import { colors, radii, fontSizes, space } from "../tokens"

export const pre = style({
    backgroundColor: colors.bg,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.md,
    padding: space[4],
    overflow: "auto",
    fontSize: fontSizes.sm,
    color: colors.text,
    lineHeight: "1.6",
})
