# @mochi-css/vite

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
