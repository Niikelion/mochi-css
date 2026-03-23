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
function defineConfig(config: MochiConfig): MochiConfig
```

---

### `loadConfig`

Finds and loads the nearest `mochi.config.*` file. Returns `{}` if no file is found.

```typescript
async function loadConfig(cwd?: string): Promise<MochiConfig>
```

Searched file names (in order): `mochi.config.mts`, `mochi.config.cts`, `mochi.config.ts`, `mochi.config.mjs`, `mochi.config.cjs`, `mochi.config.js`.

---

### `resolveConfig`

Merges a file config, inline plugin options, and defaults into a fully resolved config.
Runs all `MochiPlugin.onConfigResolved` hooks in order.

```typescript
async function resolveConfig(
    fileConfig: MochiConfig,
    inlineOpts?: MochiConfig,
    defaults?: Partial<ResolvedConfig>,
): Promise<ResolvedConfig>
```

**Merge behaviour:**
- Arrays (`roots`, `extractors`, `esbuildPlugins`): file config + inline options concatenated, falling back to defaults
- Scalar values (`splitCss`, `tmpDir`): inline options take precedence over file config, then defaults
- Callbacks (`onDiagnostic`): both callbacks are called when both are provided

---

## Types

### `MochiConfig`

The user-facing config. All fields are optional.

| Field            | Type               | Description                                               |
|------------------|--------------------|-----------------------------------------------------------|
| `roots`          | `RootEntry[]`      | Directories scanned for source files (default: `["src"]`) |
| `extractors`     | `StyleExtractor[]` | Style extractors - merged with defaults from integrations |
| `splitCss`  | `boolean`          | Emit per-source-file CSS instead of one global file       |
| `onDiagnostic`   | `OnDiagnostic`     | Callback for warnings and non-fatal errors                |
| `esbuildPlugins` | `EsbuildPlugin[]`  | esbuild plugins forwarded to the bundler                  |
| `plugins`        | `MochiPlugin[]`    | Mochi plugins - run after config is resolved              |
| `tmpDir`         | `string`           | Manifest/styles output directory                          |

### `ResolvedConfig`

Same as `MochiConfig` but with required fields and no `plugins` key. Produced by `resolveConfig`.

### `MochiPlugin`

Hook interface for extending the resolved config.

```typescript
interface MochiPlugin {
    name: string
    onConfigResolved?: (config: ResolvedConfig) => Promise<ResolvedConfig> | ResolvedConfig
}
```

---

## Writing a Plugin

```typescript
import type { MochiPlugin } from "@mochi-css/config"
import { myExtractor } from "./myExtractor"

export const myPlugin: MochiPlugin = {
    name: "my-plugin",
    onConfigResolved(config) {
        return {
            ...config,
            extractors: [...config.extractors, myExtractor],
        }
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
