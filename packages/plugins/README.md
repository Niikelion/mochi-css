# 🧁 Mochi-CSS/plugins

This package is part of the [Mochi-CSS project](https://github.com/Niikelion/mochi-css).
It provides `createExtractorsPlugin` — the standard bridge between `StyleExtractor` instances and the `Builder` pipeline — along with re-exports of commonly needed builder types for plugin authors.

> **Note:** You only need this package when building custom integrations or writing plugins that wire extractors into the builder. Normal users configure extractors via `mochi.config.ts` using packages like `@mochi-css/vanilla/config`.

---

## Installation

```bash
npm i @mochi-css/plugins --save-dev
```

---

## `createExtractorsPlugin`

Packages a list of `StyleExtractor` instances as a `MochiPlugin`. When loaded, the plugin:

- Registers the analysis pipeline stages needed for the given extractors
- Registers a `sourceTransforms` hook that sets up per-build generators and injects them as eval-time globals
- Registers an `emitHook` that calls `generateStyles()` on each generator and emits CSS via `context.emitChunk()`; also applies any AST arg replacements returned by `getArgReplacements()`

```typescript
import { createExtractorsPlugin } from "@mochi-css/plugins"
import { defaultExtractors } from "@mochi-css/builder"
import { FullContext } from "@mochi-css/config"
import { Builder, RolldownBundler, VmRunner } from "@mochi-css/builder"

const ctx = new FullContext(onDiagnostic)
createExtractorsPlugin(defaultExtractors).onLoad(ctx)

const builder = new Builder({
    roots: ["./src"],
    stages: [...ctx.stages.getAll()],
    bundler: new RolldownBundler(),
    runner: new VmRunner(),
    sourceTransforms: [...ctx.sourceTransforms.getAll()],
    emitHooks: [...ctx.emitHooks.getAll()],
    emitDir: "./dist/mochi",
    cleanup: () => ctx.cleanup.runAll(),
})
```

When integrations load `mochi.config.ts`, `createExtractorsPlugin` is typically called inside a higher-level plugin (e.g. the one returned by `@mochi-css/vanilla/config`'s `defineConfig`) — you don't need to call it manually.

---

## `PluginContextCollector`

A lightweight alternative to `FullContext` (from `@mochi-css/config`) for collecting plugin hooks without the file pre-process pipeline. Useful for unit-testing plugins or building minimal integrations.

```typescript
import { PluginContextCollector } from "@mochi-css/plugins"

const collector = new PluginContextCollector(onDiagnostic)
myPlugin.onLoad(collector)

const builder = new Builder({
    stages: [...collector.getStages()],
    sourceTransforms: [...collector.getSourceTransforms()],
    emitHooks: [...collector.getEmitHooks()],
    cleanup: () => collector.runCleanup(),
    // ...
})
```

| Method | Returns |
|--------|---------|
| `getStages()` | `readonly StageDefinition[]` |
| `getSourceTransforms()` | `AstPostProcessor[]` |
| `getEmitHooks()` | `EmitHook[]` |
| `runCleanup()` | calls all registered cleanup functions |

---

## Re-exports

This package re-exports the following types and utilities from `@mochi-css/builder` for convenience:

- `StyleExtractor`, `StyleGenerator`
- `AstPostProcessor`, `EmitHook`, `BuilderOptions`, `RootEntry`
- `StageDefinition`
- `createDefaultStages`, `defaultStages`
- All stage constructors and symbol constants (`ImportSpecStage`, `StyleExprStage`, etc.)
- `extractRelevantSymbols`
