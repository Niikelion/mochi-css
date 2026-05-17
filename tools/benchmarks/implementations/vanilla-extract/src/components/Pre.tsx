// @generated — do not edit; regenerated from mochi-vanilla-react by codegen/index.ts

import React from "react"
import { pre } from "./Pre.css"

export const Pre = ({ className, ...props }: React.HTMLAttributes<HTMLPreElement>) => (
    <pre {...props} className={[pre, className].filter(Boolean).join(" ")} />
)
