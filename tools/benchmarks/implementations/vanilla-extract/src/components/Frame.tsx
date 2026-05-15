// @generated — do not edit; regenerated from mochi-vanilla-react by codegen/index.ts

import React from "react"
import type { RecipeVariants } from "@vanilla-extract/recipes"
import { frame, alignX, alignY } from "./Frame.css"

export const Frame = ({ direction, alignX, alignY, className, ...props }: React.HTMLAttributes<HTMLDivElement> & NonNullable<RecipeVariants<typeof frame>>) => (
    <div
        {...props}
        className={[frame({ direction, alignX, alignY }), className].filter(Boolean).join(" ")}
    />
)
