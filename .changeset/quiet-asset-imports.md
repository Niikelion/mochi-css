---
"@mochi-css/plugins": patch
"@mochi-css/tsuki": patch
---

No more `Cannot resolve local import` warnings for local imports of stylesheets, images, fonts, data files and other assets (such as `import "./styles.css"`), or for imports with a bundler query like `?url` or `?raw`. They hold no styles to extract. A missing script module, including one with a dotted name like `./Button.styles`, still warns.
