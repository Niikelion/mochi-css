# @mochi-css/tsuki

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

- c50b75a: Sync tsuki to v5 alongside the rest of the mochi-css suite.

    `tsuki`'s `mochiPackage()` helper uses tsuki's own major version to compute the version range it installs (e.g. `@mochi-css/vanilla@^5.0.0`). Bumping tsuki to v5 ensures it installs the v5 suite packages.

## 4.0.2

### Patch Changes

- 1a06756: Fix Windows path handling and Next.js/Vite integration issues.

    **Posix paths internally (`@mochi-css/builder`):** All internal paths now use forward slashes regardless of platform. A new `path` utility (exported from the package) wraps Node's system path operations and normalizes output to forward slashes; `fromSystemPath`/`toSystemPath` convert at filesystem boundaries. `findAllFiles` accepts and returns posix paths; `parseFile` converts to system path only for the `fs.readFile` call. This eliminates silent CSS injection failures on Windows caused by mixed path separators in `Module.filePath`, manifest keys, and virtual module IDs.

    **Dev mode deadlock (`@mochi-css/next`, `@mochi-css/postcss`):** When `withMochi()` starts its file watcher it sets a process-level flag. The PostCSS plugin now checks this flag and skips its own build entirely, emitting a one-time warning instead. Previously both ran `collectMochiCss()` concurrently via separate `RolldownBundler` instances, deadlocking on Windows.

    **Production double-build (`@mochi-css/next`):** `withMochi()` now adds a webpack `beforeRun` plugin that runs a one-shot CSS build before webpack starts. Previously the PostCSS plugin raced with the webpack loader on first build, leaving `.mochi/manifest.json` missing and requiring a second `next build`.

    **Global CSS injection (`@mochi-css/next`, `@mochi-css/vite`):** The webpack loader and Vite transform hook now unconditionally inject the global CSS import when one is present, regardless of whether the file has per-file CSS. Previously, files with no per-file entry skipped global injection entirely when `splitCss: false`.

    **Tsuki nextjs preset (`@mochi-css/tsuki`):** The `nextjs` preset no longer registers `@mochi-css/postcss`. The `withMochi()` watcher (dev) and `beforeRun` pre-build (prod) cover all CSS needs for Next.js without PostCSS. Both the `vite` and `nextjs` presets now also append `.mochi` to `.gitignore`. `createMochiConfigModule` accepts a `splitCss` option; the `nextjs` preset passes `splitCss: true` by default.

## 4.0.1

### Patch Changes

- 842872d: Fix Next.js integration issues: path normalization on Windows, dev mode deadlock, and production double-build.

    **Path normalization (`@mochi-css/next`, `@mochi-css/postcss`):** Manifest keys for source files and sourcemods are now normalized to forward slashes when written. The webpack loader also normalizes `resourcePath` before manifest lookups. Previously, backslash paths on Windows caused CSS injection and source transforms (styledId `s-` class injection) to silently do nothing.

    **Dev mode deadlock (`@mochi-css/next`, `@mochi-css/postcss`):** When `withMochi()` starts its file watcher, it sets a process-level flag. The PostCSS plugin now checks this flag and skips its own build entirely, emitting a one-time warning instead. Previously, both ran `collectMochiCss()` concurrently via separate `RolldownBundler` instances, deadlocking on Windows.

    **Production double-build (`@mochi-css/next`):** `withMochi()` now adds a webpack `beforeRun` plugin that runs a one-shot CSS build before webpack starts processing files. Previously, the PostCSS plugin raced with the webpack loader on first build, leaving `.mochi/manifest.json` missing and requiring a second `next build` to get styles.

    **Tsuki nextjs preset (`@mochi-css/tsuki`):** The `nextjs` preset no longer registers `@mochi-css/postcss`. The `withMochi()` watcher (dev) and `beforeRun` pre-build (prod) together cover all CSS needs for Next.js without PostCSS.

- df6855e: Improve preset setup for Next.js and Vite projects.
    - `createGitignoreModule(entry)` appends a given entry to `.gitignore`, creating the file if it does not exist and skipping entries already present. Both the `vite` and `nextjs` presets register this module so the `.mochi` output directory is automatically excluded from version control.
    - `createMochiConfigModule` now accepts a `splitCss` option. When set, it is written into new `mochi.config.ts` files and patched into existing ones. The `nextjs` preset passes `splitCss: true` by default so per-file CSS injection works out of the box.

## 4.0.0

### Major Changes

- 71b74a6: Align all packages to v4.

## 3.0.0

### Major Changes

- a674152: Updated to reflect the changes to other packages.

## 2.1.0

### Minor Changes

- 45659fd: `rootDir: string` has been replaced with `roots: RootEntry[]` where
  `RootEntry = string | { path: string; package: string }`. This enables:
    - Multiple source roots scanned in a single build
    - Named roots that map a package name to a local source directory,
      so cross-package imports resolve correctly in monorepos

    Migration: replace `rootDir: "src"` with `roots: ["src"]`.

    Also adds `isMochiCSS(value)` type guard to `@mochi-css/vanilla`.

    `@mochi-css/tsuki` now supports non-interactive mode via `--no-interactive`
    and preset selection via `--preset <vite|nextjs|lib>`, with additional flags
    `--postcss`, `--vite`, and `--next` for specifying config paths without prompts.
    Useful for scripted or CI setup.

## 2.0.1

### Patch Changes

- adccaca: Changed release process

## 2.0.0

### Minor Changes

- 3f5a2dc: Added presets for nextjs and vite

## 1.1.0

## 1.0.1

### Patch Changes

- 0be83bb: Fixed publishing to npm

## 1.0.0

### Major Changes

- ba15ebe: Refactored builder & implemented tsuki
