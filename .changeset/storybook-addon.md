---
"@mochi-css/storybook": minor
"@mochi-css/tsuki": minor
---

Add `@mochi-css/storybook` — a Storybook addon that integrates compile-time CSS extraction into Storybook's Vite builder (#38).

Adding `"@mochi-css/storybook"` to `addons` in `.storybook/main.ts` is all that's needed:

- `viteFinal` injects the `@mochi-css/vite` plugin (idempotently), so per-component styles are extracted and injected into stories, with HMR in dev.
- `previewAnnotations` loads the plugin's `virtual:mochi-css/global.css` into the preview iframe so `globalCss()`/keyframes styles apply.
- Works with any Mochi API (`@mochi-css/vanilla-react`, `@mochi-css/stitches`) since extraction is driven by `mochi.config.ts`.

Targets Storybook's Vite builder; Webpack-builder support is not included yet.

`@mochi-css/tsuki` can now wire this up automatically: the `vite` preset registers a Storybook
module that prompts to add the mochi addon (or use `--storybook [path]` to force it), patching
`.storybook/main.{ts,mts,js,mjs,cjs}` — handling `export default { ... }`, a `defineMain(...)`-wrapped
config, and an identifier-exported config — or creating a sensible default when none exists.
