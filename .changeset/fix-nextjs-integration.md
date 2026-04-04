---
"@mochi-css/next": patch
"@mochi-css/postcss": patch
"@mochi-css/tsuki": patch
---

Fix Next.js integration issues: path normalization on Windows, dev mode deadlock, and production double-build.

**Path normalization (`@mochi-css/next`, `@mochi-css/postcss`):** Manifest keys for source files and sourcemods are now normalized to forward slashes when written. The webpack loader also normalizes `resourcePath` before manifest lookups. Previously, backslash paths on Windows caused CSS injection and source transforms (styledId `s-` class injection) to silently do nothing.

**Dev mode deadlock (`@mochi-css/next`, `@mochi-css/postcss`):** When `withMochi()` starts its file watcher, it sets a process-level flag. The PostCSS plugin now checks this flag and skips its own build entirely, emitting a one-time warning instead. Previously, both ran `collectMochiCss()` concurrently via separate `RolldownBundler` instances, deadlocking on Windows.

**Production double-build (`@mochi-css/next`):** `withMochi()` now adds a webpack `beforeRun` plugin that runs a one-shot CSS build before webpack starts processing files. Previously, the PostCSS plugin raced with the webpack loader on first build, leaving `.mochi/manifest.json` missing and requiring a second `next build` to get styles.

**Tsuki nextjs preset (`@mochi-css/tsuki`):** The `nextjs` preset no longer registers `@mochi-css/postcss`. The `withMochi()` watcher (dev) and `beforeRun` pre-build (prod) together cover all CSS needs for Next.js without PostCSS.
