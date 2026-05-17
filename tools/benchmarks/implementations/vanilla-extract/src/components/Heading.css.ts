// @generated — do not edit; regenerated from mochi-vanilla-react by codegen/index.ts

import { recipe } from "@vanilla-extract/recipes"
import { colors, font, fontSizes } from "../tokens"

export const heading = recipe({
    base: {
        fontFamily: font,
        lineHeight: "1.2",
        fontWeight: "700",
    },
    variants: {
            size: {
                sm: {
                    fontSize: fontSizes.lg,
                },
                md: {
                    fontSize: fontSizes["2xl"],
                },
                lg: {
                    fontSize: fontSizes["3xl"],
                },
            },
            color: {
                default: {
                    color: colors.text,
                },
                gold: {
                    color: colors.gold,
                },
                dim: {
                    color: colors.dim,
                },
            },
        },
    defaultVariants: { size: "md", color: "default" },
})
