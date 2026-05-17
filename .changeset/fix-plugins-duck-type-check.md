---
"@mochi-css/plugins": patch
---

Replace `instanceof StyleGenerator` with a duck-type check in `wrapGenerator`. The `instanceof` check fails after object spread across VM context boundaries; the duck-type check is robust to that.
