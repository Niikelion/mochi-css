import { styled } from "@mochi-css/vanilla-react"
import { colors, space, font, fontSizes } from "../tokens"

export const CtaSection = styled("section", {
    padding: `${space[7]} ${space[5]}`,
    borderTop: `1px solid ${colors.border}`,
    textAlign: "center",
})

export const CtaParagraph = styled("p", {
    fontFamily: font,
    fontSize: fontSizes.base,
    color: colors.dim,
    marginBottom: space[4],
})

export const ButtonGroup = styled("div", {
    display: "flex",
    gap: space[3],
    flexWrap: "wrap",
    justifyContent: "center",
})
