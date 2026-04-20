# @mochi-css/stitches

## 2.0.0

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
- Updated dependencies [867321a]
  - @mochi-css/builder@7.0.0
  - @mochi-css/plugins@7.0.0
  - @mochi-css/config@7.0.0
  - @mochi-css/vanilla@7.0.0

## 1.0.0

### Major Changes

- 42c0476: Moved stitches build tooling into `@mochi-css/stitches/config` subpath. The separate `@mochi-css/stitches-builder` package has been removed.

  **`@mochi-css/stitches`**
  - New `./config` subpath export — replaces `@mochi-css/stitches-builder`
  - `stitchesPlugin`, `StitchesExtractor`, `createStitchesExtractor`, and all generator classes (`StitchesGenerator`, `StitchesCssGenerator`, `StitchesGlobalCssGenerator`, `StitchesKeyframesGenerator`, `StitchesCreateThemeGenerator`) are now exported from `@mochi-css/stitches/config`

  **`@mochi-css/stitches-builder`**
  - Package removed — import from `@mochi-css/stitches/config` instead

### Patch Changes

- Updated dependencies [2bec524]
- Updated dependencies [2bec524]
- Updated dependencies [2bec524]
  - @mochi-css/builder@6.0.0
  - @mochi-css/plugins@6.0.0
  - @mochi-css/vanilla@6.0.0
  - @mochi-css/config@6.0.0
  - @mochi-css/core@6.0.0

## 0.1.4

### Patch Changes

- Updated dependencies [c50b75a]
  - @mochi-css/vanilla@5.0.0

## 0.1.3

### Patch Changes

- @mochi-css/vanilla@5.0.0

## 0.1.2

### Patch Changes

- @mochi-css/vanilla@4.0.0

## 0.1.1

### Patch Changes

- c7c2adb: Bigfixes
- Updated dependencies [c7c2adb]
  - @mochi-css/vanilla@3.0.1

## 0.1.0

### Minor Changes

- 40fdf74: Created first iteration of stitches.js adapter.
