---
"@mochi-css/config": minor
---

Added `createBuilder(config, context)` helper that constructs a `Builder` from a resolved `Config` and a `FullContext`. Replaces the boilerplate previously duplicated across the vite, postcss, and next integrations.
