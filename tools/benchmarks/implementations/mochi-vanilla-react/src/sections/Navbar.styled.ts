import { styled } from "@mochi-css/vanilla-react"
import { colors, space, font, fontSizes } from "../tokens"

export const NavbarRoot = styled("nav", {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: `${space[3]} ${space[5]}`,
    borderBottom: `1px solid ${colors.border}`,
    position: "sticky",
    top: "0",
    backgroundColor: colors.bgGlass,
    backdropFilter: "blur(8px)",
    zIndex: "10",
})

export const Logo = styled("span", {
    fontFamily: font,
    fontSize: fontSizes.lg,
    fontWeight: "700",
    color: colors.text,
    "& em": { color: colors.gold, fontStyle: "normal" },
})

export const NavLinks = styled("div", {
    display: "flex",
    gap: space[4],
    fontSize: fontSizes.sm,
    color: colors.dim,
})
