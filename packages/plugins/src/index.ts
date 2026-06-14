export { createExtractorsPlugin, getExtractorId } from "./ExtractorsPlugin"
export { createClassRemapPlugin } from "./ClassRemapPlugin"
export type { ClassRemapOptions, ClassRemapContext } from "./ClassRemapPlugin"
export { styledIdPlugin } from "./styledIdPlugin"
export { PluginContextCollector } from "./PluginContextCollector"

export type { StyleExtractor, DerivedExtractorBinding, FileInfo, CssAstChunk } from "./types"
export { StyleGenerator, AstStyleGenerator, parseCss } from "./types"
export type { ImportSpecStageOut, ExtractorLookup } from "./stages/ImportSpecStage"
export { ImportStage } from "./stages/ImportSpecStage"
export type { DerivedExtractorStageOut } from "./stages/DerivedExtractorStage"
export { DerivedStage } from "./stages/DerivedExtractorStage"
export type { StyleExprStageOut } from "./stages/StyleExprStage"
export { StyleExprStage } from "./stages/StyleExprStage"
export type { BindingStageOut } from "./stages/BindingStage"
export { BindingStage } from "./stages/BindingStage"
export type { CrossFileDerivedStageOut, CrossFileExtra, CrossFileResult } from "./stages/CrossFileDerivedStage"
export { CrossFileDerivedStage } from "./stages/CrossFileDerivedStage"
export type { ExportsStageOut, ExportsStageResult, ReexportEntry } from "./stages/Exports"
export { ExportsStage } from "./stages/Exports"
export type { GeneratorsCollectionStageOut } from "./stages/GeneratorsCollectionStage"
export { GeneratorsCollectionStage } from "./stages/GeneratorsCollectionStage"
export type { ClassnameLiteralsStageOut } from "./stages/ClassnameLiteralsStage"
export { ClassnameLiteralsStage } from "./stages/ClassnameLiteralsStage"
export { extractRelevantSymbols } from "./extractRelevantSymbols"
export { getOrInsert, isLocalImport } from "./utils"
export { propagateUsagesFromRef, propagateUsagesFromExpr } from "./propagation"
export type { ReexportResolver } from "./propagation"

// Re-export commonly used builder types for plugin authors
export type {
    AstPostProcessor,
    EmitHook,
    PostProcessHook,
    PostProcessContext,
    BuilderOptions,
    RootEntry,
    StageDefinition,
} from "@mochi-css/builder"
