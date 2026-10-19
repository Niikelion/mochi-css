---
"@mochi-css/vite": patch
"@mochi-css/rolldown": patch
"@mochi-css/next": patch
"@mochi-css/tsuki": patch
---

`styled(OtherComponent, ...)` overrides now win over the component's own styles when the two live in different files. Each file's CSS import was prepended, so it loaded before the CSS of the modules the file imports and lost on equal specificity; it now comes after the file's code (imports are hoisted, so it still loads). The global CSS import stays first.
