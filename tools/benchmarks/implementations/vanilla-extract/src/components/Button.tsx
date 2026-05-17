// @generated — do not edit; regenerated from mochi-vanilla-react by codegen/index.ts

import React from "react"
import type { RecipeVariants } from "@vanilla-extract/recipes"
import { button, btnAccent, btnOnAccent } from "./Button.css"

export const Button = ({ variant, size, color, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & NonNullable<RecipeVariants<typeof button>>) => (
    <button
        {...props}
        className={[button({ variant, size, color }), className].filter(Boolean).join(" ")}
    />
)
