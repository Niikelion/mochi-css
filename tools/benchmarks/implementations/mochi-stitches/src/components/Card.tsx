// @generated — do not edit; regenerated from mochi-vanilla-react by codegen/index.ts

import { styled } from "../stitches.config"

export const Card = styled("div", {
    borderRadius: "$radii$md",
    padding: "$space$4",
    border: "1px solid",
    variants: {
        variant: {
            default: {
                backgroundColor: "$colors$surface",
                borderColor: "$colors$border"
            },
            elevated: {
                backgroundColor: "$colors$surface",
                borderColor: "$colors$border",
                boxShadow: "0 4px 24px rgba(0,0,0,0.4)"
            },
            bordered: {
                backgroundColor: "$colors$surface",
                borderColor: "$colors$gold"
            }
        }
    },
    defaultVariants: {
        variant: "default"
    }
})
