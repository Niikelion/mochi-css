// @generated — do not edit; regenerated from mochi-vanilla-react by codegen/index.ts

import { styled } from "../stitches.config"
import { createElement, type FC, type HTMLProps } from "react"

type HeadingProps = {
    as?: "h1" | "h2" | "h3" | "h4"
} & HTMLProps<HTMLHeadingElement>

const HeadingCore: FC<HeadingProps> = ({ as: tag = "h2", ...props }) => createElement(tag, props)

export const Heading = styled(HeadingCore, {
    fontFamily: "$fonts$mono",
    lineHeight: "1.2",
    fontWeight: "700",
    variants: {
        size: {
            sm: {
                fontSize: "$fontSizes$lg"
            },
            md: {
                fontSize: "$fontSizes$2xl"
            },
            lg: {
                fontSize: "$fontSizes$3xl"
            }
        },
        color: {
            default: {
                color: "$colors$text"
            },
            gold: {
                color: "$colors$gold"
            },
            dim: {
                color: "$colors$dim"
            }
        }
    },
    defaultVariants: {
        size: "md",
        color: "default"
    }
})
