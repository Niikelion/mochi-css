---
"@mochi-css/plugins": minor
"@mochi-css/vanilla": minor
"@mochi-css/vanilla-react": minor
"@mochi-css/vite": patch
"@mochi-css/next": patch
---

Add zero-runtime substitution: `css()`, `keyframes()`, and `globalCss()` call sites are replaced at build time with pre-computed values, eliminating all runtime style object construction overhead.

**`@mochi-css/plugins`**

- `StyleGenerator.getArgReplacements()` removed — implement `extractSubstitution(): SWC.Expression | null` and set substitution state inside `collectArgs()` instead
- New optional field on `StyleExtractor`: `substitution?: { importName?, importPath?, mode: "full" | "args" }` — enables AST replacement of the original call site
- New default method on `StyleGenerator`: `extractSubstitution(): SWC.Expression | null` — returns `null` by default
- New hook on `PluginContext`: `postEvalTransforms` — registers `AstPostProcessor` hooks that run after evaluation, before emit; `context.emitModifiedSource(filePath, code)` writes transformed source back
- `Builder.collectStylesFromModules` return type is now `{ chunks: Map<string, Set<string>>; modifiedSources: Map<string, string> }` (was `Map<string, Set<string>>`)

**`@mochi-css/vanilla`**

- `css()` call sites are substituted with `_mochiPrebuilt(classNames, variantClassNames, defaultVariants)` at build time
- `keyframes()` call sites are substituted with the animation name string literal at build time
- `globalCss()` call sites are substituted with `void 0` at build time
- New export `_mochiPrebuilt` — used by the build pipeline; not intended for direct use

**`@mochi-css/vanilla-react`**

- `styled()` call sites are substituted with `styled(target, _mochiPrebuilt(...))` at build time; the runtime `styled()` function detects the pre-built instance and skips redundant `css()` construction
