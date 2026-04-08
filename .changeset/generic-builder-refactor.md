---
"@mochi-css/builder": major
"@mochi-css/plugins": major
"@mochi-css/config": major
"@mochi-css/core": major
"@mochi-css/vanilla": major
"@mochi-css/vanilla-react": major
"@mochi-css/stitches-builder": major
"@mochi-css/next": major
"@mochi-css/postcss": major
"@mochi-css/vite": major
---

Refactor: move extractor/generator types and pipeline stages from `@mochi-css/builder` to `@mochi-css/plugins`; move `styledIdPlugin` from `@mochi-css/config` to `@mochi-css/plugins`; move `OnDiagnostic` to `@mochi-css/core`.

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
