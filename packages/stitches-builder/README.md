# 🧁 Mochi-CSS/stitches-builder

This package is part of the [Mochi-CSS project](https://github.com/Niikelion/mochi-css).
It provides the build-side CSS extraction for `@mochi-css/stitches` — a `MochiPlugin` and extractor/generator set that statically extracts styles written with the Stitches-compatible API.

---

## Installation

```bash
npm i -D @mochi-css/stitches-builder
```

---

## Setup

Add `stitchesPlugin()` to your `mochi.config.ts`:

```typescript
// mochi.config.ts
import { defineConfig } from "@mochi-css/config"
import { stitchesPlugin } from "@mochi-css/stitches-builder"

export default defineConfig({
    plugins: [stitchesPlugin()],
})
```

This is the only setup required. The plugin registers all the extractors and generators needed to process `createStitches` calls at build time.

---

## How it works

`stitchesPlugin()` wraps `createExtractorsPlugin([createStitchesExtractor])`. The `StitchesExtractor` is a derived extractor — it matches `createStitches(config)` calls and produces five child extractors (one per returned function: `css`, `styled`, `keyframes`, `globalCss`, `createTheme`). Each child extractor has its own generator that runs the same preprocessing pipeline as the runtime (`expandUtils` → `expandBreakpoints` → `resolveScopedTokens` → `resolveTokens`), ensuring build-time class names match runtime class names exactly.

---

## API

### `stitchesPlugin()`

Returns a `MochiPlugin` that registers `createStitchesExtractor` via `createExtractorsPlugin`.

```typescript
import { stitchesPlugin } from "@mochi-css/stitches-builder"
```

### `createStitchesExtractor`

The root `StyleExtractor` for `createStitches`. Pass to `createExtractorsPlugin` if you need to compose it manually:

```typescript
import { createExtractorsPlugin } from "@mochi-css/plugins"
import { createStitchesExtractor } from "@mochi-css/stitches-builder"

const plugin = createExtractorsPlugin([createStitchesExtractor])
```

### Individual generators

Exported for advanced use cases:

| Export | Description |
|--------|-------------|
| `StitchesGenerator` | Root generator for `createStitches(config)` |
| `StitchesCssGenerator` | Generator for `css()` / `styled()` — runs the full preprocess pipeline |
| `StitchesGlobalCssGenerator` | Generator for `globalCss()` |
| `StitchesKeyframesGenerator` | Generator for `keyframes()` |
| `StitchesCreateThemeGenerator` | Generator for `createTheme()` — emits `.th-xxx { --token: value; }` |
