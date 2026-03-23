# 🧁 Mochi-CSS/next

This package is part of the [Mochi-CSS project](https://github.com/Niikelion/mochi-css).
It integrates compile-time CSS-in-JS into your Next.js builds.

## Installation

```bash
npm i @mochi-css/vanilla @mochi-css/react
npm i -D @mochi-css/postcss @mochi-css/next
```

> `@mochi-css/builder` and `@mochi-css/config` install transitively and do not need to be listed explicitly.

---

## How It Works

1. The [PostCSS plugin](../postcss/README.md) extracts styles from your source files and generates CSS.
2. The Next.js loader reads the style manifest if the postcss plugin generated one and injects import to in-flight generated CSS modules.

---

## Setup

### 1. `mochi.config.ts`

Create a config file in your project root. Set `tmpDir` to enable CSS splitting.

```typescript
// mochi.config.ts
import { defineConfig } from "@mochi-css/config"

export default defineConfig({
    tmpDir: ".mochi",
})
```

See [`@mochi-css/config`](../config/README.md) for the full list of shared options.

### 2. `postcss.config.js`

Add the PostCSS plugin:

```js
// postcss.config.js
module.exports = {
    plugins: {
        '@mochi-css/postcss': {}
    }
}
```

The plugin reads `tmpDir` from `mochi.config.ts` automatically - no need to repeat it here.
See [`@mochi-css/postcss`](../postcss/README.md) for PostCSS-specific options.

### 3. `next.config.ts`

Wrap your Next.js config with `withMochi`:

```typescript
// next.config.ts
import type { NextConfig } from "next"
import { withMochi } from "@mochi-css/next"

const nextConfig: NextConfig = {}

export default withMochi(nextConfig)
```

### 4. Import `globals.css` in your layout

Create a `src/app/globals.css` (or wherever your global stylesheet lives) and import it in your root layout:

```tsx
// src/app/layout.tsx
import "./globals.css"

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    )
}
```

---

## Turbopack

`withMochi` hooks into Turbopack automatically - but only if you have already opted in via your Next.js config.
Please explicitly specify in your Next.js config whether you are using turbopack to avoid configuration errors and unexpected behaviors.

**Next.js 15.3+ / 16** - use the top-level `turbopack` key:

```typescript
// next.config.ts
const nextConfig: NextConfig = {
    turbopack: {},
}

export default withMochi(nextConfig)
```

**Next.js 14 / 15.0–15.2** - use `experimental.turbo`:

```typescript
// next.config.ts
const nextConfig: NextConfig = {
    experimental: {
        turbo: {},
    },
}

export default withMochi(nextConfig)
```

---

## Options

Most options are read automatically from `mochi.config.ts`.
See [`@mochi-css/config`](../config/README.md) for the full list.

The following option is specific to the Next.js integration:

| Option         | Type     | Default                    | Description                                                    |
|----------------|----------|----------------------------|----------------------------------------------------------------|
| `manifestPath` | `string` | `.mochi/manifest.json`     | Path to the manifest written by PostCSS's `tmpDir` option      |

### `manifestPath`

Only set this if your PostCSS `tmpDir` is not the same as in the shared config:

```typescript
export default withMochi(nextConfig, {
    manifestPath: "custom-dir/manifest.json",
})
```

The PostCSS `tmpDir` and the Next.js `manifestPath` must point to the same directory.
By default, they both use the value from the shared config, so no extra configuration is needed.

> Prefer setting options in `mochi.config.ts` - inline options override the file config but are not shared with other integrations.
