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

    getArgReplacements(): {
        source: string
        expression: SWC.Expression
    }[] {
        return []
    }
}

export interface StyleExtractor {
    readonly importPath: string
    readonly symbolName: string
    readonly derivedExtractors?: ReadonlyMap<string, StyleExtractor>

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
