import fs from "fs"
import path from "path"

type DiskManifest = {
    global?: string
    files: Record<string, string>
}

type LoaderContext = {
    resourcePath: string
    getOptions(): { manifestPath: string }
    addDependency(path: string): void
    callback(err: Error | null, content?: string, sourceMap?: unknown): void
}

function injectImports(
    ctx: LoaderContext,
    manifest: DiskManifest,
    source: string,
): string {
    const cssPath = manifest.files[ctx.resourcePath]
    if (!cssPath) return source

    const imports: string[] = []

    // Import per-file CSS
    const absoluteCssPath = path.resolve(cssPath)
    imports.push(`import ${JSON.stringify(absoluteCssPath)};`)
    ctx.addDependency(absoluteCssPath)

    // Import global CSS (keyframes etc.)
    if (manifest.global) {
        const absoluteGlobalPath = path.resolve(manifest.global)
        imports.push(`import ${JSON.stringify(absoluteGlobalPath)};`)
        ctx.addDependency(absoluteGlobalPath)
    }

    return imports.join("\n") + "\n" + source
}

export default function mochiLoader(this: LoaderContext, source: string): void {
    const { manifestPath } = this.getOptions()

    // Always re-read from disk so PostCSS updates are picked up
    this.addDependency(manifestPath)

    if (!fs.existsSync(manifestPath)) {
        this.callback(null, source)
        return
    }

    const content = fs.readFileSync(manifestPath, "utf-8")
    const manifest = JSON.parse(content) as DiskManifest
    this.callback(null, injectImports(this, manifest, source))
}
