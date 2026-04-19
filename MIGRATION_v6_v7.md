# v6 → v7 Migration Guide

Two changes drive this release: the StageContext refactor (breaking infrastructure changes) and zero-runtime substitution (additive feature with one breaking cleanup in plugin types).

End users of `@mochi-css/vite`, `@mochi-css/next`, or `@mochi-css/postcss` are **unaffected**. Only plugin authors, custom integration builders, or code calling `Builder` directly must migrate.

---

## `@mochi-css/builder`

### Breaking: `StageDefinition.init` — `registry` replaced by `context`

**Before:**
```ts
export const myStage = defineStage({
    dependsOn: [],
    init(registry: CacheRegistry): MyOut {
        const cache = registry.fileCache(...)
    },
})
```

**After:**
```ts
export const myStage = defineStage({
    dependsOn: [],
    init(context: StageContext): MyOut {
        const { registry } = context  // log and resolveImport also available
        const cache = registry.fileCache(...)
    },
})
```

### Breaking: `BuilderOptions.onDiagnostic` is now required

**Before:** `onDiagnostic?: OnDiagnostic`

**After:** `onDiagnostic: OnDiagnostic`

Pass `() => {}` if diagnostics are not needed.

### Breaking: `BuilderOptions.initializeStages` callback signature

**Before:**
```ts
initializeStages: (runner, modules, resolveImport, onDiagnostic) => { ... }
```

**After:**
```ts
initializeStages: (runner) => { ... }
```

`resolveImport` and `onDiagnostic` are now available via `StageContext` inside each stage's `init()`.

### Breaking: `Builder.collectStylesFromModules` return type

**Before:**
```ts
const chunks = await builder.collectStylesFromModules(modules)
// chunks: Map<string, Set<string>>
```

**After:**
```ts
const { chunks, modifiedSources } = await builder.collectStylesFromModules(modules)
// chunks: Map<string, Set<string>>
// modifiedSources: Map<string, string>  — source files with AST substitutions applied
```

---

## `@mochi-css/plugins`

### Breaking: `StyleGenerator.getArgReplacements()` removed

The old API accumulated results across all `collectArgs()` calls and returned them after `generateStyles()`. The new API requires generators to produce the substitution expression synchronously per `collectArgs()` call.

**Before:**
```ts
class MyGenerator extends StyleGenerator {
    private collected: { source: string; expression: SWC.Expression }[] = []

    collectArgs(source: string, args: unknown[]): void {
        this.collected.push({ source, expression: buildNode(args) })
    }

    async generateStyles() { ... }

    override getArgReplacements() {
        return this.collected
    }
}
```

**After:**
```ts
class MyGenerator extends StyleGenerator {
    private currentSubstitution: SWC.Expression | null = null

    collectArgs(source: string, args: unknown[]): void {
        this.currentSubstitution = buildNode(args)  // or null on failure
    }

    async generateStyles() { ... }

    override extractSubstitution(): SWC.Expression | null {
        return this.currentSubstitution
    }
}
```

Also add a `substitution` spec to the matching `StyleExtractor`:
```ts
readonly substitution = {
    importName: "myHelper",          // named import to inject; omit if not needed
    importPath: "@my-pkg/runtime",   // defaults to extractor.importPath if omitted
    mode: "full" as const,           // "full": replace entire call; "args": keep non-static args
}
```

### Breaking: `ImportSpecStageOut.fileCallbacks` removed

**Before** — set in `initializeStages`:
```ts
ctx.initializeStages.register((runner, modules, resolveImport, onDiagnostic) => {
    const importOut = runner.getInstance(importStageDef)
    for (const m of modules) {
        importOut.fileCallbacks.set(m.filePath, { resolveImport, onDiagnostic })
    }
})
```

**After** — delete the entire callback body. `resolveImport` and `log` are available via `StageContext`:
```ts
// Stages that previously read from fileCallbacks now read from context:
init(context: StageContext): MyOut {
    const { resolveImport, log } = context
}
```

---

## `@mochi-css/config`

### Breaking: `InitializeStagesHookProvider.register` callback signature

**Before:**
```ts
ctx.initializeStages.register((runner, modules, resolveImport, onDiagnostic) => { ... })
```

**After:**
```ts
ctx.initializeStages.register((runner) => { ... })
```

---

## `@mochi-css/stitches`

### Breaking: `StitchesGenerator.collectArgs` return type

**Before:** returned `Record<string, StyleGenerator>` (the sub-generator group)

**After:** returns `void`; access sub-generators via `generator.getLastSubGenGroup()` instead:
```ts
generator.collectArgs(source, args)
const subGens = generator.getLastSubGenGroup()
```
