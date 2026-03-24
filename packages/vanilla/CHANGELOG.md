# @mochi-css/vanilla

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
