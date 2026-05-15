import { styled } from "@mochi-css/vanilla-react"
import { colors, space, font, fontSizes } from "../tokens"
import { fadeIn } from "../global"

export const HeroSection = styled("section", {
    flex: "1",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: `${space[8]} ${space[5]}`,
    textAlign: "center",
    gap: space[4],
})

export const HeroHeading = styled("h1", {
    fontFamily: font,
    fontSize: fontSizes["3xl"],
    fontWeight: "700",
    lineHeight: "1.1",
    color: colors.text,
    animation: `${fadeIn} 0.6s ease-out`,
})

export const HeroParagraph = styled("p", {
    fontFamily: font,
    fontSize: fontSizes.lg,
    color: colors.dim,
    maxWidth: "560px",
    lineHeight: "1.6",
})

export const ButtonGroup = styled("div", {
    display: "flex",
    gap: space[3],
    flexWrap: "wrap",
    justifyContent: "center",
})
