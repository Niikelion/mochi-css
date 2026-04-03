export { createExtractorsPlugin, getExtractorId } from "./ExtractorsPlugin";
export { PluginContextCollector } from "./PluginContextCollector";

// Re-export commonly needed builder types for plugin authors
export type { StyleExtractor, StyleGenerator } from "@mochi-css/builder";
export type {
    AstPostProcessor,
    EmitHook,
    BuilderOptions,
    RootEntry,
} from "@mochi-css/builder";
export type { StageDefinition } from "@mochi-css/builder";
export {
    createDefaultStages,
    defaultStages,
    ImportSpecStage,
    makeImportSpecStage,
    DerivedExtractorStage,
    makeDerivedExtractorStage,
    StyleExprStage,
    makeStyleExprStage,
    BindingStage,
    makeBindingStage,
    CrossFileDerivedStage,
    makeCrossFileDerivedStage,
} from "@mochi-css/builder";
export { extractRelevantSymbols } from "@mochi-css/builder";
