import { styled } from "@mochi-css/vanilla-react"
import { colors, space, font, fontSizes, radii } from "../tokens"

export const ExplorerSection = styled("section", {
    padding: `${space[7]} ${space[5]}`,
    backgroundColor: colors.surface,
    borderTop: `1px solid ${colors.border}`,
})

export const ExplorerInner = styled("div", {
    maxWidth: "1100px",
    margin: "0 auto",
})

export const ExplorerHeading = styled("h2", {
    fontFamily: font,
    fontSize: fontSizes["2xl"],
    fontWeight: "700",
    color: colors.text,
    marginBottom: space[5],
    textAlign: "center",
})

export const ExplorerGrid = styled("div", {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: space[5],
    "@media (min-width: 768px)": {
        gridTemplateColumns: "1fr 1fr",
    },
})

export const PlaygroundCard = styled("div", {
    border: `1px solid ${colors.border}`,
    borderRadius: radii.md,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
})

export const PlaygroundCardHeading = styled("h3", {
    fontFamily: font,
    fontSize: fontSizes.base,
    fontWeight: "600",
    color: colors.text,
    padding: `${space[3]} ${space[4]}`,
    borderBottom: `1px solid ${colors.border}`,
    backgroundColor: colors.bg,
})

export const PreviewBox = styled("div", {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "140px",
    padding: space[4],
    backgroundColor: colors.bgMuted,
    flexGrow: 1,
})

export const ControlRow = styled("div", {
    display: "grid",
    gridTemplateColumns: "auto 1fr",
    gap: `${space[2]} ${space[3]}`,
    alignItems: "center",
    padding: space[4],
    borderTop: `1px solid ${colors.border}`,
    backgroundColor: colors.bg,
})

export const ControlLabel = styled("span", {
    fontFamily: font,
    fontSize: fontSizes.xs,
    color: colors.dim,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
})

export const ControlSelect = styled("select", {
    fontFamily: font,
    fontSize: fontSizes.sm,
    color: colors.text,
    backgroundColor: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.sm,
    padding: "4px 8px",
    cursor: "pointer",
    appearance: "auto",
})

export const FrameItem = styled("span", {
    fontFamily: font,
    fontSize: fontSizes.xs,
    color: colors.text,
    backgroundColor: colors.goldSubtle,
    border: `1px solid ${colors.goldFaint}`,
    borderRadius: radii.sm,
    padding: "6px 12px",
    width: "fit-content"
})
