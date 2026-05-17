# 🧁 Mochi-CSS/esbuild

This package is part of the [Mochi-CSS project](https://github.com/Niikelion/mochi-css).
It integrates compile-time CSS-in-JS into your esbuild builds.

## Installation

```bash
npm i @mochi-css/vanilla @mochi-css/react
npm i -D @mochi-css/esbuild
```

> `@mochi-css/builder` and `@mochi-css/config` install transitively and do not need to be listed explicitly.

---

## Setup

### 1. `mochi.config.ts`

Create a config file in your project root:

```typescript
// mochi.config.ts
import { defineConfig } from "@mochi-css/config"

export default defineConfig({
    roots: ["src"],
})
```

See [`@mochi-css/config`](../config/README.md) for the full list of shared options.

### 2. Build script

Add the plugin to your esbuild build script:

```typescript
// build.mjs
import { build } from "esbuild"
import { mochiCss } from "@mochi-css/esbuild"

await build({
    entryPoints: ["src/index.ts"],
    outdir: "dist",
    bundle: true,
    plugins: [mochiCss()],
})
```

The plugin reads all options from `mochi.config.ts` automatically.

---

## How It Works

The plugin hooks into esbuild's lifecycle:

1. **`onStart`** - loads `mochi.config.ts`, scans source files, extracts styles into an in-memory CSS manifest
2. **`onResolve`** - intercepts synthetic `mochi-css-asset:` import IDs injected by the load hook
3. **`onLoad` (source files)** - injects CSS import statements into files that have extracted styles
4. **`onLoad` (virtual namespace)** - serves CSS content for virtual imports (virtual mode only)
5. **`onEnd`** - writes CSS files to `outdir` (external mode only)

---

## CSS Output Modes

### Virtual mode (default)

CSS is served as virtual modules inside esbuild. When `bundle: true`, esbuild bundles the CSS into a companion `.css` file alongside the output JS.

```typescript
plugins: [mochiCss()]
```

Use this for app builds where esbuild is the final bundler.

### External mode

CSS imports are marked as external, so they survive in the output JS. CSS files are written flat into `outdir` in `onEnd`. Downstream bundlers (Vite, Next.js) then resolve and process the CSS automatically.

```typescript
plugins: [mochiCss({ externalCss: true })]
```

Use this when distributing a component library — consumers get zero-config CSS auto-import.

---

## Options

| Option       | Type            | Default                              | Description |
|--------------|-----------------|--------------------------------------|-------------|
| `externalCss`| `boolean`       | `false`                              | Write CSS files to disk and mark imports as external (library distribution mode) |
| `entries`    | `string[]`      | `build.initialOptions.entryPoints`   | Entry files where the global CSS import is injected |
| `plugins`    | `MochiPlugin[]` | `[]`                                 | Additional Mochi plugins, merged with those from `mochi.config.ts` |

> Prefer setting options in `mochi.config.ts` — inline options override the file config but are not shared with other integrations.
