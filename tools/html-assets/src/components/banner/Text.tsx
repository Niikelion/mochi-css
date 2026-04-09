import { styled } from "@mochi-css/vanilla-react"
import { css } from "@mochi-css/vanilla"
import { Colors } from "./colors.ts"

const textStyles = css({
    fontFamily: "'IBM Plex Mono', monospace",
    color: Colors.white,
    margin: 0,

    variants: {
        color: {
            dim: {
                color: Colors.dim
            },
            bright: {
                color: Colors.bright
            }
        }
    }
})

export const EN = styled("p", textStyles)

export const JP = styled("p", textStyles, {
    fontFamily: "'Noto Sans JP', sans-serif",
    fontWeight: 300,
    textAlign: "center",
    fontSize: 20,
    variants: {
        vertical: {
            true: {
                letterSpacing: '0.2em',
                writingMode: 'vertical-rl',
            }
        }
    }
})
