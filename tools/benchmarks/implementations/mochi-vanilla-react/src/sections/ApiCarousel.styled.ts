import { styled } from "@mochi-css/vanilla-react"
import { colors, space, font, fontSizes, radii } from "../tokens"

export const CarouselSection = styled("section", {
    padding: `${space[7]} ${space[5]}`,
    borderTop: `1px solid ${colors.border}`,
})

export const CarouselInner = styled("div", {
    maxWidth: "860px",
    margin: "0 auto",
})

export const CarouselHeading = styled("h2", {
    fontFamily: font,
    fontSize: fontSizes["2xl"],
    fontWeight: "700",
    color: colors.text,
    marginBottom: space[4],
    textAlign: "center",
})

export const TabBar = styled("div", {
    display: "flex",
    gap: space[2],
    marginBottom: space[3],
    flexWrap: "wrap",
})

export const Tab = styled("button", {
    fontFamily: font,
    fontSize: fontSizes.sm,
    lineHeight: "normal",
    padding: `${space[1]} ${space[3]}`,
    borderRadius: radii.sm,
    border: `1px solid ${colors.border}`,
    cursor: "pointer",
    transition: "background 0.15s, color 0.15s",
    variants: {
        active: {
            "true": { backgroundColor: colors.gold, color: colors.bg, borderColor: colors.gold },
            "false": { backgroundColor: "transparent", color: colors.dim },
        },
    },
    defaultVariants: { active: false },
})
