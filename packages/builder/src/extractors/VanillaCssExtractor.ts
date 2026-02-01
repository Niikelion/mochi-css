import { StyleExtractor } from "@/extractors/StyleExtractor"
import { CallExpression, Expression } from "@swc/core"
import { StyleGenerator, VanillaCssGenerator } from "@/generators"

export class VanillaCssExtractor implements StyleExtractor {
    public readonly importPath: string
    public readonly symbolName: string

    constructor(
        importPath: string,
        symbolName: string,
        private readonly extractor: (call: CallExpression) => Expression[],
    ) {
        this.importPath = importPath
        this.symbolName = symbolName
    }

    extractStaticArgs(call: CallExpression): Expression[] {
        return this.extractor(call)
    }

    startGeneration(): StyleGenerator {
        return new VanillaCssGenerator()
    }
}

export const mochiCssFunctionExtractor = new VanillaCssExtractor(
    "@mochi-css/vanilla",
    "css",
    call => call.arguments.map(a => a.expression)
)

//TODO: move to react package
export const mochiStyledFunctionExtractor = new VanillaCssExtractor(
    "@mochi-css/vanilla",
    "styled",
    call => call.arguments.map(a => a.expression).slice(1)
)
