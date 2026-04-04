---
"@mochi-css/next": patch
"@mochi-css/vite": patch
---

Fix global CSS not being injected when `splitCss` is `false` or unset.

The Next.js webpack loader and Vite transform hook were skipping global CSS injection whenever a source file had no per-file CSS entry in the manifest. When `splitCss: false`, all generated CSS goes into `global` and `files` is empty, so no styles were applied at all. Both integrations now unconditionally inject the global CSS import when one is present in the manifest.
