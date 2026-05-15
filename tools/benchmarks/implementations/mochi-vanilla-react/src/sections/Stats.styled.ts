import { styled } from "@mochi-css/vanilla-react"
import { colors, space, font, fontSizes } from "../tokens"

export const StatsSection = styled("section", {
    padding: `${space[6]} ${space[5]}`,
    backgroundColor: colors.surface,
    borderTop: `1px solid ${colors.border}`,
    borderBottom: `1px solid ${colors.border}`,
})

export const StatsGrid = styled("div", {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: space[4],
    maxWidth: "800px",
    margin: "0 auto",
    textAlign: "center",
})

export const StatCard = styled("div", {
    display: "flex",
    flexDirection: "column",
    gap: space[1],
    "& span:first-child": {
        fontFamily: font,
        fontSize: fontSizes["2xl"],
        fontWeight: "700",
        color: colors.gold,
    },
    "& span:last-child": {
        fontFamily: font,
        fontSize: fontSizes.sm,
        color: colors.dim,
    },
})
