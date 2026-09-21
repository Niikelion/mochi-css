---
"@mochi-css/vite": patch
"@mochi-css/tsuki": patch
---

Fix styles going missing in dev for a file created while the server is running — most visibly when
a component is moved or renamed into a folder that did not exist before.

A newly created file is not in Vite's module graph yet, so `handleHotUpdate` never runs for it and
the plugin only handled `delete` in `watchChange`. Nothing rebuilt the manifest, so the file was
served without its CSS import and with its `css()` calls left unrewritten until some already-known
file happened to change. `watchChange` now also handles `create` by re-collecting CSS.

Rebuilding alone was not enough: a module Vite had already transformed against the stale manifest
kept that cached output, so refetching it returned the same styleless result indefinitely. Modules
whose extracted output changed during a rebuild are now invalidated by file path, which also closes
a race where a file requested while a rebuild was still in flight stayed stale afterwards.
