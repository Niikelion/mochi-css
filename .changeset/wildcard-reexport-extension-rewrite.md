---
"@mochi-css/builder": patch
"@mochi-css/tsuki": patch
---

Fix wildcard re-exports and `.js`-suffixed import specifiers dropping styles.

Import specifiers like `export * from "./component.js"` (as tsc emits under
NodeNext / `verbatimModuleSyntax`) are now correctly resolved back to `./component.ts`
in both the ExportsStage and the Rolldown virtual-fs plugin. Previously the resolver
only appended extensions, so a `.js` specifier could never match a `.ts` source and
the wildcard was silently dropped (leaving downstream consumers unable to trace
bindings through the barrel).

Also normalizes path separators inside `Builder.buildResolveImport` so lookups work
regardless of whether module `filePath`s were produced with posix or Windows separators.
