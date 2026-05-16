---
"@mochi-css/vanilla-react": patch
---

Switch `styled.ts` to a local duck-typed `RuntimeStyles` interface instead of importing `MochiCSS` directly, avoiding cross-boundary type coupling.
