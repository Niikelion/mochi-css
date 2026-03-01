# 🧁 Mochi-CSS/postcss

This package is part of the [Mochi-CSS project](https://github.com/Niikelion/mochi-css).
It integrates static style extraction into your PostCSS builds.

## Installation

```bash
npm i @mochi-css/postcss --save-dev
```

---

## Setup

Add the plugin to your PostCSS config:

```js
// postcss.config.js
module.exports = {
    plugins: {
        '@mochi-css/postcss': {}
    }
}
```

Then create a `src/globals.css` file and import it in your project entry point. The plugin will scan your source files and inject all extracted Mochi-CSS styles into that file at build time.

---

## Options

| Option         | Type               | Default             | Description                                                                            |
|----------------|--------------------|---------------------|----------------------------------------------------------------------------------------|
| `rootDir`      | `string`           | `"src"`             | Directory to scan for source files                                                     |
| `globalCss`    | `RegExp`           | `/\/globals\.css$/` | Pattern that identifies the global CSS file to insert styles into                      |
| `outDir`       | `string`           | —                   | When set, writes per-file CSS and a manifest to this directory (enables CSS splitting) |
| `extractors`   | `StyleExtractor[]` | `defaultExtractors` | Controls which functions are extracted                                                 |
| `bundler`      | `Bundler`          | `RolldownBundler`   | Bundler used to prepare source files for execution                                     |
| `runner`       | `Runner`           | `VmRunner`          | Runner used to execute bundled source files                                            |
| `onDiagnostic` | `OnDiagnostic`     | —                   | Callback for extracting diagnostics (warnings/errors)                                  |

### `rootDir`

Defines where the plugin looks for source files to scan. Adjust this if your sources live outside `src/`:

```js
'@mochi-css/postcss': { rootDir: 'app' }
```

### `globalCss`

Controls where Mochi-CSS inserts global styles. Useful when your globals file has a non-standard name or path:

```js
'@mochi-css/postcss': { globalCss: /\/base\.css$/ }
```

### `outDir` — CSS splitting

When `outDir` is set, the plugin additionally writes per-source-file CSS to disk instead of inlining everything into the globals file.
This enables framework integrations (e.g. `@mochi-css/vite`, `@mochi-css/next`) to load only the styles needed for the current route.

```js
'@mochi-css/postcss': { outDir: '.mochi' }
```

After each build the output directory contains:

```
.mochi/
  global.css        ← global styles (from globalCss())
  <hash>.css        ← per-source-file styles
  manifest.json     ← maps source file paths → CSS file paths
```

`manifest.json` format:

```json
{
    "global": "/abs/path/.mochi/global.css",
    "files": {
        "/abs/path/src/components/Button.tsx": "/abs/path/.mochi/a1b2c3d4.css"
    }
}
```
