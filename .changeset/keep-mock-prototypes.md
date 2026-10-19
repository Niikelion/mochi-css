---
"@mochi-css/plugins": patch
"@mochi-css/tsuki": patch
---

Values returned by `keyframes()` and `css()` keep their methods while styles are extracted, so they work inside other styles: `` animation: `${pulse} 1s` `` gets the keyframes name and `` [`${box} &`] `` gets the class selector. Previously the extraction copied them into plain objects, which produced `[object Object]` in the CSS.
