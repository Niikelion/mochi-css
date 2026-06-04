// @generated — do not edit; regenerated from mochi-vanilla-react by codegen/index.ts

import { createVar } from "@vanilla-extract/css"
import { recipe } from "@vanilla-extract/recipes"
import { colors, radii, font, fontSizes } from "../tokens"

export const btnAccent = createVar()
export const btnOnAccent = createVar()

export const button = recipe({
    base: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: font,
        fontWeight: "600",
        lineHeight: "normal",
        cursor: "pointer",
        border: "1px solid transparent",
        borderRadius: radii.sm,
        transition: "opacity 0.15s, transform 0.15s",
        selectors: {
            "&:hover": {
                opacity: 0.85,
            },
        },
    },
    variants: {
            variant: {
                solid: {
                    backgroundColor: btnAccent,
                    color: btnOnAccent,
                    borderColor: btnAccent,
                },
                outline: {
                    backgroundColor: "transparent",
                    color: btnAccent,
                    borderColor: btnAccent,
                },
                ghost: {
                    backgroundColor: "transparent",
                    color: btnAccent,
                    borderColor: "transparent",
                },
            },
            size: {
                sm: {
                    padding: "6px 12px",
                    fontSize: fontSizes.xs,
                },
                md: {
                    padding: "8px 16px",
                    fontSize: fontSizes.sm,
                },
                lg: {
                    padding: "12px 24px",
                    fontSize: fontSizes.base,
                },
            },
            color: {
                gold: {
                    vars: {
                        [btnAccent]: colors.gold,
                        [btnOnAccent]: colors.bg,
                    },
                },
                neutral: {
                    vars: {
                        [btnAccent]: colors.text,
                        [btnOnAccent]: colors.bg,
                    },
                },
                danger: {
                    vars: {
                        [btnAccent]: "#e54d2e",
                        [btnOnAccent]: "#fff",
                    },
                },
            },
        },
    defaultVariants: { variant: "solid", size: "md", color: "gold" },
})
