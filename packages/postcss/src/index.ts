import {PluginCreator, Result, TransformCallback} from "postcss";
import * as fs from "fs";
import * as systemPath from "path";
import {
    Builder,
    BuilderOptions,
    RolldownBundler,
    VmRunner,
    fileHash,
    path,
} from "@mochi-css/builder"
import { loadConfig, resolveConfig, mergeCallbacks, FullContext, type Config } from "@mochi-css/config"

async function writeIfChanged(filePath: string, content: string): Promise<void> {
    try {
        const existing = await fs.promises.readFile(filePath, "utf-8")
        if (existing === content) return
    } catch {
        // file doesn't exist yet — fall through to write
    }
    await fs.promises.writeFile(filePath, content, "utf-8")
}

function isValidCssFilePath(file: string) {
    const [filePath] = file.split('?')
    return path.extname(filePath ?? "") === '.css'
}

type DiskManifest = {
    global?: string
    files: Record<string, string>
    sourcemods?: Record<string, string>
}

/**
 * Options for the Mochi CSS PostCSS plugin.
 *
 * Most options are loaded automatically from `mochi.config.ts` — see `@mochi-css/config` for the full list.
 * Only the fields below are specific to the PostCSS integration.
 *
 * @see {@link https://github.com/Niikelion/mochi-css/tree/master/packages/config MochiConfig}
 */
type Options = Partial<Pick<BuilderOptions, "runner" | "bundler">> & Partial<Config> & {
    /** Pattern matching the global CSS file that Mochi styles are injected into. Default: `/\/globals\.css$/` */
    globalCss?: RegExp
}

const pluginName = "postcss-mochi-css"

const defaultGlobalCssRegex = /\/globals\.css$/
const defaultBundler = new RolldownBundler()
const defaultRunner = new VmRunner()
let _warnedAboutWatcher = false

/**
 * PostCSS plugin that extracts Mochi CSS styles from TypeScript/TSX source files at build time
 * and injects the generated CSS into your global stylesheet.
 *
 * Shared config is loaded automatically from `mochi.config.ts`. Pass plugin-specific options
 * (`globalCss`, `tmpDir`) directly in your PostCSS config.
 *
 * @example
 * ```js
 * // postcss.config.js
 * module.exports = {
 *     plugins: { '@mochi-css/postcss': { tmpDir: '.mochi' } }
 * }
 * ```
 */
