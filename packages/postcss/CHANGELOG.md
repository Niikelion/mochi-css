# @mochi-css/postcss

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

- cc1b53a: # Introduced shared config concept and plugins.

  Old setup with next, vite and postcss plugins may not work and need to be checked after upgrading to v3.
  If unsure, remove Mochi-CSS from your build tools and run tsuki to ensure your setup is correct.

  Now you can hook into two stages of style generation pipeline:
  - source pre-processing via `sourceTransform`
  - ast post-processing via `analysisTransform`

  This is only the first step of making the pipeline more flexible.

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

- @mochi-css/builder@1.0.1

## 1.0.0

### Major Changes

- ba15ebe: Refactored builder & implemented tsuki

### Minor Changes

- 82f71b2: Implemented treeshaking and added vite & next plugins

### Patch Changes

- Updated dependencies [82f71b2]
- Updated dependencies [ba15ebe]
  - @mochi-css/builder@1.0.0

## 0.1.0

### Minor Changes

- 7aa4d94: Made builder more modular and implemented cross-file usage
- 2f7deed: Expanded tests and implemented nested selectors & media queries

### Patch Changes

- 7aa4d94: Improved documentation
- Updated dependencies [7aa4d94]
- Updated dependencies [7aa4d94]
- Updated dependencies [2f7deed]
  - @mochi-css/builder@0.1.0

## 0.0.3

### Patch Changes

- b20f84f: Updated CI
- Updated dependencies [b20f84f]
  - @mochi-css/builder@0.0.3

## 0.0.2

### Patch Changes

- 0b663d9: Added simple test and improved CI
- Updated dependencies [0b663d9]
  - @mochi-css/builder@0.0.2
