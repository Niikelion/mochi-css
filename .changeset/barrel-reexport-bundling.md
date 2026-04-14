---
"@mochi-css/builder": patch
"@mochi-css/plugins": patch
"@mochi-css/vanilla": major
"@mochi-css/vite": major
---

Fixed several bugs that caused build failures in projects using barrel/reexport files.

**`@mochi-css/builder`**

- `RolldownBundler` now resolves directory imports to `index.ts` / `index.tsx` / `index.js` / `index.jsx` inside the virtual file system (e.g. `import { foo } from "../../components/banner"` where `banner/` is a directory with an `index.ts`)

**`@mochi-css/plugins`**

- Barrel files (`export * from "./..."` / `export { x } from "./..."`) are now included in the `.mochi/` bundle with their reexport declarations instead of being omitted. Previously, any source file that imported from a barrel whose exports had no CSS expressions would fail to bundle with an `UNRESOLVED_IMPORT` error.
- `ReexportResolver` (from `@mochi-css/plugins`) is now wired into `prepareAnalysis` and `getFilesToBundle` so that CSS argument propagation correctly traces symbols imported through barrel files. This fixes the "unresolved symbol" error when a `css()` call argument referenced a binding imported via a reexport chain.

**`@mochi-css/vanilla`**

- `MochiCSS.selector` now uses `""` join (compound selector) consistently — corrected test expectations that incorrectly assumed comma-separated output.

**`@mochi-css/vite`**

- `handleHotUpdate` now includes the invalidated virtual CSS modules in its return value, ensuring browsers receive the HMR update for changed styles.
