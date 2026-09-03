---
"@mochi-css/config": minor
"@mochi-css/tsuki": patch
---

Republish `@mochi-css/config` with the `postProcessHooks` API on `FullContext`. The API was added in PR #32 (the CSS AST post-process pipeline that backs `ClassRemapPlugin`) but `config` was never version-bumped, so the published `@mochi-css/config@7.0.0` tarball shipped without it. `@mochi-css/plugins@7.1.1` calls `ctx.postProcessHooks.register(...)` inside `onLoad`, so installing the published set crashed the Vite dev server at startup with `TypeError: Cannot read properties of undefined (reading 'register')`.

Now that internal dependency ranges are pinned to exact versions, this bump propagates to every dependent (`plugins`, `vite`, `next`, `esbuild`, `postcss`, `stitches`, `vanilla`, `vanilla-react`), republishing a self-consistent set where the `postProcessHooks` producer and consumers agree. Fixes #36.
