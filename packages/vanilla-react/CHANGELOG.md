# @mochi-css/react

## 5.0.0

### Major Changes

- c50b75a: Refactor: move extractor/generator types and pipeline stages from `@mochi-css/builder` to `@mochi-css/plugins`; move `styledIdPlugin` from `@mochi-css/config` to `@mochi-css/plugins`; move `OnDiagnostic` to `@mochi-css/core`.

    **Breaking changes:**
    - `StyleExtractor`, `StyleGenerator`, and all pipeline stage exports (`ImportSpecStage`, `DerivedExtractorStage`, `StyleExprStage`, `BindingStage`, `CrossFileDerivedStage` and their factory/symbol counterparts) moved from `@mochi-css/builder` to `@mochi-css/plugins`
    - `extractRelevantSymbols` moved from `@mochi-css/builder` to `@mochi-css/plugins`
    - `styledIdPlugin` moved from `@mochi-css/config` to `@mochi-css/plugins`
    - `OnDiagnostic` moved from `@mochi-css/builder` to `@mochi-css/core`
    - `ProjectIndex` removed from `@mochi-css/builder`; replaced by `StageRunner`
    - `AstPostProcessor` and `EmitHook` callback signatures changed: first argument is now `StageRunner` instead of `ProjectIndex`
    - `createDefaultStages` / `defaultStages` removed from `@mochi-css/builder`
    - `CacheRegistry` type split into `CacheRegistry`, `FileCache`, `FileInput`, `ProjectCache` in `@mochi-css/builder`

    See the v4 → v5 migration guide for details.

### Patch Changes

- Updated dependencies [c50b75a]
    - @mochi-css/plugins@5.0.0
    - @mochi-css/config@5.0.0
    - @mochi-css/vanilla@5.0.0

## 4.0.0

### Major Changes

- 71b74a6: Align all packages to v4.

### Patch Changes

- Updated dependencies [71b74a6]
    - @mochi-css/config@4.0.0
    - @mochi-css/plugins@4.0.0
    - @mochi-css/vanilla@5.0.0

## 3.1.0

### Minor Changes

- 7256944: ## New package: `@mochi-css/plugins`

    Introduces `@mochi-css/plugins` as the home for `createExtractorsPlugin` and the plugin utilities layer.

    ### `createExtractorsPlugin(extractors)`

    Packages a list of `StyleExtractor` instances as a `MochiPlugin`. When loaded via `plugin.onLoad(ctx)`, it registers the analysis stages, source transform (sets up per-build generators), and emit hook (calls `generateStyles()`, emits CSS via `context.emitChunk()`, applies AST arg replacements).

    ```typescript
    import { createExtractorsPlugin } from "@mochi-css/plugins"
    import { defaultExtractors } from "@mochi-css/builder"

    const plugin = createExtractorsPlugin(defaultExtractors)
    ```

    ### `PluginContextCollector`

    A lightweight `PluginContext` implementation that collects hooks into arrays — useful for unit-testing plugins or building minimal integrations without the full `FullContext` from `@mochi-css/config`.

    ```typescript
    import { PluginContextCollector } from "@mochi-css/plugins"

    const collector = new PluginContextCollector(onDiagnostic)
    plugin.onLoad(collector)
    // collector.getStages(), collector.getSourceTransforms(), etc.
    ```

    ***

    ## New features (`@mochi-css/config`)

    ### `MochiPlugin.onLoad`

    `MochiPlugin` now supports an `onLoad(context: PluginContext)` hook called after config resolution. Use it to register stages, source transforms, emit hooks, and cleanup functions.

    ```typescript
    export const myPlugin: MochiPlugin = {
        name: "my-plugin",
        onLoad(context) {
            context.emitHooks.register(async (_index, ctx) => {
                ctx.emitChunk("output.txt", "generated")
            })
        },
    }
    ```

    ### `PluginContext` interface and `FullContext` class

    `PluginContext` is the context object passed to `onLoad`. `FullContext` is the concrete implementation used by integrations (Vite, PostCSS, Next.js). Its fields — `stages`, `sourceTransforms`, `emitHooks`, `cleanup`, `filePreProcess` — map directly to `BuilderOptions`.

    ```typescript
    import { FullContext } from "@mochi-css/config"

    const ctx = new FullContext(onDiagnostic)
    for (const plugin of plugins) plugin.onLoad?.(ctx)

    new Builder({
        stages: [...ctx.stages.getAll()],
        sourceTransforms: [...ctx.sourceTransforms.getAll()],
        emitHooks: [...ctx.emitHooks.getAll()],
        cleanup: () => ctx.cleanup.runAll(),
        // ...
    })
    ```

    ### `styledIdPlugin(extractors)`

    A new built-in `MochiPlugin` that injects stable `s-` class IDs into every `styled()` call matched by the given extractors. IDs are derived from the source file path and variable name, ensuring they remain stable across incremental builds.

    Registers two hooks:
    - `filePreProcess` — text-level injection for runtime source (used by Vite/Next `transform` hooks)
    - `sourceTransforms` — AST-level injection for CSS extraction

    Idempotent — calls that already carry an `s-` ID are skipped.

    ***

    ## New package: `@mochi-css/vanilla-react`

    Introduces `@mochi-css/vanilla-react` — a thin package combining `@mochi-css/vanilla` styled components with a config entry point (`@mochi-css/vanilla-react/config`) that pre-wires the `styled` extractor and `styledIdPlugin`.

    ```typescript
    // mochi.config.ts
    import { defineConfig } from "@mochi-css/vanilla-react/config"

    export default defineConfig({
        roots: ["src"],
        splitCss: true,
    })
    ```

### Patch Changes

- Updated dependencies [7256944]
    - @mochi-css/plugins@3.1.0
    - @mochi-css/config@3.1.0
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