const creator: PluginCreator<Options> = (opts?: Options) => {
    let resolvedPromise: Promise<Config> | undefined

    const getResolved = () => {
        resolvedPromise ??= loadConfig().then(fileConfig =>
            resolveConfig(fileConfig, opts).then(resolved => ({
                ...resolved,
                tmpDir: resolved.tmpDir ?? opts?.tmpDir,
            }))
        )
        return resolvedPromise
    }

    let builder: Builder | undefined
    let currentResult: Result | undefined
    let builderGuard: Promise<void> | undefined

    const globalCssRegex = opts?.globalCss ?? defaultGlobalCssRegex

    const postcssProcess: TransformCallback = async (root, result) => {
        currentResult = result

        if ((process as unknown as Record<string, unknown>)["__mochiWatcherActive"] === true) {
            if (!_warnedAboutWatcher) {
                _warnedAboutWatcher = true
                console.warn(
                    "[mochi-css] @mochi-css/postcss is not needed when withMochi() is in use — " +
                    "remove @mochi-css/postcss from your postcss.config",
                )
            }
            return
        }

        const filePath = result.opts.from

        if (!filePath || !isValidCssFilePath(filePath)) return

        const normalizedPath = path.fromSystemPath(filePath)

        // Reset lastIndex to handle regexes with /g flag correctly
        globalCssRegex.lastIndex = 0
        if (!globalCssRegex.test(normalizedPath)) return

        const resolved = await getResolved()

        if (!builder) {
            const onDiagnostic = mergeCallbacks(resolved.onDiagnostic, (diagnostic) => {
                currentResult?.warn(`[${diagnostic.code}] ${diagnostic.message}${diagnostic.file ? ` (${diagnostic.file})` : ''}`, {
                    plugin: pluginName,
                })
            })
            const context = new FullContext(onDiagnostic ?? (() => {}))
            for (const plugin of resolved.plugins) {
                plugin.onLoad?.(context)
            }
            builder = new Builder({
                onDiagnostic,
                roots: resolved.roots,
                stages: [...context.stages.getAll()],
                bundler: opts?.bundler ?? defaultBundler,
                runner: opts?.runner ?? defaultRunner,
                splitCss: resolved.splitCss,
                debug: resolved.debug,
                filePreProcess: ({ content, filePath }) => context.filePreProcess.transform(content, { filePath }),
                sourceTransforms: [...context.sourceTransforms.getAll()],
                emitHooks: [...context.emitHooks.getAll()],
                cleanup: () => { context.cleanup.runAll() },
                initializeStages: context.initializeStages.merged(),
                prepareAnalysis: context.prepareAnalysis.merged(),
                getFileData: context.getFileData.merged(),
                invalidateFiles: context.invalidateFiles.merged(),
                resetCrossFileState: context.resetCrossFileState.merged(),
                getFilesToBundle: context.getFilesToBundle.merged(),
                tsConfigPath: resolved.tsConfigPath
            })
        }

        // Watch all root directories so new files trigger a rebuild
        for (const rootEntry of resolved.roots) {
            result.messages.push({
                type: "dir-dependency",
                dir: systemPath.resolve(typeof rootEntry === "string" ? rootEntry : rootEntry.path),
                glob: "**/*.{ts,tsx}",
                plugin: pluginName,
                parent: result.opts.from
            })
        }

        const css = await builder.collectMochiCss({
            onDep: depPath => {
                result.messages.push({
                    type: "dependency",
                    file: path.toSystemPath(depPath),
                    plugin: pluginName,
                    parent: result.opts.from
                })
            }
        })

        if (css.global) {
            root.append(css.global)
        }

        root.walk(node => {
            if (node.source) return
            node.source = root.source
        })

        // Write per-file CSS and manifest to tmpDir
        if (resolved.tmpDir) {
            const tmpDir = resolved.tmpDir
            await fs.promises.mkdir(tmpDir, { recursive: true })

            const existingCssFiles = new Set(
                (await fs.promises.readdir(tmpDir))
                    .filter(f => f.endsWith(".css") && f !== "global.css")
                    .map(f => systemPath.resolve(tmpDir, f))
            )

            const diskManifest: DiskManifest = { files: {}, sourcemods: css.sourcemods }
            const writtenCssPaths = new Set<string>()

            if (css.global) {
                const globalPath = systemPath.resolve(tmpDir, "global.css")
                await writeIfChanged(globalPath, css.global)
                diskManifest.global = globalPath
            }

            for (const [source, fileCss] of Object.entries(css.files ?? {})) {
                const hash = fileHash(source)
                const cssPath = systemPath.resolve(tmpDir, `${hash}.css`)
                await writeIfChanged(cssPath, fileCss)
                diskManifest.files[source] = cssPath
                writtenCssPaths.add(cssPath)
            }

            for (const existingPath of existingCssFiles) {
                if (!writtenCssPaths.has(existingPath)) {
                    await fs.promises.unlink(existingPath)
                }
            }

            const manifestPath = systemPath.resolve(tmpDir, "manifest.json")
            await writeIfChanged(manifestPath, JSON.stringify(diskManifest))
        }
    }

    return {
        postcssPlugin: pluginName,
        plugins: [
            (...args) => {
                builderGuard = Promise.resolve(builderGuard)
                    .catch(err => {
                        console.error(`[${pluginName}]`, err instanceof Error ? err.message : err)
                    })
                    .then(() => postcssProcess(...args))
                return builderGuard
            }
        ]
    }
}
creator.postcss = true

export default creator
