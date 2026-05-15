import { styled } from "@mochi-css/vanilla-react"
import { colors, space, fontSizes } from "../tokens"

export const FooterRoot = styled("footer", {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: `${space[4]} ${space[5]}`,
    borderTop: `1px solid ${colors.border}`,
    fontSize: fontSizes.sm,
    color: colors.dim,
    flexWrap: "wrap",
    gap: space[3],
})

export const FooterLinks = styled("div", {
    display: "flex",
    gap: space[4],
})
