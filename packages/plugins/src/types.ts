import type * as SWC from "@swc/core"
import type { OnDiagnostic } from "@mochi-css/core"
import type { BindingInfo, LocalImport, RefMap, Ref } from "@mochi-css/builder"

export abstract class StyleGenerator {
    abstract mockFunction(...args: unknown[]): unknown

    abstract collectArgs(source: string, args: unknown[]): void

    abstract generateStyles(): Promise<{
        global?: string
        files?: Record<string, string>
    }>

    extractSubstitution(): SWC.Expression | null {
        return null
    }
}

export interface StyleExtractor {
    readonly importPath: string
    readonly symbolName: string
    readonly derivedExtractors?: ReadonlyMap<string, StyleExtractor>
    readonly substitution?: {
        /** Name of the export to add as an import. Omit when no import is needed (e.g. a string literal replacement). */
        importName?: string
        /** Module path to import `importName` from. Defaults to this extractor's `importPath` when omitted. */
        importPath?: string
        /** `'full'`: replace the entire CallExpression with the generator expression.
         *  `'args'`: keep the original callee and prefix args (determined by `extractStaticArgs`), replace only the extracted args. */
        mode: "full" | "args"
    }

    extractStaticArgs(call: SWC.CallExpression): SWC.Expression[]
    startGeneration(onDiagnostic?: OnDiagnostic): StyleGenerator
}

export interface DerivedExtractorBinding {
    extractor: StyleExtractor
    parentExtractor: StyleExtractor
    parentCallExpression: SWC.CallExpression
    propertyName: string
    localIdentifier: SWC.Identifier
}

export type ReexportInfo = {
    sourcePath: string
    originalName: string
}

export interface FileInfo {
    filePath: string
    ast: SWC.Module
    styleExpressions: Set<SWC.Expression>
    extractedExpressions: Map<StyleExtractor, SWC.Expression[]>
    extractedCallExpressions: Map<StyleExtractor, SWC.CallExpression[]>
    references: Set<SWC.Identifier>
    moduleBindings: RefMap<BindingInfo>
    localImports: RefMap<LocalImport>
    usedBindings: Set<BindingInfo>
    exports: Map<string, Ref>
    derivedExtractorBindings: RefMap<DerivedExtractorBinding>
    exportedDerivedExtractors: Map<string, DerivedExtractorBinding>
    reexports: Map<string, ReexportInfo>
    namespaceReexports: Set<string>
}
