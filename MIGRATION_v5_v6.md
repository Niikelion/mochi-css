# v5 → v6 Migration Guide

This release overhauls the stage definition API in `@mochi-css/plugins`, restructures how file data flows through the cache engine, and adds first-class barrel-file support. End-users of `@mochi-css/vanilla`, `@mochi-css/stitches`, and `@mochi-css/react` / `@mochi-css/vanilla-react` are **not affected** by these changes.

---

## Who is affected?

These changes only affect **plugin authors, custom integrations, and tooling** that imports directly from `@mochi-css/builder` or `@mochi-css/plugins`.

---

## `@mochi-css/builder`

### Breaking: `FileInput<T>` — `.cache` wrapper removed

`FileInput<T>` no longer wraps the read side under `.cache`. Call `.for(filePath)` directly.

**Before:**
```typescript
const cached = myInput.cache.for(filePath)
```

**After:**
```typescript
const cached = myInput.for(filePath)
```

### Breaking: `getOrInsert` and `isLocalImport` moved to `@mochi-css/plugins`

These utility functions are no longer exported from `@mochi-css/builder`.

**Before:**
```typescript
import { getOrInsert, isLocalImport } from "@mochi-css/builder"
```

**After:**
```typescript
import { getOrInsert, isLocalImport } from "@mochi-css/plugins"
```

### Breaking: `createCacheRegistry` removed

`createCacheRegistry` has been removed. Cache engine construction is now internal — use `new StageRunner(filePaths, stages)` and access the engine via `runner.engine`.

### Breaking: `propagateUsagesFromRef`, `propagateUsagesFromExpr`, and `ReexportResolver` moved to `@mochi-css/plugins`

These were only used by plugin implementations, so they now live alongside the stage definitions.

**Before:**
```typescript
import { propagateUsagesFromExpr, propagateUsagesFromRef } from "@mochi-css/builder"
import type { ReexportResolver } from "@mochi-css/builder"
```

**After:**
```typescript
import { propagateUsagesFromExpr, propagateUsagesFromRef } from "@mochi-css/plugins"
import type { ReexportResolver } from "@mochi-css/plugins"
```

### Breaking: `FileView` removed — use `FileInfo` from `@mochi-css/plugins`

`FileView` was a minimal interface representing the subset of per-file data needed for propagation and AST minimization. It has been removed; all its fields are already present on `FileInfo` in `@mochi-css/plugins`.

**Before:**
```typescript
import type { FileView } from "@mochi-css/builder"
```

**After:**
```typescript
import type { FileInfo } from "@mochi-css/plugins"
```

### Breaking: AST minimizer functions now take `Set<BindingInfo>` instead of `FileView`

`generateMinimalModuleItem`, `pruneUnusedPatternParts`, `isPatternPropertyUsed`, and `isPatternElementUsed` previously accepted a `FileView` as their second argument and internally read `.usedBindings` from it. They now accept the `Set<BindingInfo>` directly.

**Before:**
```typescript
import { generateMinimalModuleItem } from "@mochi-css/builder"

generateMinimalModuleItem(item, fileInfo)
```

**After:**
```typescript
import { generateMinimalModuleItem } from "@mochi-css/builder"

generateMinimalModuleItem(item, fileInfo.usedBindings)
```

### New: `CacheEngine`, `FileInfo`, `ProjectInput` exports

Three new types are exported from `@mochi-css/builder`:

- **`CacheEngine`** — extends `CacheRegistry` with a writable `fileData: FileInput<FileInfo>` field
- **`FileInfo`** — `{ filePath: string; ast: SWC.Module }` — the canonical file data record
- **`ProjectInput<T>`** — `{ value: Cached<T>; set(value: T): void }` — a single-value writable input

`CacheRegistry` gains two new members:
- `fileData: FileCache<FileInfo>` — read-only access to core file data
- `projectInput<T>(): ProjectInput<T>` — creates a project-level writable input

### New: `StageRunner.engine`

`StageRunner` now exposes `engine: CacheEngine`. Use it to inject file data and other inputs from outside stage definitions:

```typescript
runner.engine.fileData.set(filePath, { filePath, ast })
```

---

## `@mochi-css/plugins`

### New: barrel files included in `.mochi/` bundle automatically

Barrel files (`export * from "./..."`, `export { x } from "./..."`) that have no CSS expressions are now emitted into the `.mochi/` virtual bundle with their reexport declarations intact. Previously they were silently omitted, causing `UNRESOLVED_IMPORT` errors when a bundled file imported through a barrel. No migration needed — this is a bug fix.

### New: `exportsStage` for cross-file reexport tracking

A new `exportsStage` is now registered in the default pipeline and available for custom stage consumers. For each file it produces:

- **`reexports: Map<resolvedSourcePath, ReexportEntry[]>`** — named reexports (`export { foo } from "./source"`, `export { foo as bar } from "./source"`). Each entry is `{ originalName: string; exportedName: string }`.
- **`namespaceReexports: Set<resolvedSourcePath>`** — namespace reexports (`export * from "./source"`).

Only local imports (starting with `./` or `../`) are tracked. Package imports are silently ignored. Unresolvable local paths emit a `MOCHI_UNRESOLVED_IMPORT` diagnostic.

