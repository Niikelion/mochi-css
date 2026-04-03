# 🧁 Mochi-CSS/react

> **Deprecated.** This package is superseded by [`@mochi-css/vanilla-react`](../vanilla-react/README.md), which provides the same `styled` runtime plus a pre-configured `defineConfig` entry point. Migrate by replacing your import:
>
> ```diff
> - import { styled } from "@mochi-css/react"
> + import { styled } from "@mochi-css/vanilla-react"
> ```
>
> And update your `mochi.config.ts`:
>
> ```diff
> - import { defineConfig } from "@mochi-css/config"
> + import { defineConfig } from "@mochi-css/vanilla-react/config"
> ```
>
> `@mochi-css/react` will not receive new features and will be removed in a future major version.

This package is part of the [Mochi-CSS project](https://github.com/Niikelion/mochi-css).
It provides the `styled` utility for creating type-safe styled React components.

## Installation

```bash
npm i @mochi-css/react
```

---

## `styled(component, ...styles)`

`styled` creates a React component by combining a base element or component with Mochi-CSS style definitions.
Variant props are automatically extracted, applied as class names, and never forwarded to the underlying element.

```tsx
import { css } from "@mochi-css/vanilla"
import { styled } from "@mochi-css/react"

const Button = styled("button", {
    padding: "8px 16px",
    borderRadius: 4,
    border: "none",
    cursor: "pointer",
})

// <Button>Click me</Button>
```

### With variants

Pass a style object with a `variants` key to generate typed variant props:

```tsx
import { styled } from "@mochi-css/react"

const Button = styled("button", {
    padding: "8px 16px",
    borderRadius: 4,
    variants: {
        intent: {
            primary: { backgroundColor: "blue", color: "white" },
            danger:  { backgroundColor: "red",  color: "white" },
        },
        size: {
            small: { fontSize: 12, padding: "4px 8px" },
            large: { fontSize: 18, padding: "12px 24px" },
        },
    },
    defaultVariants: {
        intent: "primary",
        size:   "small",
    },
})

// <Button intent="danger" size="large">Delete</Button>
```

### With a shared `css()` style

Pass a `MochiCSS` object (the return value of `css()`) to share styles across multiple components:

```tsx
import { css } from "@mochi-css/vanilla"
import { styled } from "@mochi-css/react"

const baseButton = css({
    borderRadius: 4,
    border: "none",
    cursor: "pointer",
})

const PrimaryButton = styled("button", baseButton, {
    backgroundColor: "blue",
    color: "white",
})

const SecondaryButton = styled("button", baseButton, {
    backgroundColor: "gray",
    color: "white",
})
```

### Component targeting

Each styled component has a `.selector` getter (and a `toString()` that returns the same value) for use in parent component styles:

```tsx
const Icon = styled("span", { marginRight: 4 })

const Button = styled("button", {
    display: "flex",

    // target Icon inside Button
    [`${Icon} &`]: { color: "inherit" },
})
```

### Styling an existing component

`styled` accepts any React component that accepts a `className` prop:

```tsx
import { Link } from "react-router-dom"

const NavLink = styled(Link, {
    color: "inherit",
    textDecoration: "none",
    "&:hover": { textDecoration: "underline" },
})
```

---

## Type exports

| Export                 | Description                                    |
|------------------------|------------------------------------------------|
| `MochiStyledComponent` | The type of a component returned by `styled()` |