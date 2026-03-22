import fs from "fs"
import path from "path"
import { applyPatch } from "diff"

type DiskManifest = {
    global?: string
    files: Record<string, string>
    sourcemods?: Record<string, string>
}

type ManifestCache = { path: string; mtime: number; manifest: DiskManifest }
let manifestCache: ManifestCache | undefined

function readManifest(manifestPath: string): DiskManifest | null {
    const stat = fs.statSync(manifestPath, { throwIfNoEntry: false })
    if (!stat) return null
    if (manifestCache?.path === manifestPath && manifestCache.mtime === stat.mtimeMs) {
        return manifestCache.manifest
    }
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8")) as DiskManifest
    manifestCache = { path: manifestPath, mtime: stat.mtimeMs, manifest }
    return manifest
}

type LoaderContext = {
    resourcePath: string
    getOptions(): { manifestPath: string }
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
 * Webpack/Turbopack loader that:
 * 1. Applies source transforms from the manifest (sourcemods produced by the PostCSS/builder pipeline).
 * 2. Injects CSS `import` statements for per-file styles produced by the PostCSS plugin.
 */
export default function mochiLoader(this: LoaderContext, source: string): void {
    const { manifestPath } = this.getOptions()
    const callback = this.async()
    const resourcePath = this.resourcePath

    this.addDependency(manifestPath)

    try {
        const manifest = readManifest(manifestPath)

        if (!manifest) {
            callback(null, source)
            return
        }

        const sourcemod = manifest.sourcemods?.[resourcePath]
        const transformed = sourcemod ? (applyPatch(source, sourcemod) || source) : source

        callback(null, injectImports(this, manifest, transformed as string))
    } catch (err: unknown) {
        callback(err instanceof Error ? err : new Error(String(err)))
    }
}
