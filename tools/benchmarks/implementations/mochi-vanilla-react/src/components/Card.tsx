import { styled } from "@mochi-css/vanilla-react"
import { colors, radii, space } from "../tokens"

export const Card = styled("div", {
    borderRadius: radii.md,
    padding: space[4],
    border: "1px solid",
    variants: {
        variant: {
            default: {
                backgroundColor: colors.surface,
                borderColor: colors.border,
            },
            elevated: {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                boxShadow: `0 4px 24px rgba(0,0,0,0.4)`,
            },
            bordered: {
                backgroundColor: colors.surface,
                borderColor: colors.gold,
            },
        },
    },
    defaultVariants: { variant: "default" },
})
