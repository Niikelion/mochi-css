# @mochi-css/vite

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
