---
"@mochi-css/stitches": major
"@mochi-css/stitches-builder": major
---

Moved stitches build tooling into `@mochi-css/stitches/config` subpath. The separate `@mochi-css/stitches-builder` package has been removed.

**`@mochi-css/stitches`**

- New `./config` subpath export — replaces `@mochi-css/stitches-builder`
- `stitchesPlugin`, `StitchesExtractor`, `createStitchesExtractor`, and all generator classes (`StitchesGenerator`, `StitchesCssGenerator`, `StitchesGlobalCssGenerator`, `StitchesKeyframesGenerator`, `StitchesCreateThemeGenerator`) are now exported from `@mochi-css/stitches/config`

**`@mochi-css/stitches-builder`**

- Package removed — import from `@mochi-css/stitches/config` instead
