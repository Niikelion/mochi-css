import { defineConfig } from "@pandacss/dev"

export default defineConfig({
    preflight: true,
    include: ["./src/**/*.{ts,tsx}"],
    exclude: [],
    theme: {
        extend: {
            keyframes: {
                fadeIn: {
                    from: { opacity: "0", transform: "translateY(-16px)" },
                    to: { opacity: "1", transform: "translateY(0)" },
                },
            },
            tokens: {
                colors: {
                    bg: { value: "#131110" },
                    text: { value: "#e8e0cc" },
                    gold: { value: "#c9a84c" },
                    dim: { value: "#6b5e3a" },
                    surface: { value: "#1e1b18" },
                    border: { value: "#2a2520" },
                    bgGlass: { value: "#131110ee" },
                    bgMuted: { value: "#13111080" },
                    goldSubtle: { value: "#c9a84c20" },
                    goldFaint: { value: "#c9a84c40" },
                },
                spacing: {
                    1: { value: "4px" },
                    2: { value: "8px" },
                    3: { value: "16px" },
                    4: { value: "24px" },
                    5: { value: "32px" },
                    6: { value: "48px" },
                    7: { value: "64px" },
                    8: { value: "96px" },
                },
                radii: {
                    sm: { value: "4px" },
                    md: { value: "8px" },
                    lg: { value: "16px" },
                },
                fontSizes: {
                    xs: { value: "12px" },
                    sm: { value: "14px" },
                    base: { value: "16px" },
                    lg: { value: "20px" },
                    xl: { value: "24px" },
                    "2xl": { value: "36px" },
                    "3xl": { value: "64px" },
                },
                fonts: {
                    mono: { value: "'IBM Plex Mono', 'Courier New', monospace" },
                },
                lineHeights: {
                    normal: { value: "normal" },
                },
            },
        },
    },
    globalCss: {
        "*, *::before, *::after": { boxSizing: "border-box", margin: "0", padding: "0" },
        html: { scrollBehavior: "smooth" },
        body: {
            backgroundColor: "bg",
            color: "text",
            fontFamily: "mono",
            lineHeight: "1.6",
            minHeight: "100vh",
        },
        a: { color: "inherit", textDecoration: "none" },
        "a:hover": { opacity: "0.8" },
    },
    outdir: "styled-system",
    jsxFramework: "react",
})
