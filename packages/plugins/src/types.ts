import type * as SWC from "@swc/core";
import type { OnDiagnostic } from "@mochi-css/core";
import type { BindingInfo, LocalImport, RefMap, Ref } from "@mochi-css/builder";

export interface StyleGenerator {
    collectArgs(
        source: string,
        args: unknown[],
    ): Record<string, StyleGenerator> | void;

    generateStyles(): Promise<{
        global?: string;
        files?: Record<string, string>;
    }>;

    getArgReplacements?(): { source: string; expression: SWC.Expression }[];
}

export interface StyleExtractor {
    readonly importPath: string;
    readonly symbolName: string;
    readonly derivedExtractors?: ReadonlyMap<string, StyleExtractor>;

    extractStaticArgs(call: SWC.CallExpression): SWC.Expression[];
    startGeneration(onDiagnostic?: OnDiagnostic): StyleGenerator;
}

export interface DerivedExtractorBinding {
    extractor: StyleExtractor;
    parentExtractor: StyleExtractor;
    parentCallExpression: SWC.CallExpression;
    propertyName: string;
    localIdentifier: SWC.Identifier;
}

export interface FileInfo {
    filePath: string;
    ast: SWC.Module;
    styleExpressions: Set<SWC.Expression>;
    extractedExpressions: Map<StyleExtractor, SWC.Expression[]>;
    extractedCallExpressions: Map<StyleExtractor, SWC.CallExpression[]>;
    references: Set<SWC.Identifier>;
    moduleBindings: RefMap<BindingInfo>;
    localImports: RefMap<LocalImport>;
    usedBindings: Set<BindingInfo>;
    exports: Map<string, Ref>;
    derivedExtractorBindings: RefMap<DerivedExtractorBinding>;
    exportedDerivedExtractors: Map<string, DerivedExtractorBinding>;
}
