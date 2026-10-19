---
"@mochi-css/config": minor
"@mochi-css/builder": minor
"@mochi-css/plugins": minor
"@mochi-css/tsuki": patch
---

New `assetExtensions` option in `mochi.config.ts` adds file extensions that count as assets, on top of the built-in stylesheet, image, font, data and media types: `defineConfig({ assetExtensions: ["glsl", "riv"] })`. Local imports of those files aren't reported when they can't be resolved as modules. Builder exposes it as `BuilderOptions.assetExtensions` and `StageContext.assetExtensions`, and plugins' `isAssetImport` takes the extra list as a second argument.
