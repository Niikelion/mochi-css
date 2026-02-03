import * as SWC from "@swc/core"
import { StyleGenerator } from "@/generators/StyleGenerator"
import { OnDiagnostic } from "@/diagnostics"

export interface StyleExtractor {
    readonly importPath: string
    readonly symbolName: string

    extractStaticArgs(call: SWC.CallExpression): SWC.Expression[]
    startGeneration(onDiagnostic?: OnDiagnostic): StyleGenerator
}

export class StyleSource {
    constructor(
        public readonly importPath: string,
        public readonly symbolName: string,
        public readonly extractor: (call: SWC.CallExpression) => SWC.Expression[]
    ) {}
}

export const cssFunctionStyleSource = new StyleSource(
    "@mochi-css/vanilla",
    "css",
    call => call.arguments.map(a => a.expression)
)
//TODO: move to react package
export const styledFunctionStyleSource = new StyleSource(
    "@mochi-css/vanilla",
    "styled",
    call => call.arguments.map(a => a.expression).slice(1)
)
