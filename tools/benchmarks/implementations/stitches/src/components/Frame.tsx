// @generated — do not edit; regenerated from mochi-vanilla-react by codegen/index.ts

import { styled } from "../stitches.config"
import { colors, radii, space } from "../tokens"

const alignX = { value: "var(--alignX)", variable: "--alignX" } as const
const alignY = { value: "var(--alignY)", variable: "--alignY" } as const

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
                alignItems: alignY.value
            },
            col: {
                flexDirection: "column",
                justifyContent: alignY.value,
                alignItems: alignX.value
            }
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
    defaultVariants: {
        direction: "row",
        alignX: "start",
        alignY: "start"
    }
})
