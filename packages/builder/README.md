# 🧁 Mochi-CSS/builder

This package is part of the [Mochi-CSS project](https://github.com/Niikelion/mochi-css).
It provides the core infrastructure for statically extracting Mochi-CSS styles from TypeScript/TSX source files and generating plain CSS at build time.

> **Note:** This package is primarily consumed by integrations such as `@mochi-css/postcss`. You only need it directly when building custom integrations or tooling.

---

## Installation

```bash
npm i @mochi-css/builder --save-dev
```

---

## Quick Start

```typescript
import { Builder, RolldownBundler, VmRunner, defaultExtractors } from "@mochi-css/builder"
import { writeFile } from "fs/promises"

const builder = new Builder({
    roots: ["./src"],
    extractors: defaultExtractors,
    bundler: new RolldownBundler(),
    runner: new VmRunner(),
})

const { global, files } = await builder.collectMochiCss()

if (global) {
    await writeFile("dist/global.css", global)
}
if (files) {
    for (const [source, css] of Object.entries(files)) {
        const outPath = source.replace(/\.(ts|tsx)$/, ".css")
        await writeFile(outPath, css)
    }
}
```

---

## How It Works

The builder performs multiphase processing:

1. **Preprocessing** - Runs the optional `filePreProcess` callback on every source file before parsing.
2. **Analysis** - Scans the source files, builds a dependency graph, and identifies all style function calls and the variables they depend on.
3. **Extraction** - Generates minimal executable code containing only the relevant style expressions, bundles it, executes it in an isolated VM context, and captures the style arguments passed to each extractor.
4. **Generation** - Generates CSS code using extracted arguments and registered generators.

---

## API

### `Builder`

The main orchestration class.

```typescript
class Builder {
    constructor(options: BuilderOptions)

    // Discover all files and return populated generators, ready to produce CSS
    collectMochiStyles(onDep?: (path: string) => void): Promise<Map<string, StyleGenerator>>

    // Analyze a pre-parsed set of modules and return populated generators
    collectStylesFromModules(modules: Module[]): Promise<Map<string, StyleGenerator>>

    // High-level: collect styles and immediately generate CSS
    collectMochiCss(options?: CollectCssOptions): Promise<{
        global?: string
        files?: Record<string, string>
    }>
}
```

#### `BuilderOptions`

| Option           | Type       | Description                                                                                                                                           |
| ---------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bundler`        | `Bundler`  | Bundler implementation - defaults to `RolldownBundler`                                                                                                |
| `runner`         | `Runner`   | Code runner implementation - defaults to `VmRunner`                                                                                                   |
| `filePreProcess` | `function` | Optional callback invoked on every source file before parsing. Receives `{ content, filePath }` and returns the (possibly transformed) source string. |

For all other options, see [`MochiConfig`](../config/README.md) - they can be set in `mochi.config.ts` and are picked up automatically by integrations.

#### CSS output

When `splitCss` is `false` (default), all generated CSS is merged into a single `global` string.

When `splitCss` is `true`, the `files` map contains per-source-file CSS keyed by the source file path, and any truly global styles (from `globalCss`) are in `global`.

---

### `defaultExtractors`

A pre-configured array of extractors for the `@mochi-css/vanilla` package. Handles:

- `css()` - component-scoped styles
- `styled()` - styled component styles
- `keyframes()` - CSS animations (scoped per file)
- `globalCss()` - global styles

Pass this directly to `BuilderOptions.extractors` unless you need a custom setup.

---

### `StyleExtractor` interface

Implement this to support a new style function.

```typescript
interface StyleExtractor {
    readonly importPath: string // e.g. "@mochi-css/vanilla"
    readonly symbolName: string // e.g. "css"
    readonly derivedExtractors?: ReadonlyMap<string, StyleExtractor>

    // Extract static arguments from a call expression AST node
    extractStaticArgs(call: CallExpression): Expression[]

    // Create a fresh generator for each extraction run
    startGeneration(onDiagnostic?: OnDiagnostic): StyleGenerator
}
```

`derivedExtractors` enables compound patterns where the return value of one function is destructured and individual properties are themselves extractors (e.g. `const { css } = createStitches()`).

---

### `StyleGenerator` interface

Implement this alongside a `StyleExtractor` to produce CSS from collected arguments.

```typescript
interface StyleGenerator {
    // Called once per style call site with the source file path and runtime argument values
    collectArgs(source: string, args: unknown[]): Record<string, StyleGenerator> | void

    // Produce CSS after all call sites have been collected
    generateStyles(): Promise<{
        global?: string
        files?: Record<string, string>
    }>
}
```

Returning a `Record<string, StyleGenerator>` from `collectArgs` enables derived extractor patterns - each key corresponds to a property name in the destructuring of the call's return value.

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

### `styledIdPlugin`

A `MochiPlugin` that injects a stable, unique `s-` prefixed class ID as the last argument of every `styled()` call before parsing.
This enables more precise component targeting.

It works via the source transform pipeline: when loaded, it registers a transform on `context.sourceTransform` that rewrites matching `.ts`, `.tsx`, `.js`, and `.jsx` files.

```typescript
import { styledIdPlugin } from "@mochi-css/config"
```

Add it to your `mochi.config.ts`:

```typescript
import { defineConfig, styledIdPlugin } from "@mochi-css/config"

export default defineConfig({
    plugins: [styledIdPlugin()],
})
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

## Writing a Custom Extractor

```typescript
import type { StyleExtractor, StyleGenerator, OnDiagnostic } from "@mochi-css/builder"
import type { CallExpression, Expression } from "@swc/types"

class MyGenerator implements StyleGenerator {
    private collected: unknown[] = []

    collectArgs(_source: string, args: unknown[]): void {
        this.collected.push(...args)
    }

    async generateStyles() {
        const css = this.collected.map((arg) => `/* ${JSON.stringify(arg)} */`).join("\n")
        return { global: css }
    }
}

const myExtractor: StyleExtractor = {
    importPath: "my-css-lib",
    symbolName: "myStyle",

    extractStaticArgs(call: CallExpression): Expression[] {
        return call.arguments.map((a) => a.expression)
    },

    startGeneration(_onDiagnostic?: OnDiagnostic): StyleGenerator {
        return new MyGenerator()
    },
}

// Use alongside default extractors
const builder = new Builder({
    roots: ["./src"],
    extractors: [...defaultExtractors, myExtractor],
    bundler: new RolldownBundler(),
    runner: new VmRunner(),
})
```
