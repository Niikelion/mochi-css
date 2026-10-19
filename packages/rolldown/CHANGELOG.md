# @mochi-css/rolldown

## 0.2.3

### Patch Changes

- Updated dependencies [9f143ea]
  - @mochi-css/config@8.1.0
  - @mochi-css/builder@8.1.0

## 0.2.2

### Patch Changes

- 0c8d6e9: `styled(OtherComponent, ...)` overrides now win over the component's own styles when the two live in different files. Each file's CSS import was prepended, so it loaded before the CSS of the modules the file imports and lost on equal specificity; it now comes after the file's code (imports are hoisted, so it still loads). The global CSS import stays first.

## 0.2.1

### Patch Changes

- Updated dependencies [c767356]
- Updated dependencies [c767356]
  - @mochi-css/builder@8.0.0
  - @mochi-css/config@8.0.0

## 0.2.0

### Minor Changes

- c288b58: Add `@mochi-css/bento` — layout primitives package with className generators (`@mochi-css/bento`) and React components (`@mochi-css/bento/react`).

  Primitives: `Box`, `Frame`, `Grid`, `Pile`, `Overlay`, `Spacer`, `Divider`, `Apply`. Built with the new `@mochi-css/rolldown` plugin using `externalCss: true` for library distribution.

  Add `@mochi-css/rolldown` — Rolldown/tsdown plugin that statically extracts Mochi CSS styles, replacing `@mochi-css/esbuild`. Supports virtual mode (runtime style injection) and external mode (library distribution).

  Update tsuki: replace the `esbuild` preset with a `tsdown` preset that generates `tsdown.config.mts` and installs `@mochi-css/rolldown`.
