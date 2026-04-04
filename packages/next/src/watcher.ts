import fs from "fs"
import path from "path"
import { loadConfig, resolveConfig, FullContext } from "@mochi-css/config"
import { Builder, RolldownBundler, VmRunner, fileHash, type RootEntry } from "@mochi-css/builder"

type DiskManifest = {
    global?: string
    files: Record<string, string>
    sourcemods?: Record<string, string>
}

async function writeIfChanged(filePath: string, content: string): Promise<void> {
    try {
        const existing = await fs.promises.readFile(filePath, "utf-8")
        if (existing === content) return
    } catch {
        // file doesn't exist yet — fall through to write
    }
    await fs.promises.writeFile(filePath, content, "utf-8")
}

async function writeCssFiles(
    css: { global?: string; files?: Record<string, string>; sourcemods?: Record<string, string> },
    tmpDir: string,
): Promise<void> {
    await fs.promises.mkdir(tmpDir, { recursive: true })

    const existingCssFiles = new Set(
        (await fs.promises.readdir(tmpDir))
            .filter(f => f.endsWith(".css") && f !== "global.css")
            .map(f => path.resolve(tmpDir, f)),
    )

    const normalizedSourcemods: Record<string, string> = {}
    for (const [source, mod] of Object.entries(css.sourcemods ?? {})) {
        normalizedSourcemods[source.replaceAll("\\", "/")] = mod
    }
    const diskManifest: DiskManifest = {
        files: {},
        sourcemods: Object.keys(normalizedSourcemods).length > 0 ? normalizedSourcemods : undefined,
    }
    const writtenCssPaths = new Set<string>()

    if (css.global) {
        const globalPath = path.resolve(tmpDir, "global.css")
        await writeIfChanged(globalPath, css.global)
        diskManifest.global = globalPath
    }

    for (const [source, fileCss] of Object.entries(css.files ?? {})) {
        const hash = fileHash(source)
        const cssPath = path.resolve(tmpDir, `${hash}.css`)
        await writeIfChanged(cssPath, fileCss)
        diskManifest.files[source.replaceAll("\\", "/")] = cssPath
        writtenCssPaths.add(cssPath)
    }

    for (const existingPath of existingCssFiles) {
        if (!writtenCssPaths.has(existingPath)) {
            await fs.promises.unlink(existingPath)
        }
    }

    await writeIfChanged(path.resolve(tmpDir, "manifest.json"), JSON.stringify(diskManifest))
}

let watcherStarted = false

/**
 * Sets up a file watcher that rebuilds Mochi CSS whenever source files change.
 *
 * Intended for development HMR. Called from `withMochi` — runs once per process.
 */
export async function startCssWatcher(tmpDir: string): Promise<void> {
    if (watcherStarted) return
    watcherStarted = true
    ;(process as unknown as Record<string, unknown>)["__mochiWatcherActive"] = true

    // Capture CWD before any async operations — some frameworks may change it later
    const cwd = process.cwd()

    const fileConfig = await loadConfig()
    const resolved = await resolveConfig(fileConfig, undefined, {})

    const effectiveTmpDir = resolved.tmpDir
        ? path.resolve(cwd, resolved.tmpDir)
        : tmpDir

    const debug = resolved.debug ?? false

    // Resolve roots to absolute paths now so every later rebuild uses the right dir
    const absoluteRoots: RootEntry[] = resolved.roots.map(root =>
        typeof root === "string"
            ? path.resolve(cwd, root)
            : { ...root, path: path.resolve(cwd, root.path) },
    )

    if (debug) {
        console.log(
            `[mochi-css] watcher: roots=${JSON.stringify(absoluteRoots)}, tmpDir=${effectiveTmpDir}`,
        )
    }

    if (absoluteRoots.length === 0) {
        console.warn("[mochi-css] watcher: no roots configured — add `roots` to mochi.config.ts")
        return
    }

    const context = new FullContext(resolved.onDiagnostic ?? (() => {}))
    for (const plugin of resolved.plugins) {
        plugin.onLoad?.(context)
    }

    const builder = new Builder({
        roots: absoluteRoots,
        stages: [...context.stages.getAll()],
        bundler: new RolldownBundler(),
        runner: new VmRunner(),
        splitCss: resolved.splitCss,
        filePreProcess: ({ content, filePath }) =>
            context.filePreProcess.transform(content, { filePath }),
        sourceTransforms: [...context.sourceTransforms.getAll()],
        emitHooks: [...context.emitHooks.getAll()],
        cleanup: () => { context.cleanup.runAll() },
    })

    let rebuildTimer: ReturnType<typeof setTimeout> | undefined
    let rebuildGuard: Promise<void> = Promise.resolve()

    const scheduleRebuild = () => {
        clearTimeout(rebuildTimer)
        rebuildTimer = setTimeout(() => {
            rebuildGuard = rebuildGuard
                .catch(() => {})
                .then(async () => {
                    if (debug) console.log("[mochi-css] watcher: rebuilding CSS…")
                    const css = await builder.collectMochiCss()
                    await writeCssFiles(css, effectiveTmpDir)
                    if (debug) console.log("[mochi-css] watcher: CSS updated")
                })
        }, 50)
    }

    scheduleRebuild()

    const rootDirs = absoluteRoots.map(root => (typeof root === "string" ? root : root.path))

    for (const dir of rootDirs) {
        if (!fs.existsSync(dir)) {
            console.warn(`[mochi-css] watcher: root not found: ${dir}`)
            continue
        }
        if (debug) console.log(`[mochi-css] watcher: watching ${dir}`)
        fs.watch(dir, { recursive: true }, (_, filename) => {
            if (!filename || /\.(ts|tsx|js|jsx)$/.test(filename)) {
                scheduleRebuild()
            }
        })
    }
}

/**
 * Runs a single CSS build and writes the manifest to `tmpDir`.
 * Used by `withMochi()` as a webpack `beforeRun` hook in production
 * to ensure the manifest is populated before webpack processes any files.
 */
export async function buildCssOnce(tmpDir: string): Promise<void> {
    const cwd = process.cwd()

    const fileConfig = await loadConfig()
    const resolved = await resolveConfig(fileConfig, undefined, {})

    const effectiveTmpDir = resolved.tmpDir
        ? path.resolve(cwd, resolved.tmpDir)
        : tmpDir

    const absoluteRoots: RootEntry[] = resolved.roots.map(root =>
        typeof root === "string"
            ? path.resolve(cwd, root)
            : { ...root, path: path.resolve(cwd, root.path) },
    )

    if (absoluteRoots.length === 0) {
        console.warn("[mochi-css] buildCssOnce: no roots configured — add `roots` to mochi.config.ts")
        return
    }

    const context = new FullContext(resolved.onDiagnostic ?? (() => {}))
    for (const plugin of resolved.plugins) {
        plugin.onLoad?.(context)
    }

    const builder = new Builder({
        roots: absoluteRoots,
        stages: [...context.stages.getAll()],
        bundler: new RolldownBundler(),
        runner: new VmRunner(),
        splitCss: resolved.splitCss,
        filePreProcess: ({ content, filePath }) =>
            context.filePreProcess.transform(content, { filePath }),
        sourceTransforms: [...context.sourceTransforms.getAll()],
        emitHooks: [...context.emitHooks.getAll()],
        cleanup: () => { context.cleanup.runAll() },
    })

    const css = await builder.collectMochiCss()
    await writeCssFiles(css, effectiveTmpDir)
}
