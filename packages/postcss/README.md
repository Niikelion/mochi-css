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

Then create a `src/globals.css` file and import it in your project entry point.
The plugin will scan your source files and inject all extracted global styles into that file at build time.

---

## Options

Most options are read automatically from `mochi.config.ts`.
See [`@mochi-css/config`](../config/README.md) for the full list.

The following options are specific to the PostCSS plugin:

| Option      | Type      | Default             | Description                                                                            |
|-------------|-----------|---------------------|----------------------------------------------------------------------------------------|
| `globalCss` | `RegExp`  | `/\/globals\.css$/` | Pattern that identifies the global CSS file to insert styles into                      |
| `tmpDir`    | `string`  | -                   | When set, writes per-file CSS and a manifest to this directory (enables CSS splitting) |

### `globalCss`

Controls where Mochi-CSS inserts global styles. Useful when your globals file has a non-standard name or path:

```js
'@mochi-css/postcss': { globalCss: /\/base\.css$/ }
```

### `tmpDir` — CSS splitting

When `tmpDir` is set, the plugin additionally writes per-source-file CSS to disk instead of inlining everything into the globals file.
This enables framework integrations (e.g. `@mochi-css/vite`, `@mochi-css/next`) to load only the styles needed for the current route.

```js
'@mochi-css/postcss': { tmpDir: '.mochi' }
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
