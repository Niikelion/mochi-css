# v4 → v5 Migration Guide

This release moves plugin-authoring primitives out of `@mochi-css/builder` into the dedicated `@mochi-css/plugins` package, and tidies up a few other type homes. End-users of `@mochi-css/vanilla`, `@mochi-css/stitches`, and `@mochi-css/react` / `@mochi-css/vanilla-react` are **not affected** by these changes.

---

## Who is affected?

These changes only affect **plugin authors, custom integrations, and tooling** that imports directly from `@mochi-css/builder`, `@mochi-css/config`, or `@mochi-css/plugins`.

---

## `@mochi-css/builder`

### Breaking: stage exports removed

All pipeline stage classes, factory functions, symbols, and their output types have been removed from `@mochi-css/builder`. They now live in `@mochi-css/plugins`.

**Removed from `@mochi-css/builder`:**

| Removed export | New location |
|---|---|
| `ImportSpecStage`, `makeImportSpecStage`, `IMPORT_SPEC_STAGE` | `@mochi-css/plugins` |
| `DerivedExtractorStage`, `makeDerivedExtractorStage`, `DERIVED_EXTRACTOR_STAGE` | `@mochi-css/plugins` |
| `StyleExprStage`, `makeStyleExprStage`, `STYLE_EXPR_STAGE` | `@mochi-css/plugins` |
| `BindingStage`, `makeBindingStage`, `BINDING_STAGE` | `@mochi-css/plugins` |
| `CrossFileDerivedStage`, `makeCrossFileDerivedStage`, `CROSS_FILE_DERIVED_STAGE` | `@mochi-css/plugins` |
| `ImportSpecStageOut`, `DerivedExtractorStageOut`, `StyleExprStageOut`, `BindingStageOut` | `@mochi-css/plugins` |
| `CrossFileDerivedStageOut`, `CrossFileResult`, `CrossFileExtra`, `ExtractorLookup`, `FileData` | `@mochi-css/plugins` |
| `createDefaultStages`, `defaultStages` | removed — use `createExtractorsPlugin` |

**Before:**
```typescript
import {
    makeImportSpecStage,
    IMPORT_SPEC_STAGE,
    makeBindingStage,
    createDefaultStages,
} from "@mochi-css/builder"
```

**After:**
```typescript
import {
    makeImportSpecStage,
    IMPORT_SPEC_STAGE,
    makeBindingStage,
} from "@mochi-css/plugins"
```

For the common case of setting up the default stage pipeline, use `createExtractorsPlugin` instead of `createDefaultStages`:

```typescript
import { createExtractorsPlugin } from "@mochi-css/plugins"
import { FullContext } from "@mochi-css/config"

const ctx = new FullContext(onDiagnostic)
createExtractorsPlugin(myExtractors).onLoad(ctx)
// ctx.stages.getAll() now contains the default stages
```

### Breaking: `StyleExtractor` and `StyleGenerator` types moved

**Before:**
```typescript
import type { StyleExtractor, StyleGenerator } from "@mochi-css/builder"
```

**After:**
```typescript
import type { StyleExtractor, StyleGenerator } from "@mochi-css/plugins"
```

### Breaking: `extractRelevantSymbols` moved

**Before:**
```typescript
import { extractRelevantSymbols } from "@mochi-css/builder"
```

**After:**
```typescript
import { extractRelevantSymbols } from "@mochi-css/plugins"
```

### Breaking: `ProjectIndex` removed

`ProjectIndex` has been removed. Use `StageRunner` (also exported from `@mochi-css/builder`) as the replacement.

### Breaking: `AstPostProcessor` and `EmitHook` callback signatures

Both types now receive a `StageRunner` as the first argument instead of `ProjectIndex`.

**Before:**
```typescript
import type { AstPostProcessor, EmitHook } from "@mochi-css/builder"
import type { ProjectIndex } from "@mochi-css/builder"

const transform: AstPostProcessor = (index: ProjectIndex, context) => { ... }
const emit: EmitHook = (index: ProjectIndex, context) => { ... }
```

**After:**
```typescript
import type { AstPostProcessor, EmitHook, StageRunner } from "@mochi-css/builder"

const transform: AstPostProcessor = (runner: StageRunner, context) => { ... }
const emit: EmitHook = (runner: StageRunner, context) => { ... }
```

### Breaking: `CacheRegistry` type split

`CacheRegistry` is now accompanied by `FileCache`, `FileInput`, and `ProjectCache` which were previously internal. Update imports as needed — `CacheRegistry` itself is still exported from `@mochi-css/builder`.

### Breaking: `OnDiagnostic` moved

`OnDiagnostic` is no longer re-exported from `@mochi-css/builder`.

**Before:**
```typescript
import type { OnDiagnostic } from "@mochi-css/builder"
```

**After:**
```typescript
import type { OnDiagnostic } from "@mochi-css/core"
```

---

## `@mochi-css/config`

### Breaking: `styledIdPlugin` moved to `@mochi-css/plugins`

`styledIdPlugin` is no longer exported from `@mochi-css/config`.

**Before:**
```typescript
import { styledIdPlugin } from "@mochi-css/config"
```

**After:**
```typescript
import { styledIdPlugin } from "@mochi-css/plugins"
```

### New: additional hook provider types exported

The following types are now exported from `@mochi-css/config` for use in custom plugin implementations:

- `InitializeStagesHookProvider`
- `PrepareAnalysisHookProvider`
- `GetFileDataHookProvider`
- `InvalidateFilesHookProvider`
- `ResetCrossFileStateHookProvider`
- `GetFilesToBundleHookProvider`

---

## `@mochi-css/plugins`

### New: home for extractor/generator primitives

`@mochi-css/plugins` is now the single place to import types and utilities for building custom extractors and plugins:

```typescript
import type { StyleExtractor, StyleGenerator, DerivedExtractorBinding } from "@mochi-css/plugins"
import { styledIdPlugin, extractRelevantSymbols } from "@mochi-css/plugins"
import {
    makeImportSpecStage, IMPORT_SPEC_STAGE,
    makeDerivedExtractorStage, DERIVED_EXTRACTOR_STAGE,
    makeStyleExprStage, STYLE_EXPR_STAGE,
    makeBindingStage, BINDING_STAGE,
    makeCrossFileDerivedStage, CROSS_FILE_DERIVED_STAGE,
} from "@mochi-css/plugins"
```

---

## `@mochi-css/core`

### New: `OnDiagnostic` exported

`@mochi-css/core` now exports `OnDiagnostic` and related diagnostic utilities. This is the canonical home going forward.

---

## `@mochi-css/tsuki`

Tsuki's version is now v5, which means running `tsuki add` will install the v5 suite packages (`@mochi-css/vanilla@^5.0.0`, etc.). If you were pinning to an older tsuki, upgrade to v5 before adding mochi-css to a new project.
