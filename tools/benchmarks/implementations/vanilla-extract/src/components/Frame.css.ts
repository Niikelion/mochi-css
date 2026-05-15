// @generated — do not edit; regenerated from mochi-vanilla-react by codegen/index.ts

import { createVar } from "@vanilla-extract/css"
import { recipe } from "@vanilla-extract/recipes"
import { colors, radii, space } from "../tokens"

export const alignX = createVar()
export const alignY = createVar()

export const frame = recipe({
    base: {
        display: "flex",
        padding: space[3],
        gap: space[2],
        border: `1px solid ${colors.border}`,
        borderRadius: radii.md,
        width: "200px",
        height: "200px",
        backgroundColor: colors.surface,
    },
    variants: {
            direction: {
                row: {
                    flexDirection: "row",
                    justifyContent: alignX,
                    alignItems: alignY,
                },
                col: {
                    flexDirection: "column",
                    justifyContent: alignY,
                    alignItems: alignX,
                },
            },
            alignX: {
                start: {
                    vars: {
                        [alignX]: "flex-start",
                    },
                },
                center: {
                    vars: {
                        [alignX]: "center",
                    },
                },
                end: {
                    vars: {
                        [alignX]: "flex-end",
                    },
                },
            },
            alignY: {
                start: {
                    vars: {
                        [alignY]: "flex-start",
                    },
                },
                center: {
                    vars: {
                        [alignY]: "center",
                    },
                },
                end: {
                    vars: {
                        [alignY]: "flex-end",
                    },
                },
            },
        },
    defaultVariants: { direction: "row", alignX: "start", alignY: "start" },
})
