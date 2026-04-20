# @mochi-css/config

## 7.0.0

### Major Changes

- 867321a: Refactor stage initialization: stages receive a `StageContext` object instead of a bare `CacheRegistry`, and per-file callbacks are moved into the stage runner itself.

    **`@mochi-css/builder`**
    - `StageDefinition.init` first parameter is now `StageContext` (`{ registry, log, resolveImport }`) instead of `CacheRegistry`; destructure `{ registry }` to preserve existing behavior
    - `BuilderOptions.onDiagnostic` is now required (was optional); pass `() => {}` if unused
    - `BuilderOptions.initializeStages` callback signature changed from `(runner, modules, resolveImport, onDiagnostic) => void` to `(runner) => void`
    - `StageRunner` constructor now accepts `(modules, stages, onDiagnostic, resolveImport)`; callers no longer need to seed module data manually
    - New export: `StageContext` type

    **`@mochi-css/plugins`**
    - `ImportSpecStageOut.fileCallbacks` (`FileInput<FileCallbacks>`) removed — `resolveImport` and `log` are now accessible via `StageContext` in `init()`
    - `FileCallbacks` type removed
    - `BindingStage` and `ExportsStage` no longer depend on `importStageDef`

    **`@mochi-css/config`**
    - `InitializeStagesHookProvider.register` callback type narrowed to `(runner: StageRunner) => void`

    **`@mochi-css/stitches`**
    - `StitchesGenerator.collectArgs` return type changed from `Record<string, StyleGenerator>` to `void`; sub-generators are now accessible via `getLastSubGenGroup()` instead of the return value

### Patch Changes

- Updated dependencies [867321a]
    - @mochi-css/builder@7.0.0

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

### Minor Changes

- 2bec524: Added `createBuilder(config, context)` helper that constructs a `Builder` from a resolved `Config` and a `FullContext`. Replaces the boilerplate previously duplicated across the vite, postcss, and next integrations.

### Patch Changes

- Updated dependencies [2bec524]
- Updated dependencies [2bec524]
    - @mochi-css/builder@6.0.0
    - @mochi-css/core@6.0.0

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

### Patch Changes

- Updated dependencies [c50b75a]
    - @mochi-css/builder@5.0.0
    - @mochi-css/core@5.0.0

## 4.0.0

### Major Changes

- 71b74a6: Align all packages to v4.

### Patch Changes

- Updated dependencies [71b74a6]
    - @mochi-css/core@4.0.0

## 3.1.0

### Minor Changes

- 7256944: ## New package: `@mochi-css/plugins`

    Introduces `@mochi-css/plugins` as the home for `createExtractorsPlugin` and the plugin utilities layer.

    ### `createExtractorsPlugin(extractors)`

    Packages a list of `StyleExtractor` instances as a `MochiPlugin`. When loaded via `plugin.onLoad(ctx)`, it registers the analysis stages, source transform (sets up per-build generators), and emit hook (calls `generateStyles()`, emits CSS via `context.emitChunk()`, applies AST arg replacements).

    ```typescript
    import { createExtractorsPlugin } from "@mochi-css/plugins"
    import { defaultExtractors } from "@mochi-css/builder"

    const plugin = createExtractorsPlugin(defaultExtractors)
    ```

    ### `PluginContextCollector`

    A lightweight `PluginContext` implementation that collects hooks into arrays — useful for unit-testing plugins or building minimal integrations without the full `FullContext` from `@mochi-css/config`.

    ```typescript
    import { PluginContextCollector } from "@mochi-css/plugins"

    const collector = new PluginContextCollector(onDiagnostic)
    plugin.onLoad(collector)
    // collector.getStages(), collector.getSourceTransforms(), etc.
    ```

    ***

    ## New features (`@mochi-css/config`)

    ### `MochiPlugin.onLoad`

    `MochiPlugin` now supports an `onLoad(context: PluginContext)` hook called after config resolution. Use it to register stages, source transforms, emit hooks, and cleanup functions.

    ```typescript
    export const myPlugin: MochiPlugin = {
        name: "my-plugin",
        onLoad(context) {
            context.emitHooks.register(async (_index, ctx) => {
                ctx.emitChunk("output.txt", "generated")
            })
        },
    }
    ```

    ### `PluginContext` interface and `FullContext` class

    `PluginContext` is the context object passed to `onLoad`. `FullContext` is the concrete implementation used by integrations (Vite, PostCSS, Next.js). Its fields — `stages`, `sourceTransforms`, `emitHooks`, `cleanup`, `filePreProcess` — map directly to `BuilderOptions`.

    ```typescript
    import { FullContext } from "@mochi-css/config"

    const ctx = new FullContext(onDiagnostic)
    for (const plugin of plugins) plugin.onLoad?.(ctx)

    new Builder({
        stages: [...ctx.stages.getAll()],
        sourceTransforms: [...ctx.sourceTransforms.getAll()],
        emitHooks: [...ctx.emitHooks.getAll()],
        cleanup: () => ctx.cleanup.runAll(),
        // ...
    })
    ```

    ### `styledIdPlugin(extractors)`

    A new built-in `MochiPlugin` that injects stable `s-` class IDs into every `styled()` call matched by the given extractors. IDs are derived from the source file path and variable name, ensuring they remain stable across incremental builds.

    Registers two hooks:
    - `filePreProcess` — text-level injection for runtime source (used by Vite/Next `transform` hooks)
    - `sourceTransforms` — AST-level injection for CSS extraction

    Idempotent — calls that already carry an `s-` ID are skipped.

    ***

    ## New package: `@mochi-css/vanilla-react`

    Introduces `@mochi-css/vanilla-react` — a thin package combining `@mochi-css/vanilla` styled components with a config entry point (`@mochi-css/vanilla-react/config`) that pre-wires the `styled` extractor and `styledIdPlugin`.

    ```typescript
    // mochi.config.ts
    import { defineConfig } from "@mochi-css/vanilla-react/config"

    export default defineConfig({
        roots: ["src"],
        splitCss: true,
    })
    ```

### Patch Changes

- Updated dependencies [ee02bb1]
    - @mochi-css/builder@4.0.0

## 3.0.0

### Major Changes

- a674152: # Introduced shared config concept and pipeline plugins.

    Thanks to the shared config, all the options should be consistent across all the integrations.
    This avoids a lot of misconfigurations.

    One of the built-in plugins

    Old setup with next, vite and postcss plugins may not work and need to be checked after upgrading to v3.
    If unsure, remove Mochi-CSS from your build tools and run tsuki to ensure your setup is correct.

### Patch Changes

- Updated dependencies [a674152]
- Updated dependencies [cc1b53a]
    - @mochi-css/vanilla@3.0.0
    - @mochi-css/builder@3.0.0
