# @mochi-css/react

## 4.0.2

### Patch Changes

- Updated dependencies [2bec524]
    - @mochi-css/vanilla@6.0.0

## 4.0.1

### Patch Changes

- Updated dependencies [c50b75a]
    - @mochi-css/vanilla@5.0.0

## 4.0.0

### Major Changes

- 71b74a6: Align all packages to v4.

### Minor Changes

- 71b74a6: Deprecate `@mochi-css/react` in favour of `@mochi-css/vanilla-react`.

    `@mochi-css/vanilla-react` provides the same `styled` runtime plus a pre-configured `defineConfig` entry point (`@mochi-css/vanilla-react/config`) that wires up the extractor and `styledIdPlugin` automatically.

    **Migration:**

    ```diff
    - import { styled } from "@mochi-css/react"
    + import { styled } from "@mochi-css/vanilla-react"
    ```

    ```diff
    - import { defineConfig } from "@mochi-css/config"
    + import { defineConfig } from "@mochi-css/vanilla-react/config"
    ```

    `@mochi-css/react` will not receive new features and will be removed in a future major version.

### Patch Changes

- @mochi-css/vanilla@5.0.0

## 3.1.0

### Minor Changes

- ee02bb1: ## Breaking changes (`@mochi-css/builder`)

    ### `BuilderOptions.extractors` removed

    The `extractors` field has been removed from `BuilderOptions`. Extractor configuration is now done through the plugin system via `stages`. Use `createExtractorsPlugin` from `@mochi-css/plugins` and wire the result through a `FullContext`:

    **Before:**

    ```typescript
    new Builder({ roots, extractors: defaultExtractors, bundler, runner })
    ```

    **After:**

    ```typescript
    import { createExtractorsPlugin } from "@mochi-css/plugins"
    import { FullContext } from "@mochi-css/config"

    const ctx = new FullContext(onDiagnostic)
    createExtractorsPlugin(defaultExtractors).onLoad(ctx)

    new Builder({
        roots,
        stages: [...ctx.stages.getAll()],
        bundler,
        runner,
        sourceTransforms: [...ctx.sourceTransforms.getAll()],
        emitHooks: [...ctx.emitHooks.getAll()],
        cleanup: () => ctx.cleanup.runAll(),
    })
    ```

    ### `BuilderOptions.astPostProcessors` renamed to `sourceTransforms`

    The `astPostProcessors` option has been renamed to `sourceTransforms` to better reflect its role.

    ### `AnalysisContext` has new required fields

    `AnalysisContext` now has `evaluator`, `emitChunk`, and `markForEval`. Code that manually constructs an `AnalysisContext` (typically tests or custom tooling) must add these fields:

    **Before:**

    ```typescript
    const ctx: AnalysisContext = { onDiagnostic }
    ```

    **After:**

    ```typescript
    const ctx: AnalysisContext = {
        onDiagnostic,
        evaluator,
        emitChunk: () => {},
        markForEval: () => {},
    }
    ```

    ### `FileInfo.extractedCallExpressions` is now required

    `FileInfo` now has a required `extractedCallExpressions: Map<StyleExtractor, SWC.CallExpression[]>` field. Code that manually constructs `FileInfo` objects must add this field.

    ***

    ## New features (`@mochi-css/builder`)

    ### `stages` — analysis pipeline configuration

    `BuilderOptions` now accepts `stages: StageDefinition[]`. Stages carry extractor configuration through the analysis pipeline. Populate via `createExtractorsPlugin(...).onLoad(ctx)` and pass `ctx.stages.getAll()`.

    ### `sourceTransforms`, `preEvalTransforms`, `postEvalTransforms`

    Three new transform hooks control different phases of the pipeline:
    - **`sourceTransforms`** — run after analysis on the canonical AST index. Mutations persist and are visible to `postEvalTransforms`.
    - **`preEvalTransforms`** — run on a deep copy of the ASTs before evaluation. Mutations do NOT persist.
    - **`postEvalTransforms`** — run after code execution. The evaluator is populated — use `context.evaluator.getTrackedValue()` to read runtime values.

    ### `emitHooks` and `emitDir`

    `emitHooks: EmitHook[]` run after `postEvalTransforms`. Call `context.emitChunk(path, content)` to write files to `emitDir`. Files no longer emitted are automatically deleted (tracked via `.mochi-emit.json`).

    ```typescript
    export type EmitHook = (index: ProjectIndex, context: AnalysisContext) => void | Promise<void>
    ```

    ### `context.markForEval`

    `AnalysisContext.markForEval(filePath, expression)` includes an expression in the eval bundle for a given file, tracing its identifier dependencies automatically. Combine with `evaluator.valueWithTracking(expr)` to read back the runtime value in a `postEvalTransforms` handler.

    ### `StyleGenerator.getArgReplacements` (optional)

    Generators may now implement `getArgReplacements(): Array<{ source: string; expression: SWC.Expression }>`. After `generateStyles()`, the builder substitutes these back into the source AST — enabling compile-time replacement of runtime style object arguments.

    ### `cleanup`

    `BuilderOptions.cleanup` is called once at the end of each build to release caches built up during the pipeline.

    ***

    ## Type improvement (`@mochi-css/react`)

    ### `MochiCSS<V[K]>` in `styled()` spread params

    The variadic spread params of `styled()` now use `MochiCSS<V[K]>` instead of bare `MochiCSS`, preserving variant type information when a typed `MochiCSS` instance is passed as a base style.

### Patch Changes

- @mochi-css/vanilla@4.0.0

## 3.0.0

### Major Changes

- a674152: Extracted `styled` function from vanilla to separate `react` package.

### Patch Changes

- Updated dependencies [a674152]
    - @mochi-css/vanilla@3.0.0

## 2.2.0

### Minor Changes

- 27a1717: styled is no longer exported from @mochi-css/vanilla — import it from @mochi-css/react instead

### Patch Changes

- Updated dependencies [27a1717]
    - @mochi-css/vanilla@2.2.0
