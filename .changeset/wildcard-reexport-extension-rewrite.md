---
"@mochi-css/builder": patch
"@mochi-css/tsuki": patch
---

Fix wildcard re-exports dropping styles.

Two related bugs:

1. **Path-separator mismatch on Windows** — `Builder.buildResolveImport` compared paths
   from the pipeline's posix-normalized `path` util against module `filePath`s that
   sometimes carried Windows-style backslashes (produced by any code that used node's
   `path.resolve` before handing the module to the builder). Every wildcard barrel on
   Windows silently dropped its `namespaceReexports`, even for plain specifiers like
   `export * from "./component"`.

2. **`.js`-suffixed specifiers** — `export * from "./component.js"` (as tsc emits under
   NodeNext / `verbatimModuleSyntax`) was never resolved back to `./component.ts` because
   the resolver only appended extensions instead of stripping the `.js` first.

Both fixes apply to both the analysis-side resolver (`Builder.buildResolveImport`) and
the Rolldown virtual-fs plugin (`Bundler.tryResolve`) via a shared `resolveCandidates`
helper.