```typescript
import { exportsStage } from "@mochi-css/plugins"

const exportsOut = runner.getInstance(exportsStage)
const { reexports, namespaceReexports } = exportsOut.fileExports.for(filePath).get()

// e.g. export { foo as bar } from "./utils"
// → reexports.get("/abs/path/to/utils.ts") === [{ originalName: "foo", exportedName: "bar" }]
```

`exportsStage` depends only on `importStageDef` and is registered automatically when using `createExtractorsPlugin`. Custom `StageRunner` setups should add it to their stage list.

### Breaking: `StyleGenerator` gains abstract `mockFunction`

`StyleGenerator` is now an abstract class with a required `mockFunction(...args: unknown[]): unknown` method. All custom generator subclasses must implement it.

`mockFunction` is called during the bundle execution phase to produce the runtime return value for the mocked function. Return the same shape that the real runtime function would return — for example, a `MochiCSS` instance for CSS generators, or `() => {}` for `globalCss`-style generators.

**Before:**
```typescript
class MyGenerator extends StyleGenerator {
    collectArgs(source, args) { ... }
    async generateStyles() { ... }
}
```

**After:**
```typescript
class MyGenerator extends StyleGenerator {
    override mockFunction(...args: unknown[]): unknown {
        return (myRuntimeFn as (...a: unknown[]) => unknown)(...args)
    }
    collectArgs(source, args) { ... }
    async generateStyles() { ... }
}
```

### New: `FileInfo` gains `reexports` and `namespaceReexports`

`FileInfo` (in `@mochi-css/plugins`) now includes two fields populated from `exportsStage`:

- **`reexports: Map<string, ReexportInfo>`** — maps each exported name to its original source path and name (`{ sourcePath: string; originalName: string }`)
- **`namespaceReexports: Set<string>`** — resolved absolute paths for `export * from "..."` declarations

Custom code that constructs or destructures `FileInfo` must handle these two new required fields.

### Breaking: stage factory functions and symbols removed

All `make*Stage` factory functions and `*_STAGE` symbols have been removed. Replaced by static stage definitions exported as plain `const` values.

| Removed | Replacement |
|---|---|
| `makeImportSpecStage(extractors)`, `IMPORT_SPEC_STAGE` | `importStageDef` |
| `makeDerivedExtractorStage()`, `DERIVED_EXTRACTOR_STAGE` | `derivedStageDef` |
| `makeStyleExprStage()`, `STYLE_EXPR_STAGE` | `styleExprStageDef` |
| `makeBindingStage()`, `BINDING_STAGE` | `bindingStageDef` |
| `makeCrossFileDerivedStage()`, `CROSS_FILE_DERIVED_STAGE` | `crossFileDerivedStageDef` |

**Before:**
```typescript
import { makeImportSpecStage, makeBindingStage } from "@mochi-css/plugins"

const stages = [
    makeImportSpecStage(extractors),
    derivedStage,
    styleExprStage,
    makeBindingStage(),
]
const runner = new StageRunner(filePaths, stages)
```

**After:**
```typescript
import { importStageDef, derivedStageDef, styleExprStageDef, bindingStageDef } from "@mochi-css/plugins"

const runner = new StageRunner(filePaths, [importStageDef, derivedStageDef, styleExprStageDef, bindingStageDef])

// Inject external data after construction:
const importOut = runner.getInstance(importStageDef)
importOut.extractors.set(extractors)
```

### Breaking: `FileData` replaced by `FileCallbacks`

`FileData` (which bundled `filePath`, `ast`, `resolveImport`, and `onDiagnostic`) has been split. File path and AST are now first-class on `CacheEngine`; the callback-only remainder is `FileCallbacks`.

**Removed:** `FileData`

**Added:** `FileCallbacks = { resolveImport: ResolveImport; onDiagnostic?: OnDiagnostic }`

### Breaking: `ImportSpecStageOut` restructured

`ImportSpecStageOut` no longer carries `fileData`. It now exposes writable inputs for the two pieces of external data that `ImportSpecStage` needs:

**Before:**
```typescript
const importOut = runner.getInstance(IMPORT_SPEC_STAGE)
importOut.fileData.set(filePath, { filePath, ast, resolveImport, onDiagnostic })
```

**After:**
```typescript
const importOut = runner.getInstance(importStageDef)
importOut.extractors.set(extractorLookup)           // ProjectInput<ExtractorLookup>
importOut.fileCallbacks.set(filePath, { resolveImport, onDiagnostic })  // FileInput<FileCallbacks>
runner.engine.fileData.set(filePath, { filePath, ast })                 // on CacheEngine directly
```

### Breaking: downstream stage outputs no longer carry `fileData`

`DerivedExtractorStageOut`, `StyleExprStageOut`, `BindingStageOut`, and `CrossFileDerivedStageOut` no longer have a `fileData` field. Retrieve file data from `runner.engine.fileData.for(filePath).get()` instead.

---

## `@mochi-css/config`

### New: `createBuilder` helper

`createBuilder(config: Config, context: FullContext): Builder` constructs a fully wired `Builder` from a resolved config and its plugin context. Custom integrations should use this instead of manually mapping `BuilderOptions`.

```typescript
import { resolveConfig, FullContext, createBuilder } from "@mochi-css/config"

const config = await resolveConfig(fileConfig)
const context = new FullContext(config.onDiagnostic ?? (() => {}))
for (const plugin of config.plugins) plugin.onLoad?.(context)

const builder = createBuilder(config, context)
```