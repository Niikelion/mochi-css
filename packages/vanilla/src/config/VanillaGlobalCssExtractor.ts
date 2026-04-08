import type { StyleExtractor, StyleGenerator } from "@mochi-css/plugins"
import type { OnDiagnostic } from "@mochi-css/builder"
import type { CallExpression, Expression } from "@swc/core"
import { VanillaGlobalCssGenerator } from "./VanillaGlobalCssGenerator"

export class VanillaGlobalCssExtractor implements StyleExtractor {
    public readonly importPath = "@mochi-css/vanilla"
    public readonly symbolName = "globalCss"

    extractStaticArgs(call: CallExpression): Expression[] {
        return call.arguments.slice(0, 1).map((a) => a.expression)
    }

    startGeneration(onDiagnostic?: OnDiagnostic): StyleGenerator {
        return new VanillaGlobalCssGenerator(onDiagnostic)
    }
}

export const mochiGlobalCssFunctionExtractor = new VanillaGlobalCssExtractor()
