# @mochi-css/next

## 6.0.1

### Patch Changes

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

- Updated dependencies [867321a]
  - @mochi-css/builder@7.0.0
  - @mochi-css/config@7.0.0

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

### Patch Changes

- Updated dependencies [2bec524]
- Updated dependencies [2bec524]
- Updated dependencies [2bec524]
  - @mochi-css/builder@6.0.0
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
  - @mochi-css/builder@5.0.0
  - @mochi-css/config@5.0.0

## 4.0.2

### Patch Changes

- 1a06756: Fix Windows path handling and Next.js/Vite integration issues.

  **Posix paths internally (`@mochi-css/builder`):** All internal paths now use forward slashes regardless of platform. A new `path` utility (exported from the package) wraps Node's system path operations and normalizes output to forward slashes; `fromSystemPath`/`toSystemPath` convert at filesystem boundaries. `findAllFiles` accepts and returns posix paths; `parseFile` converts to system path only for the `fs.readFile` call. This eliminates silent CSS injection failures on Windows caused by mixed path separators in `Module.filePath`, manifest keys, and virtual module IDs.

  **Dev mode deadlock (`@mochi-css/next`, `@mochi-css/postcss`):** When `withMochi()` starts its file watcher it sets a process-level flag. The PostCSS plugin now checks this flag and skips its own build entirely, emitting a one-time warning instead. Previously both ran `collectMochiCss()` concurrently via separate `RolldownBundler` instances, deadlocking on Windows.

  **Production double-build (`@mochi-css/next`):** `withMochi()` now adds a webpack `beforeRun` plugin that runs a one-shot CSS build before webpack starts. Previously the PostCSS plugin raced with the webpack loader on first build, leaving `.mochi/manifest.json` missing and requiring a second `next build`.

  **Global CSS injection (`@mochi-css/next`, `@mochi-css/vite`):** The webpack loader and Vite transform hook now unconditionally inject the global CSS import when one is present, regardless of whether the file has per-file CSS. Previously, files with no per-file entry skipped global injection entirely when `splitCss: false`.

  **Tsuki nextjs preset (`@mochi-css/tsuki`):** The `nextjs` preset no longer registers `@mochi-css/postcss`. The `withMochi()` watcher (dev) and `beforeRun` pre-build (prod) cover all CSS needs for Next.js without PostCSS. Both the `vite` and `nextjs` presets now also append `.mochi` to `.gitignore`. `createMochiConfigModule` accepts a `splitCss` option; the `nextjs` preset passes `splitCss: true` by default.

- Updated dependencies [1a06756]
  - @mochi-css/builder@4.0.1

## 4.0.1

### Patch Changes

- 842872d: Fix Next.js integration issues: path normalization on Windows, dev mode deadlock, and production double-build.

  **Path normalization (`@mochi-css/next`, `@mochi-css/postcss`):** Manifest keys for source files and sourcemods are now normalized to forward slashes when written. The webpack loader also normalizes `resourcePath` before manifest lookups. Previously, backslash paths on Windows caused CSS injection and source transforms (styledId `s-` class injection) to silently do nothing.

  **Dev mode deadlock (`@mochi-css/next`, `@mochi-css/postcss`):** When `withMochi()` starts its file watcher, it sets a process-level flag. The PostCSS plugin now checks this flag and skips its own build entirely, emitting a one-time warning instead. Previously, both ran `collectMochiCss()` concurrently via separate `RolldownBundler` instances, deadlocking on Windows.

  **Production double-build (`@mochi-css/next`):** `withMochi()` now adds a webpack `beforeRun` plugin that runs a one-shot CSS build before webpack starts processing files. Previously, the PostCSS plugin raced with the webpack loader on first build, leaving `.mochi/manifest.json` missing and requiring a second `next build` to get styles.

  **Tsuki nextjs preset (`@mochi-css/tsuki`):** The `nextjs` preset no longer registers `@mochi-css/postcss`. The `withMochi()` watcher (dev) and `beforeRun` pre-build (prod) together cover all CSS needs for Next.js without PostCSS.

- df6855e: Fix global CSS not being injected when `splitCss` is `false` or unset.

  The Next.js webpack loader and Vite transform hook were skipping global CSS injection whenever a source file had no per-file CSS entry in the manifest. When `splitCss: false`, all generated CSS goes into `global` and `files` is empty, so no styles were applied at all. Both integrations now unconditionally inject the global CSS import when one is present in the manifest.

## 4.0.0

### Major Changes

- 71b74a6: Align all packages to v4.

### Patch Changes

- Updated dependencies [71b74a6]
  - @mochi-css/config@4.0.0

## 3.0.1

### Patch Changes

- Updated dependencies [ee02bb1]
- Updated dependencies [7256944]
  - @mochi-css/builder@4.0.0
  - @mochi-css/config@3.1.0

## 3.0.0

### Major Changes

- a674152: # Introduced shared config and improved HMR.

  Aside from performance improvements and fixes for HMR, this version also changed fundamental ways the framework integrations work.
  They no longer run plugins and code transformations themselves, but merely apply diffs emitted by builder from postcss plugin.

### Patch Changes

- Updated dependencies [a674152]
- Updated dependencies [cc1b53a]
  - @mochi-css/config@3.0.0
  - @mochi-css/builder@3.0.0

## 2.0.1

### Patch Changes

- adccaca: Changed release process

## 2.0.0

## 1.1.0

## 1.0.1

### Patch Changes

- 0be83bb: Fixed publishing to npm

## 1.0.0
