import { styled } from "@mochi-css/vanilla-react"

const sections = {
    left: "left",
    middle: "middle",
    right: "right"
}

const Left = styled("section", {
    gridArea: sections.left
})

const Middle = styled("section", {
    gridArea: sections.middle
})

const Right = styled("section", {
    gridArea: sections.right
})

export const Layout = {
    Root: styled("section", {
        background: '#0d0d0f',
        overflow: 'hidden',
        position: 'relative',
        fontFamily: "'IBM Plex Mono', monospace",
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        gridTemplateAreas: `"${sections.left} ${sections.middle} ${sections.right}"`
    }),
    Left,
    Middle,
    Right
}
