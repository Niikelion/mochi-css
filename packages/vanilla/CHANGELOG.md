# @mochi-css/vanilla

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
    - @mochi-css/builder@7.0.0
    - @mochi-css/plugins@7.0.0
    - @mochi-css/config@7.0.0

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

### Patch Changes

- Updated dependencies [2bec524]
- Updated dependencies [2bec524]
- Updated dependencies [2bec524]
    - @mochi-css/builder@6.0.0
    - @mochi-css/plugins@6.0.0
    - @mochi-css/config@6.0.0
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
    - @mochi-css/plugins@5.0.0
    - @mochi-css/config@5.0.0
    - @mochi-css/core@5.0.0

## 4.0.2

### Patch Changes

- 73816ed: v4 release.

## 5.0.0

### Patch Changes

- Updated dependencies [71b74a6]
    - @mochi-css/config@4.0.0
    - @mochi-css/plugins@4.0.0

## 4.0.0

### Patch Changes

- Updated dependencies [ee02bb1]
- Updated dependencies [7256944]
    - @mochi-css/builder@4.0.0
    - @mochi-css/plugins@3.1.0
    - @mochi-css/config@3.1.0

## 3.0.1

### Patch Changes

- c7c2adb: Bigfixes

## 3.0.0

### Major Changes

- a674152: Small cleanup, no functional or interface change.

## 2.2.0

### Minor Changes

- 27a1717: styled is no longer exported from @mochi-css/vanilla — import it from @mochi-css/react instead

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

### Major Changes

- 383e43f: Reworked media queries

## 1.1.0

### Minor Changes

- 6063c7d: Implemented globalCss function

## 1.0.1

## 1.0.0

### Major Changes

- ba15ebe: Refactored builder & implemented tsuki

### Minor Changes

- 742b4b2: Implemented compound variants

## 0.1.0

### Minor Changes

- 7aa4d94: Made builder more modular and implemented cross-file usage
- 2f7deed: Expanded tests and implemented nested selectors & media queries

### Patch Changes

- 7aa4d94: Improved documentation

## 0.0.3

### Patch Changes

- b20f84f: Updated CI

## 0.0.2

### Patch Changes

- 0b663d9: Added simple test and improved CI
