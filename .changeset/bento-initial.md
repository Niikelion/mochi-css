---
"@mochi-css/bento": minor
"@mochi-css/rolldown": minor
"@mochi-css/tsuki": patch
---

Add `@mochi-css/bento` — layout primitives package with className generators (`@mochi-css/bento`) and React components (`@mochi-css/bento/react`).

Primitives: `Box`, `Frame`, `Grid`, `Pile`, `Overlay`, `Spacer`, `Divider`, `Apply`. Built with the new `@mochi-css/rolldown` plugin using `externalCss: true` for library distribution.

Add `@mochi-css/rolldown` — Rolldown/tsdown plugin that statically extracts Mochi CSS styles, replacing `@mochi-css/esbuild`. Supports virtual mode (runtime style injection) and external mode (library distribution).

Update tsuki: replace the `esbuild` preset with a `tsdown` preset that generates `tsdown.config.mts` and installs `@mochi-css/rolldown`.
