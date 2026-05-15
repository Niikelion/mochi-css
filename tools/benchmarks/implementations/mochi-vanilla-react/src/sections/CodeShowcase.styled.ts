import { styled } from "@mochi-css/vanilla-react"
import { colors, space, font, fontSizes } from "../tokens"

export const CodeSection = styled("section", {
    padding: `${space[7]} ${space[5]}`,
    backgroundColor: colors.surface,
    borderTop: `1px solid ${colors.border}`,
})

export const CodeSectionInner = styled("div", {
    maxWidth: "700px",
    margin: "0 auto",
})

export const CodeHeading = styled("h2", {
    fontFamily: font,
    fontSize: fontSizes["2xl"],
    fontWeight: "700",
    color: colors.text,
    marginBottom: space[4],
    textAlign: "center",
})
