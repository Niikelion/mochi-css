---
"@mochi-css/builder": major
"@mochi-css/react": minor
---

## Breaking changes

### `AnalysisContext` no longer has generator-related fields

`registerGenerators` has been removed from `AnalysisContext`. Any code that constructs an `AnalysisContext` object directly must remove the `registerGenerators` field.

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

### `FileInfo.extractedCallExpressions` is now required

`FileInfo` now has a required `extractedCallExpressions: Map<StyleExtractor, SWC.CallExpression[]>` field. Any code constructing `FileInfo` objects manually must add this field.

---

## New features (`@mochi-css/builder`)

### `EmitHook` — post-execution file output

A new `EmitHook` type lets plugins produce files after style execution:

```typescript
export type EmitHook = (
    index: ProjectIndex,
    context: AnalysisContext,
) => Record<string, string | null> | Promise<Record<string, string | null>>
```

Values are file contents (written to `emitDir`) or `null` (delete the file). Files no longer returned are automatically deleted based on a `.mochi-emit.json` manifest.

Add emit hooks and a target directory via `BuilderOptions`:

```typescript
new Builder({
    // ...
    emitHooks: [myEmitHook],
    emitDir: "./dist/mochi",
})
```

### `createExtractorsPlugin`

A new factory packages the extractor/generator lifecycle as a portable plugin object:

```typescript
import { createExtractorsPlugin, mochiCssFunctionExtractor } from "@mochi-css/builder"

const plugin = createExtractorsPlugin([mochiCssFunctionExtractor])

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

### `context.markForEval`

`AnalysisContext` now exposes `markForEval(filePath, expression)`. Use it in any transform hook to include an expression in the eval bundle and trace its identifier dependencies — without the conflicts that would arise if multiple plugins each controlled code generation via a `codegenHook`.

```typescript
const sourceTransform: AstPostProcessor = (index, context) => {
    for (const [, fileInfo] of index.files) {
        const expr = findMyExpression(fileInfo)
        if (expr) context.markForEval(fileInfo.filePath, expr)
    }
}
```

### `StyleGenerator.getArgReplacements` (optional)

Generators may now implement an optional `getArgReplacements()` method. After `generateStyles()`, it returns AST replacement expressions (one per `collectArgs` call) that the builder substitutes back into the source AST — enabling compile-time replacement of runtime style objects.

---

## Type improvement (`@mochi-css/react`)

`styled()` spread params now use `MochiCSS<V[K]>` instead of bare `MochiCSS`, preserving variant type information when a typed `MochiCSS` instance is passed as a base style.
