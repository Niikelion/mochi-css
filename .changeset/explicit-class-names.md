---
"@mochi-css/vanilla": minor
"@mochi-css/tsuki": patch
---

Add explicit class names that bypass auto-rename.

`css()` and `styled()` now accept a `className` option in the style object:

```ts
const Button = styled("button", { className: "my-button", color: "red" })
```

When set, the class name is emitted verbatim in the extracted CSS and `ClassRemapPlugin`
skips it during remapping, so the final output keeps the exact name. This enables interop
with third-party libraries, stable test selectors, external CSS overrides, and theming
systems that target known class names.

Variant class names are still auto-generated — only the main block uses the explicit name.
An explicit `className` takes priority over the stable id injected by `styledIdPlugin`.
