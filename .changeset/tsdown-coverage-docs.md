---
"@mochi-css/rolldown": patch
"@mochi-css/tsuki": patch
---

Document tsdown usage and cover the tsdown tsuki preset (#39).

- `@mochi-css/rolldown` README now notes it works with both `@mochi-css/vanilla-react` and
  `@mochi-css/stitches`, and documents the `splitCss` option (single combined CSS file vs
  one file per source module).
- Added unit tests for the tsdown tsuki module (`tsdown.spec.ts`) and the `tsdownPreset`
  (`presets.spec.ts`), matching the coverage the vite/next integrations already had.
