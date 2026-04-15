# @mochi-css/core

## 6.0.0

### Major Changes

- 2bec524: Refactored CacheEngine to make file data (filePath + ast) a first-class concept, and replaced stage factory functions with static stage definitions.

    **`@mochi-css/core`**
    - `MochiError`, `getErrorMessage`, `Diagnostic`, `OnDiagnostic`, `diagnosticToString`, and `reportGlobalDiagnostic` are now exported from `@mochi-css/core`. These were previously exported from `@mochi-css/builder`; update your imports accordingly.

    **`@mochi-css/builder`**
    - `MochiError`, `getErrorMessage`, `Diagnostic`, and `OnDiagnostic` removed — import from `@mochi-css/core` instead
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

## 5.0.0

### Major Changes

- c50b75a: Refactor: move extractor/generator types and pipeline stages from `@mochi-css/builder` to `@mochi-css/plugins`; move `styledIdPlugin` from `@mochi-css/config` to `@mochi-css/plugins`; move `OnDiagnostic` to `@mochi-css/core`.

    **Breaking changes:**
    - `StyleExtractor`, `StyleGenerator`, and all pipeline stage exports (`ImportSpecStage`, `DerivedExtractorStage`, `StyleExprStage`, `BindingStage`, `CrossFileDerivedStage` and their factory/symbol counterparts) moved from `@mochi-css/builder` to `@mochi-css/plugins`
    - `extractRelevantSymbols` moved from `@mochi-css/builder` to `@mochi-css/plugins`
    - `styledIdPlugin` moved from `@mochi-css/config` to `@mochi-css/plugins`
    - `OnDiagnostic` moved from `@mochi-css/builder` to `@mochi-css/core`
    - `ProjectIndex` removed from `@mochi-css/builder`; replaced by `StageRunner`
    - `AstPostProcessor` and `EmitHook` callback signatures changed: first argument is now `StageRunner` instead of `ProjectIndex`
    - `createDefaultStages` / `defaultStages` removed from `@mochi-css/builder`
    - `CacheRegistry` type split into `CacheRegistry`, `FileCache`, `FileInput`, `ProjectCache` in `@mochi-css/builder`

    See the v4 → v5 migration guide for details.

## 4.0.0

### Major Changes

- 71b74a6: Align all packages to v4.
