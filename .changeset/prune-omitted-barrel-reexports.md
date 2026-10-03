---
"@mochi-css/plugins": patch
"@mochi-css/tsuki": patch
---

Remove re-exports of omitted modules from the CSS extraction graph, including empty nested barrels. Mixed workspace barrels can now export styled components alongside ordinary React components and helpers without extraction bundle resolution failures. Application exports remain intact.
