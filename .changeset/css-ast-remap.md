---
"@mochi-css/builder": minor
"@mochi-css/plugins": minor
"@mochi-css/vanilla": patch
---

Add `createClassRemapPlugin()`: a standalone MochiPlugin that remaps CSS class names to a shorter file-hash-prefix + sequential-index scheme, improving gzip compression. Adds `postProcessHooks` pipeline phase to Builder (runs after emitHooks with access to mutable CSS ASTs and JS file ASTs). Adds `emitCssAst()` to `AnalysisContext` for deferred CSS serialization. Adds `generateCssAst()`, `emitCssChunks()`, and `getIdentifierLiterals()` to `StyleGenerator`; `generateStyles()` is now concrete with a default that serializes from `generateCssAst()`.
