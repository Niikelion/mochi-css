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

#### New: `emitHooks` and `emitDir`

Plugins can now produce output files from the pipeline. Add `emitHooks` and `emitDir` to `BuilderOptions`:

```typescript
const builder = new Builder({
    roots: ["./src"],
    extractors: defaultExtractors,
    bundler: new RolldownBundler(),
    runner: new VmRunner(),
    emitHooks: [
        async (index, context) => {
            return { "styles.css": "/* generated CSS */" }
        },
    ],
    emitDir: "./dist/mochi",
})
```

Files are written to `emitDir`. A `null` value deletes the file. Files no longer present in the hook's output are automatically deleted on the next run (tracked via `.mochi-emit.json` in `emitDir`).

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

Read the runtime value back in a `postEvalTransform`:
```typescript
const postTransform: AstPostProcessor = (_index, { evaluator }) => {
    const value = evaluator.getTrackedValue(trackedNode)
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
