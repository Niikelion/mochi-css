# @mochi-css/vite

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

### Patch Changes

- Updated dependencies [45659fd]
  - @mochi-css/builder@2.1.0

## 2.0.1

### Patch Changes

- adccaca: Changed release process
- Updated dependencies [adccaca]
  - @mochi-css/builder@2.0.1

## 2.0.0

### Patch Changes

- @mochi-css/builder@2.0.0

## 1.1.0

### Patch Changes

- Updated dependencies [b453f9c]
- Updated dependencies [6063c7d]
  - @mochi-css/builder@1.1.0

## 1.0.1

### Patch Changes

- 0be83bb: Fixed publishing to npm
  - @mochi-css/builder@1.0.1

## 1.0.0

### Patch Changes

- Updated dependencies [82f71b2]
- Updated dependencies [ba15ebe]
  - @mochi-css/builder@1.0.0
