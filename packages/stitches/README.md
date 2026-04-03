# 🧁 Mochi-CSS/stitches

This package is part of the [Mochi-CSS project](https://github.com/Niikelion/mochi-css).
It provides a [Stitches](https://stitches.dev)-compatible API for Mochi-CSS, allowing you to migrate from Stitches or use the familiar `createStitches` authoring style with compile-time extraction.

---

## Installation

```bash
npm i @mochi-css/stitches
npm i -D @mochi-css/stitches-builder
```

Add the builder plugin to your `mochi.config.ts`:

```typescript
// mochi.config.ts
import { defineConfig } from "@mochi-css/config"
import { stitchesPlugin } from "@mochi-css/stitches-builder"

export default defineConfig({
    plugins: [stitchesPlugin()],
})
```

---

## `createStitches(config)`

Creates a bound set of styling functions configured with your design tokens, media queries, and utilities.

```typescript
import { createStitches } from "@mochi-css/stitches"

const { css, styled, keyframes, globalCss, createTheme, theme, config } = createStitches({
    prefix: "app",
    media: {
        sm: "(min-width: 640px)",
        md: "(min-width: 768px)",
        lg: "(min-width: 1024px)",
    },
    theme: {
        colors: {
            primary: "#3b82f6",
            danger:  "#ef4444",
        },
        space: {
            1: "4px",
            2: "8px",
            4: "16px",
        },
    },
    utils: {
        mx: (value: unknown) => ({ marginLeft: value, marginRight: value }),
        px: (value: unknown) => ({ paddingLeft: value, paddingRight: value }),
    },
})
```

### Returned functions

| Property | Description |
|----------|-------------|
| `css(...styles)` | Creates a `MochiCSS` class, same as `@mochi-css/vanilla` `css()` |
| `styled(target, ...styles)` | Creates a typed React component, same as `@mochi-css/react` `styled()` |
| `keyframes(stops)` | Defines a CSS animation |
| `globalCss(styles)` | Injects global CSS (returns a no-op function) |
| `createTheme(tokens)` | Creates an additional theme class overriding design tokens |
| `theme` | Token reference object — use `theme.colors.primary` in style values |
| `config` | The resolved config object passed to `createStitches` |

---

## Design tokens

Token values are referenced in styles using the `$` prefix:

```typescript
const { css, theme } = createStitches({
    theme: {
        colors: { blue: "#3b82f6" },
        space:  { 4: "16px" },
    },
})

const button = css({
    color: "$blue",        // → var(--colors-blue)
    padding: "$4",         // → var(--space-4)
})
```

Token references are automatically mapped to CSS custom properties at build time.

---

## Locally scoped tokens (`$$`)

Use `$$name` to define a component-local CSS variable:

```typescript
const button = css({
    $$shadowColor: "rgba(0,0,0,0.2)",
    boxShadow: "0 2px 4px $$shadowColor",
})
```

---

## Named media queries

Use the keys from `media` as responsive variant keys:

```typescript
const { css } = createStitches({
    media: { sm: "(min-width: 640px)" },
})

const box = css({
    variants: {
        size: {
            small: { padding: 8 },
            large: { padding: 16 },
        },
    },
})

// <Box size={{ "@sm": "large" }} />
```

---

## `createTheme`

Creates an additional theme by overriding token values. Returns a class name to apply to a container element.

```typescript
const { createTheme, theme } = createStitches({
    theme: { colors: { primary: "blue" } },
})

const darkTheme = createTheme({
    colors: { primary: "navy" },
})

// <div className={darkTheme.className}>...</div>
```

---

## `StitchesConfig`

| Field | Type | Description |
|-------|------|-------------|
| `prefix` | `string` | Optional prefix for generated class names and CSS variables |
| `media` | `Record<string, string>` | Named media query breakpoints |
| `theme` | `StitchesTheme` | Design token scales (colors, space, sizes, etc.) |
| `themeMap` | `Record<string, string>` | Maps CSS properties to token scales. Defaults to `defaultThemeMap` |
| `utils` | `StitchesUtils` | Custom CSS property shorthands |
