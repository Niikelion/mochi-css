import * as SWC from "@swc/core"
import { StyleGenerator } from "@/generators/StyleGenerator"
import { OnDiagnostic } from "@/diagnostics"

export interface StyleExtractor {
    readonly importPath: string
    readonly symbolName: string
    readonly derivedExtractors?: ReadonlyMap<string, StyleExtractor>

    extractStaticArgs(call: SWC.CallExpression): SWC.Expression[]
    startGeneration(onDiagnostic?: OnDiagnostic): StyleGenerator
}
