export {
    ImportSpecStage,
    makeImportSpecStage,
    IMPORT_SPEC_STAGE,
    type ImportSpecStageOut,
    type ExtractorLookup,
    type FileData,
} from "./ImportSpecStage"
export {
    DerivedExtractorStage,
    makeDerivedExtractorStage,
    DERIVED_EXTRACTOR_STAGE,
    type DerivedExtractorStageOut,
} from "./DerivedExtractorStage"
export { StyleExprStage, makeStyleExprStage, STYLE_EXPR_STAGE, type StyleExprStageOut } from "./StyleExprStage"
export { BindingStage, makeBindingStage, BINDING_STAGE, type BindingStageOut } from "./BindingStage"
export {
    CrossFileDerivedStage,
    makeCrossFileDerivedStage,
    CROSS_FILE_DERIVED_STAGE,
    type CrossFileDerivedStageOut,
    type CrossFileResult,
    type CrossFileExtra,
} from "./CrossFileDerivedStage"

import {
    ImportSpecStage,
    makeImportSpecStage,
    makeDerivedExtractorStage,
    DerivedExtractorStage,
    makeStyleExprStage,
    StyleExprStage,
    makeBindingStage,
    BindingStage,
    makeCrossFileDerivedStage,
    CrossFileDerivedStage,
} from "@/analysis"
import type { StyleExtractor } from "@/extractors/StyleExtractor"
import type { StageDefinition } from "@/analysis/Stage"

export function createDefaultStages(
    extractors: StyleExtractor[] = [],
): [
    ReturnType<typeof makeImportSpecStage>,
    ReturnType<typeof makeDerivedExtractorStage>,
    ReturnType<typeof makeStyleExprStage>,
    ReturnType<typeof makeBindingStage>,
    ReturnType<typeof makeCrossFileDerivedStage>,
] {
    const importStage = makeImportSpecStage(extractors)
    const derivedStage = makeDerivedExtractorStage(importStage)
    const styleExprStage = makeStyleExprStage(derivedStage)
    const bindingStage = makeBindingStage(styleExprStage)
    const crossFileDerivedStage = makeCrossFileDerivedStage(derivedStage, bindingStage)
    return [importStage, derivedStage, styleExprStage, bindingStage, crossFileDerivedStage]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const defaultStages: readonly StageDefinition<any[], any>[] = [
    ImportSpecStage,
    DerivedExtractorStage,
    StyleExprStage,
    BindingStage,
    CrossFileDerivedStage,
]
