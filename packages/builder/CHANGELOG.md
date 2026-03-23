# @mochi-css/builder

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
    - @mochi-css/vanilla@3.0.0

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
    - @mochi-css/vanilla@2.1.0

## 2.0.1

### Patch Changes

- adccaca: Changed release process
- Updated dependencies [adccaca]
    - @mochi-css/vanilla@2.0.1

## 2.0.0

### Patch Changes

- Updated dependencies [383e43f]
    - @mochi-css/vanilla@2.0.0

## 1.1.0

### Minor Changes

- b453f9c: Add derived extractor support.
  `StyleExtractor` now accepts an optional `derivedExtractors` map, enabling extractors that return child extractors (e.g. a `createTheme()` that yields a scoped `css` function).
  Return values must be destructured with an object pattern; cross-file derived extractors are discovered automatically.
- 6063c7d: Implemented globalCss function

### Patch Changes

- Updated dependencies [6063c7d]
    - @mochi-css/vanilla@1.1.0

## 1.0.1

### Patch Changes

- @mochi-css/vanilla@1.0.1

## 1.0.0

### Major Changes

- ba15ebe: Refactored builder & implemented tsuki

### Minor Changes

- 82f71b2: Implemented treeshaking and added vite & next plugins

### Patch Changes

- Updated dependencies [ba15ebe]
- Updated dependencies [742b4b2]
    - @mochi-css/vanilla@1.0.0

## 0.1.0

### Minor Changes

- 7aa4d94: Made builder more modular and implemented cross-file usage
- 2f7deed: Expanded tests and implemented nested selectors & media queries

### Patch Changes

- 7aa4d94: Improved documentation
- Updated dependencies [7aa4d94]
- Updated dependencies [7aa4d94]
- Updated dependencies [2f7deed]
    - @mochi-css/vanilla@0.1.0

## 0.0.3

### Patch Changes

- b20f84f: Updated CI
- Updated dependencies [b20f84f]
    - @mochi-css/vanilla@0.0.3

## 0.0.2

### Patch Changes

- 0b663d9: Added simple test and improved CI
- Updated dependencies [0b663d9]
    - @mochi-css/vanilla@0.0.2
