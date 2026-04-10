import type { StyleExtractor, StyleGenerator } from "@mochi-css/plugins"
import type { OnDiagnostic } from "@mochi-css/builder"
import type { CallExpression, Expression } from "@swc/core"
import { VanillaCssGenerator } from "./VanillaCssGenerator"
import { css } from "@/css"

//TODO: add function mock to extractor and pass it to generator
export class VanillaCssExtractor implements StyleExtractor {
    public readonly importPath: string
    public readonly symbolName: string
    private readonly mock: (...args: unknown[]) => unknown

    constructor(
        importPath: string,
        symbolName: string,
        private readonly extractor: (call: CallExpression) => Expression[],
        mock: (...args: unknown[]) => unknown,
    ) {
        this.importPath = importPath
        this.symbolName = symbolName
        this.mock = mock
    }

    extractStaticArgs(call: CallExpression): Expression[] {
        return this.extractor(call)
    }

    startGeneration(onDiagnostic?: OnDiagnostic): StyleGenerator {
        return new VanillaCssGenerator(this.mock, onDiagnostic)
    }
}

export const mochiCssFunctionExtractor = new VanillaCssExtractor(
    "@mochi-css/vanilla",
    "css",
    (call) => call.arguments.map((a) => a.expression),
    css as (...args: unknown[]) => unknown,
)
