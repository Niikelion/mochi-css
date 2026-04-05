# @mochi-css/next

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
