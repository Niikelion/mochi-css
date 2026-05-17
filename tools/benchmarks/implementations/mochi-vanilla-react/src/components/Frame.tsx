import { styled } from "@mochi-css/vanilla-react"
import { colors, radii, space } from "../tokens"
import { createToken } from "@mochi-css/vanilla"

const alignX = createToken("alignX")
const alignY = createToken("alignY")

export const Frame = styled("div", {
    display: "flex",
    padding: space[3],
    gap: space[2],
    border: `1px solid ${colors.border}`,
    borderRadius: radii.md,
    width: "200px",
    height: "200px",
    backgroundColor: colors.surface,
    variants: {
        direction: {
            row: {
                flexDirection: "row",
                justifyContent: alignX.value,
                alignItems: alignY.value,
            },
            col: {
                flexDirection: "column",
                justifyContent: alignY.value,
                alignItems: alignX.value,
            },
        },
        alignX: {
            start: {
                [alignX.variable]: "flex-start"
            },
            center: {
                [alignX.variable]: "center"
            },
            end: {
                [alignX.variable]: "flex-end"
            }
        },
        alignY: {
            start: {
                [alignY.variable]: "flex-start"
            },
            center: {
                [alignY.variable]: "center"
            },
            end: {
                [alignY.variable]: "flex-end"
            }
        }
    },
    defaultVariants: { direction: "row", alignX: "start", alignY: "start" },
})
