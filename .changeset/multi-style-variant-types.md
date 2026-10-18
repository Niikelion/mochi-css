---
"@mochi-css/vanilla": patch
"@mochi-css/vanilla-react": patch
"@mochi-css/react": patch
"@mochi-css/stitches": patch
---

Keep variant types when `css()` or `styled()` receives several styles and some of them have no `variants`. Previously one plain style, such as `styled("p", tones, { margin: 0 })`, made TypeScript give up inferring the whole argument list, so variant props were missing (styled) or accepted any value (`css().variant()`).
