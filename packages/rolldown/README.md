# 🍙 Mochi-CSS/rolldown

This package is part of the [Mochi-CSS project](https://github.com/Niikelion/mochi-css).
It integrates compile-time CSS-in-JS into your [tsdown](https://tsdown.dev) / [Rolldown](https://rolldown.rs) builds.

## Installation

```bash
npm i @mochi-css/vanilla
npm i -D @mochi-css/rolldown tsdown
```

> `@mochi-css/builder` and `@mochi-css/config` install transitively and do not need to be listed explicitly.

---

## Setup

### 1. `mochi.config.ts`

Create a config file in your project root:

```typescript
// mochi.config.ts
import { defineConfig } from "@mochi-css/vanilla/config"

export default defineConfig({
    roots: ["src"],
})
```

See [`@mochi-css/config`](../config/README.md) for the full list of shared options.

### 2. `tsdown.config.mts`

Add the plugin to your tsdown config:

```typescript
// tsdown.config.mts
import { defineConfig } from "tsdown"
import { mochiCss } from "@mochi-css/rolldown"

export default defineConfig({
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    dts: true,
    plugins: [mochiCss()],
})
```

The plugin reads all options from `mochi.config.ts` automatically.

---

## How It Works

The plugin hooks into Rolldown's lifecycle:

1. **`buildStart`** — loads `mochi.config.ts`, scans source files, extracts styles into an in-memory CSS manifest
2. **`resolveId`** — intercepts synthetic `mochi-css-asset:` import IDs injected by the transform hook
3. **`transform`** — injects CSS import statements into files that have extracted styles; applies any source-level transforms
4. **`load`** — serves CSS as style-injecting JS modules (virtual mode only)
5. **`writeBundle`** — writes CSS files to `outdir` (external mode only)

---

## CSS Output Modes

### Virtual mode (default)

CSS is served as virtual JS modules that inject a `<style>` tag into the DOM at runtime.

```typescript
plugins: [mochiCss()]
```

Use this for app builds where styles should be injected at runtime.

### External mode

CSS imports are marked as external, so they survive in the output JS. CSS files are written flat into `outdir` in `writeBundle`. Downstream bundlers (Vite, Next.js) then resolve and process the CSS automatically.

```typescript
plugins: [mochiCss({ externalCss: true })]
```

Use this when distributing a component library — consumers get zero-config CSS auto-import.

---

## Options

| Option       | Type            | Default                          | Description |
|--------------|-----------------|----------------------------------|-------------|
| `externalCss`| `boolean`       | `false`                          | Write CSS files to disk and mark imports as external (library distribution mode) |
| `entries`    | `string[]`      | `buildStart` input options       | Entry files where the global CSS import is injected |
| `plugins`    | `MochiPlugin[]` | `[]`                             | Additional Mochi plugins, merged with those from `mochi.config.ts` |

> Prefer setting options in `mochi.config.ts` — inline options override the file config but are not shared with other integrations.
