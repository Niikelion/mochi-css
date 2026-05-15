import { styled } from "@mochi-css/vanilla-react"
import { colors, radii, fontSizes, space } from "../tokens"

export const Pre = styled("pre", {
    backgroundColor: colors.bg,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.md,
    padding: space[4],
    overflow: "auto",
    fontSize: fontSizes.sm,
    color: colors.text,
    lineHeight: "1.6",
})
