# @mochi-css/react

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

### Minor Changes

- 867321a: Add zero-runtime substitution: `css()`, `keyframes()`, and `globalCss()` call sites are replaced at build time with pre-computed values, eliminating all runtime style object construction overhead.

    **`@mochi-css/plugins`**
    - `StyleGenerator.getArgReplacements()` removed — implement `extractSubstitution(): SWC.Expression | null` and set substitution state inside `collectArgs()` instead
    - New optional field on `StyleExtractor`: `substitution?: { importName?, importPath?, mode: "full" | "args" }` — enables AST replacement of the original call site
    - New default method on `StyleGenerator`: `extractSubstitution(): SWC.Expression | null` — returns `null` by default
    - New hook on `PluginContext`: `postEvalTransforms` — registers `AstPostProcessor` hooks that run after evaluation, before emit; `context.emitModifiedSource(filePath, code)` writes transformed source back
    - `Builder.collectStylesFromModules` return type is now `{ chunks: Map<string, Set<string>>; modifiedSources: Map<string, string> }` (was `Map<string, Set<string>>`)

    **`@mochi-css/vanilla`**
    - `css()` call sites are substituted with `_mochiPrebuilt(classNames, variantClassNames, defaultVariants)` at build time
    - `keyframes()` call sites are substituted with the animation name string literal at build time
    - `globalCss()` call sites are substituted with `void 0` at build time
    - New export `_mochiPrebuilt` — used by the build pipeline; not intended for direct use

    **`@mochi-css/vanilla-react`**
    - `styled()` call sites are substituted with `styled(target, _mochiPrebuilt(...))` at build time; the runtime `styled()` function detects the pre-built instance and skips redundant `css()` construction

### Patch Changes

- Updated dependencies [867321a]
- Updated dependencies [867321a]
    - @mochi-css/plugins@7.0.0
    - @mochi-css/config@7.0.0
    - @mochi-css/vanilla@7.0.0

## 6.0.0

### Major Changes

- 2bec524: Fixed several bugs that caused build failures in projects using barrel/reexport files.

    **`@mochi-css/builder`**
    - `RolldownBundler` now resolves directory imports to `index.ts` / `index.tsx` / `index.js` / `index.jsx` inside the virtual file system (e.g. `import { foo } from "../../components/banner"` where `banner/` is a directory with an `index.ts`)

    **`@mochi-css/plugins`**
    - Barrel files (`export * from "./..."` / `export { x } from "./..."`) are now included in the `.mochi/` bundle with their reexport declarations instead of being omitted. Previously, any source file that imported from a barrel whose exports had no CSS expressions would fail to bundle with an `UNRESOLVED_IMPORT` error.
    - `ReexportResolver` (from `@mochi-css/plugins`) is now wired into `prepareAnalysis` and `getFilesToBundle` so that CSS argument propagation correctly traces symbols imported through barrel files. This fixes the "unresolved symbol" error when a `css()` call argument referenced a binding imported via a reexport chain.

    **`@mochi-css/vanilla`**
    - `MochiCSS.selector` now uses `""` join (compound selector) consistently — corrected test expectations that incorrectly assumed comma-separated output.
    - `styledIdPlugin` is no longer re-exported from `@mochi-css/vanilla/config` — import it from `@mochi-css/plugins` directly.

    **`@mochi-css/vanilla-react`**
    - `styledIdPlugin` is no longer re-exported from `@mochi-css/vanilla-react/config` — import it from `@mochi-css/plugins` directly.

    **`@mochi-css/vite`**
    - `handleHotUpdate` now includes the invalidated virtual CSS modules in its return value, ensuring browsers receive the HMR update for changed styles.

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

### Patch Changes

- Updated dependencies [2bec524]
- Updated dependencies [2bec524]
- Updated dependencies [2bec524]
    - @mochi-css/plugins@6.0.0
    - @mochi-css/vanilla@6.0.0
    - @mochi-css/config@6.0.0

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
    - @mochi-css/plugins@5.0.0
    - @mochi-css/config@5.0.0
    - @mochi-css/vanilla@5.0.0

## 4.0.0

### Major Changes

- 71b74a6: Align all packages to v4.

### Patch Changes

- Updated dependencies [71b74a6]
    - @mochi-css/config@4.0.0
    - @mochi-css/plugins@4.0.0
    - @mochi-css/vanilla@5.0.0

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

- Updated dependencies [7256944]
    - @mochi-css/plugins@3.1.0
    - @mochi-css/config@3.1.0
    - @mochi-css/vanilla@4.0.0

## 3.0.0

### Major Changes

- a674152: Extracted `styled` function from vanilla to separate `react` package.

### Patch Changes

- Updated dependencies [a674152]
    - @mochi-css/vanilla@3.0.0

## 2.2.0

### Minor Changes

- 27a1717: styled is no longer exported from @mochi-css/vanilla — import it from @mochi-css/react instead

### Patch Changes

- Updated dependencies [27a1717]
    - @mochi-css/vanilla@2.2.0
