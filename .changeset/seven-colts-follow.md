---
"@mochi-css/builder": minor
"@mochi-css/postcss": minor
"@mochi-css/vanilla": minor
"@mochi-css/tsuki": minor
"@mochi-css/vite": minor
---

`rootDir: string` has been replaced with `roots: RootEntry[]` where  
`RootEntry = string | { path: string; package: string }`. This enables:

- Multiple source roots scanned in a single build
- Named roots that map a package name to a local source directory,
  so cross-package imports resolve correctly in monorepos

Migration: replace `rootDir: "src"` with `roots: ["src"]`.

Also adds `isMochiCSS(value)` type guard to `@mochi-css/vanilla`.

`@mochi-css/tsuki` now supports non-interactive mode via `--no-interactive`
and preset selection via `--preset <vite|nextjs|lib>`, with additional flags
`--postcss`, `--vite`, and `--next` for specifying config paths without prompts.
Useful for scripted or CI setup.
