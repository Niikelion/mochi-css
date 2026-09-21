---
"@mochi-css/builder": major
"@mochi-css/config": major
"@mochi-css/plugins": minor
"@mochi-css/tsuki": patch
---

Graceful per-file error isolation during CSS extraction, with diagnostics mapped all the way
back to the original source file (#44).

Same per-file `try`/`catch` isolation as the sibling PR (extraction no longer aborts for the
entire project when one file throws at module scope — see that changeset for the full
rationale), but goes further on the diagnostic-quality side: `MOCHI_FILE_EXEC`'s `line`/`column`
are now resolved through **two** hops of sourcemap lookup instead of one, landing on the exact
line in the user's **original** file rather than a position in the extracted/minimized
intermediate.

This required widening the `getFilesToBundle` hook's return shape everywhere it's threaded:

- **`@mochi-css/builder`** — `ExtractedFile = { code: string; map?: string }` is now exported;
  `getFilesToBundle` returns `Record<string, ExtractedFile | null>` instead of
  `Record<string, string | null>`. `RolldownBundler.bundle()` now passes an explicit `dir` to
  Rolldown so the bundle sourcemap's relative source paths are predictable enough to resolve
  back to each file's own map. **Breaking** for custom `Bundler` implementations (same as the
  sibling PR) and for any `BuilderOptions.getFilesToBundle` implementation.
- **`@mochi-css/config`** — `GetFilesToBundleHookProvider.register()`'s callback return type
  changed to match. **Breaking** for any plugin directly registering a `getFilesToBundle` hook.
- **`@mochi-css/plugins`** — `extractRelevantSymbols` now prints each file with
  `sourceMaps: true`, returning `{ code, map }` instead of a bare string.

## Alternative

A sibling PR keeps the same Part A but does only the first sourcemap hop (bundle position →
extracted/minimized file position), without touching `getFilesToBundle`'s return shape at all —
smaller, lower-risk, doesn't reach the original file's exact line. This PR exists to compare the
two directly.
