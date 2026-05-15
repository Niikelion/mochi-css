// @generated — do not edit; regenerated from mochi-vanilla-react by codegen/index.ts

import React from "react"
import type { RecipeVariants } from "@vanilla-extract/recipes"
import { heading } from "./Heading.css"

type HeadingProps = {
    as?: "h1" | "h2" | "h3" | "h4"
} & React.HTMLAttributes<HTMLHeadingElement> & { size?: NonNullable<RecipeVariants<typeof heading>["size"]>, color?: NonNullable<RecipeVariants<typeof heading>["color"]> }

export function Heading({ as: tag = "h2", size, color, className, ...props }: HeadingProps) {
    return React.createElement(tag, {
        ...props,
        className: [heading({ size, color }), className].filter(Boolean).join(" "),
    })
}
