# @mochi-css/stitches

## 1.0.0

### Major Changes

- 42c0476: Moved stitches build tooling into `@mochi-css/stitches/config` subpath. The separate `@mochi-css/stitches-builder` package has been removed.

  **`@mochi-css/stitches`**
  - New `./config` subpath export — replaces `@mochi-css/stitches-builder`
  - `stitchesPlugin`, `StitchesExtractor`, `createStitchesExtractor`, and all generator classes (`StitchesGenerator`, `StitchesCssGenerator`, `StitchesGlobalCssGenerator`, `StitchesKeyframesGenerator`, `StitchesCreateThemeGenerator`) are now exported from `@mochi-css/stitches/config`

  **`@mochi-css/stitches-builder`**
  - Package removed — import from `@mochi-css/stitches/config` instead

### Patch Changes

- Updated dependencies [2bec524]
- Updated dependencies [2bec524]
- Updated dependencies [2bec524]
  - @mochi-css/builder@6.0.0
  - @mochi-css/plugins@6.0.0
  - @mochi-css/vanilla@6.0.0
  - @mochi-css/config@6.0.0
  - @mochi-css/core@6.0.0

## 0.1.4

### Patch Changes

- Updated dependencies [c50b75a]
  - @mochi-css/vanilla@5.0.0

## 0.1.3

### Patch Changes

- @mochi-css/vanilla@5.0.0

## 0.1.2

### Patch Changes

- @mochi-css/vanilla@4.0.0

## 0.1.1

### Patch Changes

- c7c2adb: Bigfixes
- Updated dependencies [c7c2adb]
  - @mochi-css/vanilla@3.0.1

## 0.1.0

### Minor Changes

- 40fdf74: Created first iteration of stitches.js adapter.
