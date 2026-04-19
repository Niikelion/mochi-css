---
"@mochi-css/builder": major
"@mochi-css/plugins": major
"@mochi-css/config": major
"@mochi-css/vanilla": major
"@mochi-css/vanilla-react": major
"@mochi-css/stitches": major
"@mochi-css/tsuki": major
---

Refactor stage initialization: stages receive a `StageContext` object instead of a bare `CacheRegistry`, and per-file callbacks are moved into the stage runner itself.

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
