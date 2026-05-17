import { createStitches } from "@mochi-css/stitches"

export const { styled, css, keyframes, globalCss, theme } = createStitches({
    theme: {
        colors: {
            bg: "#131110", text: "#e8e0cc", gold: "#c9a84c", dim: "#6b5e3a",
            surface: "#1e1b18", border: "#2a2520",
            bgGlass: "#131110ee", bgMuted: "#13111080",
            goldSubtle: "#c9a84c20", goldFaint: "#c9a84c40",
        },
        space: { 1: "4px", 2: "8px", 3: "16px", 4: "24px", 5: "32px", 6: "48px", 7: "64px", 8: "96px" },
        radii: { sm: "4px", md: "8px", lg: "16px" },
        fontSizes: { xs: "12px", sm: "14px", base: "16px", lg: "20px", xl: "24px", "2xl": "36px", "3xl": "64px" },
        fonts: { mono: "'IBM Plex Mono', 'Courier New', monospace" },
    },
})
