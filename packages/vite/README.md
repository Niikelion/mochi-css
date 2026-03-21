# 🧁 Mochi-CSS/vite

This package is part of the [Mochi-CSS project](https://github.com/Niikelion/mochi-css).
It integrates compile-time CSS-in-JS into your Vite builds.

## Installation

```bash
npm i @mochi-css/vanilla @mochi-css/react
npm i -D @mochi-css/vite
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

### 2. `vite.config.ts`

Add the plugin to your Vite config:

```typescript
// vite.config.ts
import { defineConfig } from "vite"
import { mochiCss } from "@mochi-css/vite"

export default defineConfig({
    plugins: [mochiCss()],
})
```

The plugin reads all options from `mochi.config.ts` automatically.

---

## How It Works

The plugin runs during Vite's build phase:

1. **`configResolved`** - loads and resolves `mochi.config.ts`
2. **`buildStart`** - scans source files, extracts styles, and builds an in-memory CSS manifest
3. **`transform`** - injects CSS import statements into source files that have extracted styles
4. **`load`** - serves virtual CSS modules (`virtual:mochi-css/...`) from the in-memory manifest

Per-file styles are served as virtual modules, so each component only loads the CSS it needs.
Global styles (from `globalCss()`) are served as `virtual:mochi-css/global.css` and deduplicated by the bundler.

---

## Options

Most options are read automatically from `mochi.config.ts`.
See [`@mochi-css/config`](../config/README.md) for the full list.

The following options are specific to the Vite plugin and can be passed inline to `mochiCss()`:

| Option     | Type            | Description                                                                 |
|------------|-----------------|-----------------------------------------------------------------------------|
| `bundler`  | `Bundler`       | Override the bundler used for style extraction (default: `RolldownBundler`) |
| `runner`   | `Runner`        | Override the code runner used for style extraction (default: `VmRunner`)    |
| `plugins`  | `MochiPlugin[]` | Additional Mochi plugins, merged with those from `mochi.config.ts`. Plugins may register source transforms via `onLoad(context)`. |

```typescript
import { mochiCss } from "@mochi-css/vite"
import { styledIdPlugin } from "@mochi-css/builder"

export default defineConfig({
    plugins: [
        mochiCss({
            plugins: [styledIdPlugin()],
        }),
    ],
})
```

> Prefer setting options in `mochi.config.ts` - inline options override the file config but are not shared with other integrations.