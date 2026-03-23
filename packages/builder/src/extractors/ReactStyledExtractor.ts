import { VanillaCssExtractor } from "./VanillaCssExtractor"

export const mochiStyledFunctionExtractor = new VanillaCssExtractor("@mochi-css/react", "styled", (call) =>
    call.arguments.map((a) => a.expression).slice(1),
)
