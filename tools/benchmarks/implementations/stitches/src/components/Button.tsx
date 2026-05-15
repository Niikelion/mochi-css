// @generated — do not edit; regenerated from mochi-vanilla-react by codegen/index.ts

import { styled } from "../stitches.config"
import { colors, radii, font, fontSizes } from "../tokens"

export const Button = styled("button", {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: font,
    fontWeight: "600",
    cursor: "pointer",
    border: "1px solid transparent",
    borderRadius: radii.sm,
    transition: "opacity 0.15s, transform 0.15s",
    "&:hover": {
        opacity: 0.85
    },
    variants: {
        variant: {
            solid: {
                backgroundColor: `var(--btn-accent)`,
                color: `var(--btn-on-accent)`,
                borderColor: `var(--btn-accent)`
            },
            outline: {
                backgroundColor: "transparent",
                color: `var(--btn-accent)`,
                borderColor: `var(--btn-accent)`
            },
            ghost: {
                backgroundColor: "transparent",
                color: `var(--btn-accent)`,
                borderColor: "transparent"
            }
        },
        size: {
            sm: {
                padding: "6px 12px",
                fontSize: fontSizes.xs
            },
            md: {
                padding: "8px 16px",
                fontSize: fontSizes.sm
            },
            lg: {
                padding: "12px 24px",
                fontSize: fontSizes.base
            }
        },
        color: {
            gold: {
                "--btn-accent": colors.gold,
                "--btn-on-accent": colors.bg
            },
            neutral: {
                "--btn-accent": colors.text,
                "--btn-on-accent": colors.bg
            },
            danger: {
                "--btn-accent": "#e54d2e",
                "--btn-on-accent": "#fff"
            }
        }
    },
    defaultVariants: {
        variant: "solid",
        size: "md",
        color: "gold"
    }
})
