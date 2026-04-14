---
"@mochi-css/builder": major
"@mochi-css/config": major
"@mochi-css/core": major
"@mochi-css/next": major
"@mochi-css/plugins": major
"@mochi-css/postcss": major
"@mochi-css/tsuki": major
"@mochi-css/vanilla-react": major
---

Refactored CacheEngine to make file data (filePath + ast) a first-class concept, and replaced stage factory functions with static stage definitions.

**`@mochi-css/builder`**

- `FileInput<T>` no longer has a `.cache` wrapper — call `.for(filePath)` directly (was `.cache.for(filePath)`)
- `createCacheRegistry` removed — cache engine construction is now internal; use `new StageRunner(filePaths, stages)` and access via `runner.engine`
- `CacheRegistry` gains `fileData: FileCache<FileInfo>` and `projectInput<T>(): ProjectInput<T>`
- New exports: `CacheEngine`, `FileInfo`, `ProjectInput`, `Cached`, `NodeCache`
- `StageRunner` exposes `engine: CacheEngine` for setting file data from outside
- `getOrInsert`, `isLocalImport`, `propagateUsagesFromRef`, `propagateUsagesFromExpr`, and `ReexportResolver` removed — now exported from `@mochi-css/plugins`
- `FileView` type removed — plugin authors using `FileView` should use `FileInfo` from `@mochi-css/plugins` instead
- `generateMinimalModuleItem`, `pruneUnusedPatternParts`, `isPatternPropertyUsed`, and `isPatternElementUsed` now accept `Set<BindingInfo>` as their second parameter instead of `FileView`

**`@mochi-css/plugins`**

- Stage factory functions removed: `makeImportSpecStage`, `makeDerivedExtractorStage`, `makeStyleExprStage`, `makeBindingStage`, `makeCrossFileDerivedStage` — replaced by static exports `importStageDef`, `derivedStageDef`, `styleExprStageDef`, `bindingStageDef`, `crossFileDerivedStageDef`
- Stage symbols removed: `IMPORT_SPEC_STAGE`, `DERIVED_EXTRACTOR_STAGE`, `STYLE_EXPR_STAGE`, `BINDING_STAGE`, `CROSS_FILE_DERIVED_STAGE`
- `FileData` type removed; replaced by `FileCallbacks` (`{ resolveImport, onDiagnostic }`)
- `ImportSpecStageOut` no longer has `fileData`; exposes `extractors: ProjectInput<ExtractorLookup>` and `fileCallbacks: FileInput<FileCallbacks>` instead
- All downstream stage outputs no longer carry a `fileData` field
- `initializeStages` callers must use `runner.engine.fileData.set(filePath, { filePath, ast })` and set `importOut.extractors` + `importOut.fileCallbacks` separately
- New `exportsStage` tracks per-file reexports (`export { foo } from "./source"`, `export * from "./source"`) as `Map<resolvedSourcePath, ReexportEntry[]>` and `Set<resolvedSourcePath>`, enabling correct cross-file reference resolution
- New exports: `exportsStage`, `ExportsStageOut`, `ExportsStageResult`, `ReexportEntry`
- New exports moved from `@mochi-css/builder`: `getOrInsert`, `isLocalImport`, `propagateUsagesFromRef`, `propagateUsagesFromExpr`, `ReexportResolver`
