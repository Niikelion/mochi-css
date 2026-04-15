# 🧁 Mochi-CSS/builder

This package is part of the [Mochi-CSS project](https://github.com/Niikelion/mochi-css).
It provides the core infrastructure for statically extracting Mochi-CSS styles from TypeScript/TSX source files and generating plain CSS at build time.

> **Note:** This package is primarily consumed by integrations such as `@mochi-css/postcss`. You only need it directly when building a custom integration or tooling on top of Mochi-CSS.

---

## Installation

```bash
npm i @mochi-css/builder --save-dev
```

---

## Quick Start

The builder is configured through plugins. The typical setup loads a plugin into a `FullContext`, then passes the collected stages and hooks to `Builder`:

```typescript
import { Builder, RolldownBundler, VmRunner } from "@mochi-css/builder"
import { FullContext } from "@mochi-css/config"
import { writeFile } from "fs/promises"

// Load plugins into a context (see @mochi-css/plugins and @mochi-css/vanilla/config)
const ctx = new FullContext(() => {})
myPlugin.onLoad(ctx)

const builder = new Builder({
    roots: ["./src"],
    stages: [...ctx.stages.getAll()],
    bundler: new RolldownBundler(),
    runner: new VmRunner(),
    sourceTransforms: [...ctx.sourceTransforms.getAll()],
    emitHooks: [...ctx.emitHooks.getAll()],
    emitDir: "./dist/mochi",
    cleanup: () => ctx.cleanup.runAll(),
})

const { global, files } = await builder.collectMochiCss()

if (global) await writeFile("dist/global.css", global)
if (files) {
    for (const [source, css] of Object.entries(files)) {
        await writeFile(source.replace(/\.(ts|tsx)$/, ".css"), css)
    }
}
```

---

## How It Works

The builder performs multiphase processing:

1. **Preprocessing** — Runs the optional `filePreProcess` callback on every source file before parsing.
2. **Analysis** — Scans source files, builds a dependency graph, and identifies all style function calls and the variables they depend on.
3. **sourceTransforms** — Hooks that run after analysis on the canonical AST index. Mutations persist and are visible to `postEvalTransforms`.
4. **preEvalTransforms** — Hooks that run on a deep copy of the ASTs, used only for bundling and evaluation. Mutations do NOT persist.
5. **Extraction** — Generates minimal executable code from relevant style expressions, bundles it, and executes it in an isolated VM context.
6. **postEvalTransforms** — Hooks that run after execution. The evaluator is populated — use `context.evaluator.getTrackedValue()` to read runtime values.
7. **emitHooks** — Hooks that run after `postEvalTransforms`. Call `context.emitChunk(path, content)` to produce output files written to `emitDir`.

---

## API

### `Builder`

The main orchestration class.

```typescript
class Builder {
    constructor(options: BuilderOptions)

    // Analyze a pre-parsed set of modules; returns chunks keyed by path
    collectStylesFromModules(modules: Module[]): Promise<Map<string, Set<string>>>

    // High-level: discover files, extract styles, and generate CSS
    collectMochiCss(options?: CollectCssOptions): Promise<{
        global?: string
        files?: Record<string, string>
        sourcemods?: Record<string, string>
    }>
}
```

#### `BuilderOptions`

| Option               | Type                 | Description                                                                                                                                           |
| -------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `roots`              | `RootEntry[]`        | Directories (or named root entries) scanned recursively for source files.                                                                             |
| `stages`             | `StageDefinition[]`  | Analysis pipeline stages. Populated by calling `plugin.onLoad(ctx)` and passing `ctx.stages.getAll()`.                                                |
| `bundler`            | `Bundler`            | Bundler implementation. Use `RolldownBundler`.                                                                                                        |
| `runner`             | `Runner`             | Code runner implementation. Use `VmRunner`.                                                                                                           |
| `splitCss`           | `boolean`            | When `true`, CSS is split per source file instead of merged. Default: `false`.                                                                        |
| `onDiagnostic`       | `function`           | Callback for structured warnings and non-fatal errors.                                                                                                |
| `filePreProcess`     | `function`           | Optional callback invoked on every source file before parsing. Receives `{ content, filePath }` and returns the (possibly transformed) source string. |
| `sourceTransforms`   | `AstPostProcessor[]` | Hooks that run after analysis. May mutate AST nodes. Mutations persist in the canonical index.                                                        |
| `preEvalTransforms`  | `AstPostProcessor[]` | Hooks that run on a deep copy of the ASTs before evaluation. Mutations do NOT persist in the canonical index.                                         |
| `postEvalTransforms` | `AstPostProcessor[]` | Hooks that run after execution. The evaluator is populated — use `context.evaluator.getTrackedValue()` to read runtime values.                        |
| `emitHooks`          | `EmitHook[]`         | Hooks that run after postEvalTransforms. Call `context.emitChunk(path, content)` to emit files.                                                       |
| `emitDir`            | `string`             | Base directory for files produced via `context.emitChunk()`.                                                                                          |
| `cleanup`            | `function`           | Called once at the end of the pipeline. Use to release caches built during transforms.                                                                |

#### CSS output

When `splitCss` is `false` (default), all generated CSS is merged into a single `global` string.

When `splitCss` is `true`, the `files` map contains per-source-file CSS keyed by the source file path, and any truly global styles (from `globalCss`) are in `global`.

---

### `AnalysisContext`

Passed to `sourceTransforms`, `preEvalTransforms`, `postEvalTransforms`, and `emitHooks`.

```typescript
type AnalysisContext = {
    onDiagnostic?: OnDiagnostic
    evaluator: Evaluator
    // Emit a chunk of content to a file in emitDir. Multiple chunks for the same path are
    // deduplicated by content and joined with "\n\n".
    emitChunk(path: string, content: string): void
    // Mark an AST expression for inclusion in the eval bundle for a given file.
    // The expression's identifier dependencies are traced and its value is captured at runtime.
    // Wrap with evaluator.valueWithTracking() first to read back the runtime value later.
    markForEval(filePath: string, expression: SWC.Expression): void
}
```

---

### `EmitHook`

A hook that runs after code execution. Call `context.emitChunk()` to emit files into `emitDir`. Files emitted on a previous run that are absent on the next run are automatically deleted.

```typescript
type EmitHook = (runner: StageRunner, context: AnalysisContext) => void | Promise<void>
```

---

### `RolldownBundler` / `Bundler`

`RolldownBundler` uses [Rolldown](https://rolldown.rs) to bundle the extracted minimal source code into a CommonJS module that can be executed.

```typescript
interface Bundler {
    bundle(rootFilePath: string, files: FileLookup): Promise<string>
}
```

You can provide an alternative `Bundler` implementation if your environment requires a different bundler.

---

### `VmRunner` / `Runner`

`VmRunner` executes bundled code in an isolated Node.js `vm.Context`, injecting extractors as context variables.

```typescript
interface Runner {
    execute(source: string, context: Record<string, unknown>): Promise<void>
}
```

You can provide an alternative `Runner` implementation if your environment requires a different js runner.

---

### Utilities

#### `parseSource` / `parseFile`

Parse TypeScript/TSX source code into a `Module` AST.

```typescript
async function parseSource(source: string, filePath: string): Promise<Module>
async function parseFile(filePath: string): Promise<Module>
```

Useful when you want to supply pre-parsed modules to `collectStylesFromModules`.

#### `findAllFiles`

Recursively discover all `.ts` and `.tsx` files in a directory.

```typescript
async function findAllFiles(dir: string): Promise<string[]>
```

---

## Diagnostics & Errors

Provide an `onDiagnostic` callback to receive structured warnings and non-fatal errors.

```typescript
const builder = new Builder({
    // ...
    onDiagnostic: (diagnostic) => {
        console.warn(`[${diagnostic.code}] ${diagnostic.message}`)
        if (diagnostic.file) console.warn(`  at ${diagnostic.file}:${diagnostic.line}`)
    },
})
```

Fatal errors are thrown as `MochiError` instances:

```typescript
class MochiError extends Error {
    readonly code: string // e.g. "MOCHI_BUNDLE"
    readonly file?: string
}
```

| Error Code                      | Cause                                           |
| ------------------------------- | ----------------------------------------------- |
| `MOCHI_FILE_READ`               | Cannot read a source file                       |
| `MOCHI_PARSE`                   | TypeScript parsing failed                       |
| `MOCHI_BUNDLE`                  | Bundling the extracted code failed              |
| `MOCHI_EXEC`                    | Execution of bundled code failed                |
| `MOCHI_UNRESOLVED_IMPORT`       | A local import cannot be resolved               |
| `MOCHI_INVALID_STYLE_ARG`       | A `css()`/`styled()` argument is not an object  |
| `MOCHI_INVALID_GLOBAL_CSS_ARG`  | A `globalCss()` argument is not an object       |
| `MOCHI_INVALID_KEYFRAMES_ARG`   | A `keyframes()` argument is not an object       |
| `MOCHI_STYLE_GENERATION`        | CSS generation threw an error                   |
| `MOCHI_INVALID_EXTRACTOR_USAGE` | Derived extractor was not properly destructured |

---

## Writing Plugins and Custom Extractors

Plugin authoring — `StyleExtractor`, `StyleGenerator`, `createExtractorsPlugin`, stage definitions, and utilities like `propagateUsagesFromExpr` — is covered in the [`@mochi-css/plugins` README](../plugins/README.md).
