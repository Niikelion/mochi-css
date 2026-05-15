import { css } from "@mochi-css/vanilla"
import { colors, font, fontSizes } from "../tokens"
import { createElement, FC, HTMLProps } from "react"
import { styled } from "@mochi-css/vanilla-react"

const headingStyles = css({
    fontFamily: font,
    lineHeight: "1.2",
    fontWeight: "700",
    variants: {
        size: {
            sm: { fontSize: fontSizes.lg },
            md: { fontSize: fontSizes["2xl"] },
            lg: { fontSize: fontSizes["3xl"] },
        },
        color: {
            default: { color: colors.text },
            gold: { color: colors.gold },
            dim: { color: colors.dim },
        },
    },
    defaultVariants: { size: "md", color: "default" },
})

type HeadingProps = {
    as?: "h1" | "h2" | "h3" | "h4"
} & HTMLProps<HTMLHeadingElement>

const HeadingCore: FC<HeadingProps> = ({ as = "h2", ...props }) => createElement(as, props)

export const Heading = styled(HeadingCore, headingStyles)
