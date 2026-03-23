---
"@mochi-css/next": major
"@mochi-css/vite": major
---

# Introduced shared config and improved HMR.

Aside from performance improvements and fixes for HMR, this version also changed fundamental ways the framework integrations work.
They no longer run plugins and code transformations themselves, but merely apply diffs emitted by builder from postcss plugin.
