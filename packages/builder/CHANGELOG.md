# @mochi-css/builder

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
