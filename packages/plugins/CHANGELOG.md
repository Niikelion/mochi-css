# @mochi-css/plugins

## 3.1.0

### Minor Changes

- 7256944: ## New package: `@mochi-css/plugins`

  Introduces `@mochi-css/plugins` as the home for `createExtractorsPlugin` and the plugin utilities layer.

  ### `createExtractorsPlugin(extractors)`

  Packages a list of `StyleExtractor` instances as a `MochiPlugin`. When loaded via `plugin.onLoad(ctx)`, it registers the analysis stages, source transform (sets up per-build generators), and emit hook (calls `generateStyles()`, emits CSS via `context.emitChunk()`, applies AST arg replacements).

  ```typescript
  import { createExtractorsPlugin } from "@mochi-css/plugins";
  import { defaultExtractors } from "@mochi-css/builder";

  const plugin = createExtractorsPlugin(defaultExtractors);
  ```

  ### `PluginContextCollector`

  A lightweight `PluginContext` implementation that collects hooks into arrays — useful for unit-testing plugins or building minimal integrations without the full `FullContext` from `@mochi-css/config`.

  ```typescript
  import { PluginContextCollector } from "@mochi-css/plugins";

  const collector = new PluginContextCollector(onDiagnostic);
  plugin.onLoad(collector);
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
        ctx.emitChunk("output.txt", "generated");
      });
    },
  };
  ```

  ### `PluginContext` interface and `FullContext` class

  `PluginContext` is the context object passed to `onLoad`. `FullContext` is the concrete implementation used by integrations (Vite, PostCSS, Next.js). Its fields — `stages`, `sourceTransforms`, `emitHooks`, `cleanup`, `filePreProcess` — map directly to `BuilderOptions`.

  ```typescript
  import { FullContext } from "@mochi-css/config";

  const ctx = new FullContext(onDiagnostic);
  for (const plugin of plugins) plugin.onLoad?.(ctx);

  new Builder({
    stages: [...ctx.stages.getAll()],
    sourceTransforms: [...ctx.sourceTransforms.getAll()],
    emitHooks: [...ctx.emitHooks.getAll()],
    cleanup: () => ctx.cleanup.runAll(),
    // ...
  });
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
  import { defineConfig } from "@mochi-css/vanilla-react/config";

  export default defineConfig({
    roots: ["src"],
    splitCss: true,
  });
  ```

### Patch Changes

- Updated dependencies [ee02bb1]
- Updated dependencies [7256944]
  - @mochi-css/builder@4.0.0
  - @mochi-css/config@3.1.0
