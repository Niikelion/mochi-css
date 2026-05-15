import { globalCss, keyframes } from "@mochi-css/vanilla"
import { colors, font } from "./tokens"

globalCss({
    ":root": {
        "--m-bg": "#131110",
        "--m-text": "#e8e0cc",
        "--m-gold": "#c9a84c",
        "--m-dim": "#6b5e3a",
        "--m-surface": "#1e1b18",
        "--m-border": "#2a2520",
        "--m-bg-glass": "#131110ee",
        "--m-bg-muted": "#13111080",
        "--m-gold-subtle": "#c9a84c20",
        "--m-gold-faint": "#c9a84c40",
        "--m-sp-1": "4px",
        "--m-sp-2": "8px",
        "--m-sp-3": "16px",
        "--m-sp-4": "24px",
        "--m-sp-5": "32px",
        "--m-sp-6": "48px",
        "--m-sp-7": "64px",
        "--m-sp-8": "96px",
        "--m-r-sm": "4px",
        "--m-r-md": "8px",
        "--m-r-lg": "16px",
        "--m-fs-xs": "12px",
        "--m-fs-sm": "14px",
        "--m-fs-base": "16px",
        "--m-fs-lg": "20px",
        "--m-fs-xl": "24px",
        "--m-fs-2xl": "36px",
        "--m-fs-3xl": "64px",
        "--m-font": "'IBM Plex Mono', 'Courier New', monospace",
    },
    "*, *::before, *::after": { boxSizing: "border-box", margin: "0", padding: "0" },
    html: { scrollBehavior: "smooth" },
    body: {
        backgroundColor: colors.bg,
        color: colors.text,
        fontFamily: font,
        lineHeight: "1.6",
        minHeight: "100vh",
    },
    a: { color: "inherit", textDecoration: "none" },
    "a:hover": { opacity: "0.8" },
    "pre, code": { fontFamily: font },
})

export const fadeIn = keyframes({
    from: { opacity: "0", transform: "translateY(-16px)" },
    to: { opacity: "1", transform: "translateY(0)" },
})
