# 🧁 Mochi-CSS/config

This package is part of the [Mochi-CSS project](https://github.com/Niikelion/mochi-css).
It provides the shared configuration layer - types, config file loading, and config resolution - used by all Mochi-CSS integrations (Vite, PostCSS, Next.js).

---

## Installation

```bash
npm i @mochi-css/config --save-dev
```

---

## `mochi.config.ts`

Place a `mochi.config.mts` (or `.cts`, `.ts`, `.mjs`, `.cjs`, `.js`) file in your project root to configure all Mochi-CSS integrations in one place.

```typescript
// mochi.config.mts
import { defineConfig } from "@mochi-css/config"

export default defineConfig({
    roots: ["src"],
    splitCss: true,
})
```

All Mochi-CSS integrations automatically load this file - you don't need to pass the same options to each plugin separately.

---

## API

### `defineConfig`

Identity helper that provides full type inference for your config file.

```typescript
function defineConfig(config: Partial<Config>): Partial<Config>
```

---

### `loadConfig`

Finds and loads the nearest `mochi.config.*` file. Returns `{}` if no file is found.

```typescript
async function loadConfig(cwd?: string): Promise<Partial<Config>>
```

Searched file names (in order): `mochi.config.mts`, `mochi.config.cts`, `mochi.config.ts`, `mochi.config.mjs`, `mochi.config.cjs`, `mochi.config.js`.

---

### `resolveConfig`

Merges a file config, inline plugin options, and defaults into a fully resolved config.
Runs all `MochiPlugin.onConfigResolved` hooks in order.

```typescript
async function resolveConfig(
    fileConfig: Partial<Config>,
    inlineOpts?: Partial<Config>,
    defaults?: Partial<Config>,
): Promise<Config>
```

**Merge behaviour:**

- Arrays (`roots`, `plugins`): file config + inline options concatenated, falling back to defaults
- Scalar values (`splitCss`, `tmpDir`): inline options take precedence over file config, then defaults
- Callbacks (`onDiagnostic`): both callbacks are called when both are provided

---

## Types

### `Config`

The config shape. All fields are optional in `defineConfig`; `resolveConfig` fills required fields from defaults.

| Field          | Type            | Description                                                   |
| -------------- | --------------- | ------------------------------------------------------------- |
| `roots`        | `RootEntry[]`   | Directories scanned for source files (default: `["src"]`)     |
| `splitCss`     | `boolean`       | Emit per-source-file CSS instead of one global file           |
| `onDiagnostic` | `OnDiagnostic`  | Callback for warnings and non-fatal errors                    |
| `plugins`      | `MochiPlugin[]` | Mochi plugins — register stages, transforms, and emit hooks   |
| `tmpDir`       | `string`        | Manifest/styles output directory                              |
| `debug`        | `boolean`       | Enable debug output                                           |

### `MochiPlugin`

Hook interface for extending the build pipeline.

```typescript
interface MochiPlugin {
    name: string
    // Called during config resolution — mutate or replace the config object.
    onConfigResolved?(config: Config): Promise<Config> | Config
    // Called after config is resolved — register stages, transforms, and emit hooks.
    onLoad?(context: PluginContext): void
}
```

### `PluginContext`

Passed to `onLoad`. Each field is a collector that plugins call `register()` on.

| Field              | Purpose                                                           |
|--------------------|-------------------------------------------------------------------|
| `stages`           | Register analysis pipeline stages                                 |
| `sourceTransforms` | Register `AstPostProcessor` hooks (run after analysis)            |
| `emitHooks`        | Register `EmitHook` hooks (run after evaluation)                  |
| `cleanup`          | Register cleanup functions called at the end of each build        |
| `filePreProcess`   | Register source-level text transformations (used by Vite/Next)    |
| `onDiagnostic`     | Diagnostics callback from the resolved config                     |

---

## Writing a Plugin

```typescript
import type { MochiPlugin } from "@mochi-css/config"

export const myPlugin: MochiPlugin = {
    name: "my-plugin",
    onLoad(context) {
        // Register an emit hook that writes a file after every build
        context.emitHooks.register(async (_index, ctx) => {
            ctx.emitChunk("my-output.txt", "hello from my-plugin")
        })
    },
}
```

```typescript
// mochi.config.ts
import { defineConfig } from "@mochi-css/config"
import { myPlugin } from "./myPlugin"

export default defineConfig({
    plugins: [myPlugin],
})
```

---

## `styledIdPlugin`

A built-in plugin that injects stable `s-` class IDs into every `styled()` call matched by the given extractors. This keeps class names stable across incremental builds.

```typescript
import { styledIdPlugin } from "@mochi-css/config"
import { myExtractor } from "./myExtractor"

export default defineConfig({
    plugins: [styledIdPlugin([myExtractor])],
})
```

The plugin registers two hooks:
- A `filePreProcess` transformation that inserts stable IDs into the raw source (used by Vite/Next `transform` hooks).
- A `sourceTransforms` hook that injects the same IDs directly into the AST (used during CSS extraction).

It is idempotent — calls that already carry an `s-` ID are skipped.
