# 🍱 Mochi-CSS/bento

This package is part of the [Mochi-CSS project](https://github.com/Niikelion/mochi-css).
It provides compile-time layout primitives — className generators and React components — built on `@mochi-css/vanilla`.

## Installation

```bash
npm i @mochi-css/bento
```

For React components:

```bash
npm i @mochi-css/bento react
```

---

## Two entry points

| Import | Contents |
|---|---|
| `@mochi-css/bento` | className generator functions + TypeScript types. Framework-agnostic. |
| `@mochi-css/bento/react` | React component wrappers (`<Frame>`, `<Grid>`, …) built on the generators. |

---

## Primitives

### `box` — block container

```ts
import { box } from "@mochi-css/bento"

<div className={box()} />
```

A simple `display: block` wrapper. Use as a neutral building block.

---

### `spacer` — flex spacer

```ts
import { spacer } from "@mochi-css/bento"

<div className={spacer()} />
```

`flex: 1` — fills available space inside a flex container.

---

### `divider` — separator line

```ts
import { divider } from "@mochi-css/bento"

// Horizontal (default)
<hr className={divider()} />

// Vertical
<hr className={divider({ vertical: true })} />
```

---

### `frame` — flexbox layout

```ts
import { frame } from "@mochi-css/bento"

// Row, centered on both axes
<div className={frame({ row: true, alignX: "center", alignY: "center" })} />

// Column (default), stretched children
<div className={frame({ alignX: "stretch" })} />
```

| Prop | Type | Default | Description |
|---|---|---|---|
| `row` | `boolean` | `false` | Flex direction row |
| `col` | `boolean` | `false` | Flex direction column (alias; `row` takes precedence) |
| `alignX` | `AxisAlign` | — | Alignment on the X axis |
| `alignY` | `AxisAlign` | — | Alignment on the Y axis |

`AxisAlign`: `"start" | "center" | "end" | "stretch" | "space-between" | "space-around"`

> `alignX`/`alignY` map to `justify-content`/`align-items` based on the flex direction, so the semantic meaning stays consistent regardless of `row` vs `col`.

---

### `grid` — CSS grid layout

```ts
import { grid } from "@mochi-css/bento"

// Fixed columns
<div className={grid({ columns: "1fr 1fr 1fr" })} style={{ "--bento-grid-cols": "1fr 1fr 1fr" }} />
```

The base class activates `display: grid` and wires `grid-template-columns/rows/areas` to CSS custom properties (`--bento-grid-cols`, `--bento-grid-rows`, `--bento-grid-areas`). Set the variables in `style` to control the layout at runtime. The [React `<Grid>` component](#grid-component) handles this automatically.

#### `grid.areas` — named template areas

```ts
const layout = grid.areas([
  ["header", "header"],
  ["sidebar", "main"],
  [null,      "main"],       // null → "." (anonymous cell)
  [grid.span(2, "footer")],  // span across 2 columns
])

// layout.template  → '"header header" "sidebar main" ". main" "footer footer"'
// layout.header    → "header"
// layout.sidebar   → "sidebar"
// layout.main      → "main"
// layout.footer    → "footer"
```

Pass `layout` to the `areas` prop of `<Grid>` or set `--bento-grid-areas: ${layout.template}` manually.

#### `grid.span(count, name)` — spanning cell

Creates a cell descriptor that repeats `name` `count` times when `grid.areas` expands the template.

---

### `pile` — stacked layers

All children share the same grid cell, layered on top of each other. The first child defines the container size.

```ts
import { pile } from "@mochi-css/bento"

<div className={pile()}>
  <img src="bg.jpg" />
  <div className={pile.item({ alignX: "center", alignY: "end" })}>
    Caption
  </div>
</div>
```

`pile.item(props)` returns alignment classes (`justify-self` / `align-self`) for a child element.

| Prop | Values |
|---|---|
| `alignX` | `"start" \| "center" \| "end" \| "stretch"` |
| `alignY` | `"start" \| "center" \| "end" \| "stretch"` |

---

### `overlay` — absolute positioning container

```ts
import { overlay } from "@mochi-css/bento"

// All children absolutely positioned, centered
<div className={overlay({ alignX: "center", alignY: "center" })} />
```

The container is `position: relative`. All direct children are `position: absolute` and positioned by the alignment classes. `center` alignment uses `translate` (not `margin`) so it composes correctly on both axes simultaneously.

| Prop | Values |
|---|---|
| `alignX` | `"start" \| "center" \| "end" \| "stretch"` |
| `alignY` | `"start" \| "center" \| "end" \| "stretch"` |

---

## React Components

Import from `@mochi-css/bento/react`. Each component accepts all standard `HTMLAttributes<HTMLDivElement>` props (including `className`, which is merged with the generator output) in addition to its own layout props.

```tsx
import { Frame, Grid, Pile, Overlay, Box, Spacer, Divider, Apply } from "@mochi-css/bento/react"

// Frame
<Frame row alignX="space-between" alignY="center">
  <span>Left</span>
  <Spacer />
  <span>Right</span>
</Frame>

// Grid with named areas
const layout = grid.areas([["sidebar", "main"]])
<Grid areas={layout} columns="200px 1fr">
  <div style={{ gridArea: layout.sidebar }}>Sidebar</div>
  <div style={{ gridArea: layout.main }}>Main</div>
</Grid>

// Pile
<Pile>
  <img src="hero.jpg" />
  <Overlay alignX="center" alignY="end">
    <p>Caption</p>
  </Overlay>
</Pile>
```

### `Apply` — inject className into a child element

```tsx
import { Apply } from "@mochi-css/bento/react"
import { frame } from "@mochi-css/bento"

// Adds the frame className to the child without adding a wrapper element
<Apply className={frame({ row: true })}>
  <nav>...</nav>
</Apply>
```

`Apply` uses `cloneElement` to merge its `className` into the first child. If the child is not a React element, it renders nothing.

---

## Using with `styled()`

Generators return plain class name strings, so they compose naturally with `styled()` from `@mochi-css/vanilla-react`:

```ts
import { styled } from "@mochi-css/vanilla-react"
import { frame } from "@mochi-css/bento"

const Nav = styled("nav", frame({ row: true, alignX: "space-between" }), {
  padding: 16,
  background: "white",
})
```

---

## Library distribution

Bento is itself built with `externalCss: true` via `@mochi-css/rolldown`. When you install the package, the CSS files are included in `dist/` and automatically picked up by downstream bundlers (Vite, Next.js, webpack).

If you're building a component library that re-exports bento components, use the same pattern in your own build:

```ts
// tsdown.config.mts
import { mochiCss } from "@mochi-css/rolldown"

export default defineConfig({
  plugins: [mochiCss({ externalCss: true })],
})
```
