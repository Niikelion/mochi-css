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
    extractors: defaultExtractors,
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

#### New: `createExtractorsPlugin`

A new `createExtractorsPlugin` factory packages the extractor/generator lifecycle as a composable plugin:

```typescript
import { createExtractorsPlugin, defaultExtractors } from "@mochi-css/builder"

const plugin = createExtractorsPlugin(defaultExtractors)

const builder = new Builder({
    roots: ["./src"],
    extractors: plugin.extractors,
    bundler: new RolldownBundler(),
    runner: new VmRunner(),
    sourceTransforms: plugin.sourceTransforms,
    emitHooks: plugin.emitHooks,
    emitDir: "./dist/mochi",
    cleanup: plugin.cleanup,
})
```

`createExtractorsPlugin` returns an `ExtractorsPluginResult` with these fields:

| Field | Description |
|-------|-------------|
| `extractors` | Extractor instances to pass to `Builder` |
| `sourceTransforms` | AST transform hooks to wire into `sourceTransforms` |
| `emitHooks` | Emit hooks to wire into `emitHooks` |
| `getGenerators()` | Returns the `Map<string, StyleGenerator>` of generators captured during the last build |
| `cleanup` | Releases internal caches — wire into `cleanup` |

This is the recommended pattern for integrations that need CSS files written to disk.

#### New: `context.markForEval`

`AnalysisContext` now exposes `markForEval(filePath, expression)`. Call it in any transform hook to include an expression in the evaluation bundle for a specific file. The expression's identifier dependencies are traced automatically:

```typescript
const sourceTransform: AstPostProcessor = (index, context) => {
    for (const [, fileInfo] of index.files) {
        // find the expression you want evaluated at build time
        const expr = findMyExpression(fileInfo)
        if (expr) {
            const tracked = context.evaluator.valueWithTracking(expr)
            context.markForEval(fileInfo.filePath, tracked)
        }
    }
}
```

Read the runtime value back in a `postEvalTransforms` handler:
```typescript
const postTransform: AstPostProcessor = (_index, { evaluator }) => {
    const value = evaluator.getTrackedValue(tracked)
}
```

#### New: `StyleGenerator.getArgReplacements` (optional)

Generators may now implement `getArgReplacements()` to emit AST replacement nodes after `generateStyles()`. The builder substitutes these back into the source AST, enabling compile-time replacement of style object arguments with pre-computed runtime handles.

This is an optional interface extension — existing generators that don't implement it are unaffected.

---

### `@mochi-css/react`

#### Type improvement: `MochiCSS<V[K]>` in `styled()` spread params

The variadic spread params of `styled()` now accept `MochiCSS<V[K]>` instead of unparameterized `MochiCSS`. This preserves variant type information when a typed `MochiCSS` instance is passed as a base style.

This is a non-breaking improvement for runtime behavior. TypeScript may surface new errors if you were passing a `MochiCSS<SomeVariants>` where the types now need to align with the component's own variant type `V[K]`. Update the type parameter or cast as needed.
