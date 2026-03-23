---
"@mochi-css/builder": major
"@mochi-css/postcss": major
---

# Introduced shared config concept and plugins.

Old setup with next, vite and postcss plugins may not work and need to be checked after upgrading to v3.
If unsure, remove Mochi-CSS from your build tools and run tsuki to ensure your setup is correct.

Now you can hook into two stages of style generation pipeline:

 * source pre-processing via `sourceTransform`
 * ast post-processing via `analysisTransform`

This is only the first step of making the pipeline more flexible.
