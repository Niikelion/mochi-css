---
"@mochi-css/builder": minor
"@mochi-css/vite": minor
"@mochi-css/next": minor
"@mochi-css/postcss": patch
"@mochi-css/tsuki": patch
---

Emit sourcemaps for extracted source files.

The extraction pipeline reprints each touched file from its mutated AST but previously
returned the result with no sourcemap, so the chain back to the original source was severed
at Mochi and everything downstream pointed at the reprinted intermediate.

The builder now produces a sourcemap for every emitted source, composing the printer map with
a map for the pre-parse `filePreProcess` string edit so positions trace all the way back to
the original file. `collectMochiCss` returns these as `sourcemaps`, and the Vite `transform`
and Next.js loader now forward them (offset for any injected CSS `import` lines) so dev tools
map generated code to the real source. esbuild and full PostCSS plumbing are unchanged for now.
