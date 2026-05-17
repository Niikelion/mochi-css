---
"@mochi-css/next": patch
"@mochi-css/tsuki": patch
---

Fix Turbopack production builds: loader now triggers `buildCssOnce` on demand when no manifest exists, so source transforms are applied even without a webpack `beforeRun` hook.
