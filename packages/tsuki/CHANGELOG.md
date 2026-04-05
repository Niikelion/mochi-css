# @mochi-css/tsuki

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
