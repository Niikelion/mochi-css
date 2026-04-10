# @mochi-css/stitches-builder

## 1.0.0

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
    - @mochi-css/plugins@5.0.0
    - @mochi-css/config@5.0.0
    - @mochi-css/vanilla@5.0.0
    - @mochi-css/stitches@0.1.4

## 0.1.2

### Patch Changes

- Updated dependencies [71b74a6]
    - @mochi-css/config@4.0.0
    - @mochi-css/plugins@4.0.0
    - @mochi-css/vanilla@5.0.0
    - @mochi-css/stitches@0.1.3

## 0.1.1

### Patch Changes

- Updated dependencies [ee02bb1]
- Updated dependencies [7256944]
    - @mochi-css/builder@4.0.0
    - @mochi-css/plugins@3.1.0
    - @mochi-css/config@3.1.0
    - @mochi-css/stitches@0.1.2
    - @mochi-css/vanilla@4.0.0

## 0.1.0

### Minor Changes

- 40fdf74: Created first iteration of stitches.js adapter.

### Patch Changes

- Updated dependencies [40fdf74]
    - @mochi-css/stitches@0.1.0
