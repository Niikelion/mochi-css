import type { StyleExtractor } from "@/extractors/StyleExtractor"
import type { CallExpression, Expression } from "@swc/core"
import type { StyleGenerator } from "@/generators"
import { VanillaKeyframesGenerator } from "@/generators"
import type { OnDiagnostic } from "@/diagnostics"

export class VanillaKeyframesExtractor implements StyleExtractor {
    public readonly importPath: string
    public readonly symbolName: string

    constructor(importPath: string, symbolName: string) {
        this.importPath = importPath
        this.symbolName = symbolName
    }

    extractStaticArgs(call: CallExpression): Expression[] {
        return call.arguments.slice(0, 1).map(a => a.expression)
    }

    startGeneration(onDiagnostic?: OnDiagnostic): StyleGenerator {
        return new VanillaKeyframesGenerator(onDiagnostic)
    }
}

export const mochiKeyframesFunctionExtractor = new VanillaKeyframesExtractor(
    "@mochi-css/vanilla",
    "keyframes",
)
