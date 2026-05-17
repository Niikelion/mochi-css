import { styled } from "@mochi-css/vanilla-react"
import { colors, space, font, fontSizes } from "../tokens"

export const FeaturesSection = styled("section", {
    padding: `${space[7]} ${space[5]}`,
    maxWidth: "1100px",
    margin: "0 auto",
    width: "100%",
})

export const FeaturesHeading = styled("h2", {
    fontFamily: font,
    fontSize: fontSizes["2xl"],
    fontWeight: "700",
    color: colors.text,
    marginBottom: space[5],
    textAlign: "center",
})

export const FeaturesGrid = styled("div", {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: space[4],
    "@media (min-width: 768px)": {
        gridTemplateColumns: "1fr 1fr",
    },
})

export const FeatureHeading = styled("h3", {
    fontFamily: font,
    fontSize: fontSizes.base,
    fontWeight: "600",
    color: colors.text,
    marginBottom: space[2],
})

export const FeatureBody = styled("p", {
    fontFamily: font,
    fontSize: fontSizes.sm,
    color: colors.dim,
    lineHeight: "1.6",
})
