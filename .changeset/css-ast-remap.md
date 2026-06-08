---
"@mochi-css/builder": minor
"@mochi-css/plugins": minor
"@mochi-css/vanilla": patch
"@mochi-css/tsuki": patch
---

Add `createClassRemapPlugin()`: a standalone MochiPlugin that remaps CSS class names to a shorter file-hash-prefix + sequential-index scheme, improving gzip compression. Adds `postProcessHooks` pipeline phase to Builder (runs after emitHooks with access to mutable CSS ASTs and JS file ASTs). Adds `emitCssAst()` to `AnalysisContext` for deferred CSS serialization. Adds `generateCssAst()`, `emitCssChunks()`, and `getIdentifierLiterals()` to `StyleGenerator`; `generateStyles()` is now concrete with a default that serializes from `generateCssAst()`. `createClassRemapPlugin` now accepts an optional `ClassRemapOptions` argument with a `remapFn` callback to override the default naming scheme. Introduces `generatorsStageDef` analysis stage: generators are now exposed via the stage runner rather than the `createExtractorsPlugin` return value; `createClassRemapPlugin` no longer takes an `extractorsPlugin` argument.
