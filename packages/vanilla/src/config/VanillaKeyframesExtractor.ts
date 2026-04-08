import type { StyleExtractor, StyleGenerator } from "@mochi-css/plugins"
import type { OnDiagnostic } from "@mochi-css/builder"
import type { CallExpression, Expression } from "@swc/core"
import { VanillaKeyframesGenerator } from "./VanillaKeyframesGenerator"

export class VanillaKeyframesExtractor implements StyleExtractor {
    public readonly importPath = "@mochi-css/vanilla"
    public readonly symbolName = "keyframes"

    extractStaticArgs(call: CallExpression): Expression[] {
        return call.arguments.slice(0, 1).map((a) => a.expression)
    }

    startGeneration(onDiagnostic?: OnDiagnostic): StyleGenerator {
        return new VanillaKeyframesGenerator(onDiagnostic)
    }
}

export const mochiKeyframesFunctionExtractor = new VanillaKeyframesExtractor()
