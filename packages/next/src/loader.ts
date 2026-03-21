import fs from "fs"
import path from "path"
import { loadConfig, FullContext } from "@mochi-css/config"

type DiskManifest = {
    global?: string
    files: Record<string, string>
}

type LoaderContext = {
    resourcePath: string
    getOptions(): { manifestPath: string; cwd?: string }
    addDependency(path: string): void
    async(): (err: Error | null, content?: string, sourceMap?: unknown) => void
}

function injectImports(
    ctx: LoaderContext,
    manifest: DiskManifest,
    source: string,
): string {
    const cssPath = manifest.files[ctx.resourcePath]
    if (!cssPath) return source

    const imports: string[] = []
    const sourceDir = path.dirname(ctx.resourcePath)

    function toImportPath(absPath: string): string {
        let rel = path.relative(sourceDir, absPath).replaceAll("\\", "/")
        if (!rel.startsWith(".")) rel = "./" + rel
        return rel
    }

    // Import per-file CSS
    const absoluteCssPath = path.resolve(cssPath)
    imports.push(`import ${JSON.stringify(toImportPath(absoluteCssPath))};`)
    ctx.addDependency(absoluteCssPath)

    // Import global CSS (keyframes etc.)
    if (manifest.global) {
        const absoluteGlobalPath = path.resolve(manifest.global)
        imports.push(`import ${JSON.stringify(toImportPath(absoluteGlobalPath))};`)
        ctx.addDependency(absoluteGlobalPath)
    }

    return imports.join("\n") + "\n" + source
}

/**
 * Singleton promise for the plugin context. Initialized once per process from `mochi.config.ts`
 * so that `loadConfig` is not called on every file compilation.
 */
let contextPromise: Promise<FullContext> | undefined

/**
 * Loads `mochi.config.ts` from `cwd` and runs each plugin's `onLoad` hook to register
 * source transforms (e.g. `styledIdPlugin` registers `transformStyledIds`).
 */
async function initContext(cwd: string): Promise<FullContext> {
    const fileConfig = await loadConfig(cwd)
    const context = new FullContext()
    for (const plugin of fileConfig.plugins ?? []) {
        plugin.onLoad?.(context)
    }
    return context
}

/** Resets the cached context — for testing only. */
export function resetContext(): void {
    contextPromise = undefined
}

/**
 * Webpack/Turbopack loader that:
 * 1. Applies source transforms registered by `mochi.config.ts` plugins (e.g. stable `s-xxx` ID injection).
 * 2. Injects CSS `import` statements for per-file styles produced by the PostCSS plugin.
 */
export default function mochiLoader(this: LoaderContext, source: string): void {
    const { manifestPath, cwd = process.cwd() } = this.getOptions()
    const callback = this.async()

    contextPromise ??= initContext(cwd)

    const resourcePath = this.resourcePath

    contextPromise
        .then(async (context) => {
            const transformed = await context.sourceTransform.transform(source, { filePath: resourcePath })

            this.addDependency(manifestPath)

            if (!fs.existsSync(manifestPath)) {
                callback(null, transformed)
                return
            }

            const content = fs.readFileSync(manifestPath, "utf-8")
            const manifest = JSON.parse(content) as DiskManifest
            callback(null, injectImports(this, manifest, transformed))
        })
        .catch((err: unknown) => {
            callback(err instanceof Error ? err : new Error(String(err)))
        })
}
