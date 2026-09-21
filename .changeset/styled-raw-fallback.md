---
"@mochi-css/vanilla-react": patch
"@mochi-css/tsuki": patch
---

Fix `styled()` throwing (or silently producing broken class names) when called without Mochi's
build-time rewrite having run — e.g. plain dev usage outside the extraction pipeline, tests,
Storybook without extraction wired, or any raw style object reaching it before Mochi processes
the file.

`styled()` assumed its style-object argument was always a prebuilt `MochiCSS` instance (the
shape Mochi's AST rewrite substitutes in for the fast/optimized path) and cast it directly,
with no fallback for a plain style object. It now normalizes its arguments the same way
`css()` (from `@mochi-css/vanilla`) and `@mochi-css/stitches`'s `runtimeStyled` already do:
already-prebuilt `MochiCSS` instances take the fast path unchanged, and plain style objects get
real class names computed at runtime via `CSSObject` — the same deterministic hashing the
extraction pipeline itself uses. Both `css()` and `styled()` now work correctly with or without
the optimized, rewritten call shape; Mochi's rewrite is purely a performance optimization, not a
requirement for correctness.
