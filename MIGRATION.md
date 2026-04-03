# Migration Guide

## v3 → v4

### `@mochi-css/builder`

#### Breaking: `AnalysisContext.registerGenerators` removed

`AnalysisContext` no longer has `registerGenerators` or any generator-related field. Code that **manually constructs** an `AnalysisContext` object (typically tests or custom tooling) should remove the `registerGenerators` field:

**Before:**
```typescript
const ctx: AnalysisContext = {
    onDiagnostic,
    evaluator,
    registerGenerators: () => {},
}
```

**After:**
```typescript
const ctx: AnalysisContext = {
    onDiagnostic,
    evaluator,
}
```

#### Breaking: `FileInfo.extractedCallExpressions` is now required

`FileInfo` has a new required field `extractedCallExpressions: Map<StyleExtractor, SWC.CallExpression[]>`. This only affects code that manually constructs `FileInfo` objects (e.g. mock objects in tests).

**Before:**
```typescript
const fileInfo: FileInfo = {
    ast,
    extractedExpressions: new Map(),
    // ...
}
```

**After:**
```typescript
const fileInfo: FileInfo = {
    ast,
    extractedExpressions: new Map(),
    extractedCallExpressions: new Map(),
    // ...
}
```

#### New: `preEvalTransforms`, `postEvalTransforms`, `emitHooks`, and `emitDir`

Four new `BuilderOptions` fields control the extended pipeline:

- **`preEvalTransforms`** — run on a deep copy of the ASTs before evaluation. Mutations here do NOT persist in the canonical index.
- **`postEvalTransforms`** — run after code execution on the canonical index. The evaluator is populated; use `evaluator.getTrackedValue()` to read back runtime values.
- **`emitHooks`** — run after `postEvalTransforms`. Call `context.emitChunk(path, content)` to write files into `emitDir`.
- **`emitDir`** — base directory for files produced via `context.emitChunk()`.

```typescript
const builder = new Builder({
    roots: ["./src"],
    stages: [...ctx.stages.getAll()],
    bundler: new RolldownBundler(),
    runner: new VmRunner(),
    postEvalTransforms: [
        (_index, { evaluator }) => {
            // read back values captured via evaluator.valueWithTracking()
        },
    ],
    emitHooks: [
        async (_index, context) => {
            context.emitChunk("styles.css", "/* generated CSS */")
        },
    ],
    emitDir: "./dist/mochi",
})
```

Files are written to `emitDir`. Passing `null` to `emitChunk` deletes the file. Files no longer emitted are automatically deleted on the next run (tracked via `.mochi-emit.json` in `emitDir`).

#### Breaking: `BuilderOptions.extractors` removed

The `extractors` field has been removed from `BuilderOptions`. Extractor configuration is now done through the plugin system — pass `stages` instead, which is populated by calling `plugin.onLoad(ctx)` (see `createExtractorsPlugin` below).

#### New: `createExtractorsPlugin`

`createExtractorsPlugin` has moved to `@mochi-css/plugins` and now returns a `MochiPlugin` (from `@mochi-css/config`) instead of a flat result object. Wire it into a `FullContext` to collect all hooks, then pass them to the `Builder`:

```typescript
import { createExtractorsPlugin } from "@mochi-css/plugins"
import { FullContext } from "@mochi-css/config"
import { defaultExtractors } from "@mochi-css/builder"

const ctx = new FullContext(onDiagnostic)
const plugin = createExtractorsPlugin(defaultExtractors)
plugin.onLoad(ctx)

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

`FullContext` collects hooks registered by plugins. Its fields map directly to `BuilderOptions`:

| Context field | `BuilderOptions` field |
|---|---|
| `ctx.stages.getAll()` | `stages` |
| `ctx.sourceTransforms.getAll()` | `sourceTransforms` |
| `ctx.emitHooks.getAll()` | `emitHooks` |
| `ctx.cleanup.runAll()` | `cleanup` |
| `ctx.filePreProcess` | used in bundler `transform` hooks (Vite/Next) |

This is the recommended pattern for integrations that need CSS files written to disk.

#### New: `context.markForEval`

`AnalysisContext` now exposes `markForEval(filePath, expression)`. Call it in any transform hook to include an expression in the evaluation bundle for a specific file. The expression's identifier dependencies are traced automatically:

```typescript
// Store tracked expressions where both hooks can reach them
const trackedExprs: Array<{ tracked: SWC.CallExpression }> = []

const sourceTransform: AstPostProcessor = (index, context) => {
    trackedExprs.length = 0 // reset on each build
    for (const [, fileInfo] of index.files) {
        // find the expression you want evaluated at build time
        const expr = findMyExpression(fileInfo)
        if (expr) {
            const tracked = context.evaluator.valueWithTracking(expr)
            context.markForEval(fileInfo.filePath, tracked)
            trackedExprs.push({ tracked })
        }
    }
}
```

Read the runtime values back in a `postEvalTransforms` handler. Note that `tracked` expressions must be stored in a scope accessible by both hooks:
```typescript
const postTransform: AstPostProcessor = (_index, { evaluator }) => {
    for (const { tracked } of trackedExprs) {
        const value = evaluator.getTrackedValue(tracked)
        // use value...
    }
}
```

#### New: `StyleGenerator.getArgReplacements` (optional)

Generators may now implement `getArgReplacements()` to emit AST replacement nodes after `generateStyles()`. The builder substitutes these back into the source AST, enabling compile-time replacement of style object arguments with pre-computed runtime handles.

This is an optional interface extension — existing generators that don't implement it are unaffected.

---

### `@mochi-css/config`

#### New: `styledIdPlugin`

A new `styledIdPlugin` factory (from `@mochi-css/config`) returns a `MochiPlugin` that injects stable `s-` class IDs into every `styled()` call matched by the given extractors. This keeps class names stable across incremental builds.

```typescript
import { styledIdPlugin } from "@mochi-css/config"

const plugin = styledIdPlugin([mochiCssExtractor])
// then pass plugin to the plugins array in defineConfig / resolveConfig
```

The plugin registers two hooks:
- A `filePreProcess` transformation that inserts stable IDs into the raw source (used by Vite/Next `transform` hooks for runtime code).
- A `sourceTransforms` hook that injects the same IDs directly into the AST (used by the builder for CSS extraction).

It is idempotent — calls that already have an `s-` ID are skipped.

---

### `@mochi-css/react`

#### Type improvement: `MochiCSS<V[K]>` in `styled()` spread params

The variadic spread params of `styled()` now accept `MochiCSS<V[K]>` instead of unparameterized `MochiCSS`. This preserves variant type information when a typed `MochiCSS` instance is passed as a base style.

This is a non-breaking improvement for runtime behavior. TypeScript may surface new errors if you were passing a `MochiCSS<SomeVariants>` where the types now need to align with the component's own variant type `V[K]`. Update the type parameter or cast as needed.
