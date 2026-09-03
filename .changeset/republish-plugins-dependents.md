---
"@mochi-css/vanilla": patch
"@mochi-css/vanilla-react": patch
"@mochi-css/stitches": patch
"@mochi-css/tsuki": patch
---

Republish the packages that depend on `@mochi-css/plugins` so they pick up the `ClassRemapPlugin` fix from `@mochi-css/plugins@7.1.1`. They were skipped in the previous release because internal dependency ranges used caret constraints that the patch bump still satisfied, so Changesets did not consider them changed. Internal dependency ranges are now pinned to exact versions so future dependency bumps always propagate to dependents.
