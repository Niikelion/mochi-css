# 🍙 Mochi-CSS/storybook

This package is part of the [Mochi-CSS project](https://github.com/Niikelion/mochi-css).
It integrates compile-time CSS-in-JS into [Storybook](https://storybook.js.org) so your
stories render with correctly extracted styles — in both dev and build modes.

> **Builder support:** this addon targets Storybook's **Vite** builder (the default for
> most frameworks). Webpack-builder support is not included yet.

It works with any Mochi-CSS API — both [`@mochi-css/vanilla-react`](../vanilla-react/README.md)
and [`@mochi-css/stitches`](../stitches/README.md) — since extraction is driven by the
extractors configured in `mochi.config.ts`.

## Installation

```bash
npm i @mochi-css/vanilla
npm i -D @mochi-css/storybook
```

> `@mochi-css/vite`, `@mochi-css/builder`, and `@mochi-css/config` install transitively.

## Setup

> **Automatic setup:** [`@mochi-css/tsuki`](../tsuki/README.md)'s `vite` preset can wire this
> up for you — run `npx tsuki --preset vite` and answer "yes" when asked whether you use
> Storybook (or pass `--storybook` to skip the prompt). It patches `.storybook/main.ts` for
> you, or creates a default one if none exists. The steps below are the manual equivalent.

### 1. `mochi.config.ts`

Create a config file in your project root (skip if you already have one):

```typescript
// mochi.config.ts
import { defineConfig } from "@mochi-css/vanilla/config"

export default defineConfig({
    roots: ["src"],
})
```

See [`@mochi-css/config`](../config/README.md) for the full list of shared options.

### 2. `.storybook/main.ts`

Add the addon — no options required:

```typescript
// .storybook/main.ts
import type { StorybookConfig } from "@storybook/react-vite"

const config: StorybookConfig = {
    stories: ["../src/**/*.stories.@(ts|tsx)"],
    addons: ["@mochi-css/storybook"],
    framework: "@storybook/react-vite",
}

export default config
```

That's it. Stories that import styled components get their CSS extracted and injected
automatically, and HMR updates styles as you edit components.

## How It Works

- The addon adds the [`@mochi-css/vite`](../vite/README.md) plugin to Storybook's Vite
  builder via the `viteFinal` preset hook. Per-component styles (`styled`, `css`) are
  injected into each story through the plugin's `transform` hook, and HMR is handled by
  the plugin.
- Global styles — `globalCss()`, `keyframes`, and everything when `splitCss: false` — are
  loaded through a preview annotation (`@mochi-css/storybook/preview`) that imports the
  plugin's `virtual:mochi-css/global.css` module into the preview iframe.

If your Storybook version does not auto-register the preview entry, import the global
module yourself in `.storybook/preview.ts`:

```typescript
// .storybook/preview.ts
import "virtual:mochi-css/global.css"
```

## Notes

- The addon is idempotent: if you already added `mochiCss()` to a shared Vite config,
  it will not be added a second time.
