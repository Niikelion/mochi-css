---
"@mochi-css/builder": major
"@mochi-css/plugins": minor
"@mochi-css/tsuki": patch
---

Graceful per-file error isolation during CSS extraction, with sourcemap-mapped diagnostics (#44).

Previously, all extracted files are bundled and executed together in one shared script (required
for cross-file imports, wildcard re-exports, and derived-extractor propagation to resolve
correctly) — so a runtime throw anywhere in one file's module-level code aborted extraction for
the **entire project**, and on every dev-server HMR recollect, not just the initial build.

**`@mochi-css/plugins`** — each extracted file's generated module body is now wrapped in a
`try`/`catch` at code-generation time. Exported bindings are pre-declared as `let` outside the
`try` and assigned inside it, so if the assignment never runs (an earlier statement in that file
threw), the export still exists — just `undefined` — instead of crashing module linking for the
whole shared script. On catch, a new `MOCHI_FILE_EXEC` warning diagnostic names the file and the
real error message. Handles `const`/`let` (single, multi-declarator, destructured), `function`/
`class` declarations, and `export default`.

**`@mochi-css/builder`** — `MOCHI_FILE_EXEC` diagnostics now carry a real `line`/`column`,
resolved from the bundler's own sourcemap rather than left blank. This required a breaking change:
`Bundler.bundle()` now returns `Promise<{ code: string; map?: SourceMap }>` instead of
`Promise<string>` — anyone implementing a custom `Bundler` needs to update their return shape.
`RolldownBundler` now requests `sourcemap: true` from Rolldown accordingly.

Net effect: a broken file now degrades to "no styles from that file, plus a diagnostic with a
usable position" instead of taking down extraction for every file in the project — including
mid dev-server session, where fixing the broken file recovers extraction without restarting the
dev server.
