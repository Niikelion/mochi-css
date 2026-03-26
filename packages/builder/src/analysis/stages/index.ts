export { ImportSpecStage } from "./ImportSpecStage"
export { DerivedExtractorStage } from "./DerivedExtractorStage"
export { StyleExprStage } from "./StyleExprStage"
export { BindingStage } from "./BindingStage"
export { CrossFileDerivedStage } from "./CrossFileDerivedStage"
export type { CrossFileResult, CrossFileExtra } from "./CrossFileDerivedStage"
export type { ExtractorLookup, FileData } from "./ImportSpecStage"

import { ImportSpecStage } from "./ImportSpecStage"
import { DerivedExtractorStage } from "./DerivedExtractorStage"
import { StyleExprStage } from "./StyleExprStage"
import { BindingStage } from "./BindingStage"
import { CrossFileDerivedStage } from "./CrossFileDerivedStage"

export const defaultStages = [
    ImportSpecStage,
    DerivedExtractorStage,
    StyleExprStage,
    BindingStage,
    CrossFileDerivedStage,
] as const
