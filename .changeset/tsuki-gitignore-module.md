---
"@mochi-css/tsuki": patch
---

Improve preset setup for Next.js and Vite projects.

- `createGitignoreModule(entry)` appends a given entry to `.gitignore`, creating the file if it does not exist and skipping entries already present. Both the `vite` and `nextjs` presets register this module so the `.mochi` output directory is automatically excluded from version control.
- `createMochiConfigModule` now accepts a `splitCss` option. When set, it is written into new `mochi.config.ts` files and patched into existing ones. The `nextjs` preset passes `splitCss: true` by default so per-file CSS injection works out of the box.
