// @generated — do not edit; regenerated from mochi-vanilla-react by codegen/index.ts

import React from "react"
import type { RecipeVariants } from "@vanilla-extract/recipes"
import { card } from "./Card.css"

export const Card = ({ variant, className, ...props }: React.HTMLAttributes<HTMLDivElement> & NonNullable<RecipeVariants<typeof card>>) => (
    <div
        {...props}
        className={[card({ variant }), className].filter(Boolean).join(" ")}
    />
)
