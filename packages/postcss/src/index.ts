import {PluginCreator, Result, TransformCallback} from "postcss";
import * as fs from "fs";
import * as path from "path";
import {
    Builder,
    defaultExtractors,
    BuilderOptions,
    RolldownBundler,
    VmRunner,
    fileHash,
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

const defaultOptions = {
    globalCss: /\/globals\.css$/,
    extractors: defaultExtractors,
    bundler: new RolldownBundler(),
    runner: new VmRunner(),
}

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
            resolveConfig(fileConfig, opts, defaultOptions).then(resolved => ({
                ...resolved,
                tmpDir: resolved.tmpDir ?? opts?.tmpDir,
            }))
        )
        return resolvedPromise
    }

    let builder: Builder | undefined
    let currentResult: Result | undefined
    let builderGuard: Promise<void> | undefined

    const globalCssRegex = opts?.globalCss ?? defaultOptions.globalCss

    const postcssProcess: TransformCallback = async (root, result) => {
        currentResult = result

        const filePath = result.opts.from

        if (!filePath || !isValidCssFilePath(filePath)) return

        const normalizedPath = filePath.replaceAll(path.win32.sep, path.posix.sep)

        // Reset lastIndex to handle regexes with /g flag correctly
        globalCssRegex.lastIndex = 0
        if (!globalCssRegex.test(normalizedPath)) return

        const resolved = await getResolved()

        if (!builder) {
            const context = new FullContext()
            for (const plugin of resolved.plugins) {
                plugin.onLoad?.(context)
            }
            builder = new Builder({
                onDiagnostic: mergeCallbacks(resolved.onDiagnostic, (diagnostic) => {
                    currentResult?.warn(`[${diagnostic.code}] ${diagnostic.message}${diagnostic.file ? ` (${diagnostic.file})` : ''}`, {
                        plugin: pluginName,
                    })
                }),
                roots: resolved.roots,
                extractors: resolved.extractors,
                bundler: opts?.bundler ?? defaultOptions.bundler,
                runner: opts?.runner ?? defaultOptions.runner,
                splitCss: resolved.splitCss,
                filePreProcess: ({ content, filePath }) => context.sourceTransform.transform(content, { filePath }),
                sourceTransforms: context.getAnalysisHooks(),
            })
        }

        // Watch all root directories so new files trigger a rebuild
        for (const rootEntry of resolved.roots) {
            result.messages.push({
                type: "dir-dependency",
                dir: path.resolve(typeof rootEntry === "string" ? rootEntry : rootEntry.path),
                glob: "**/*.{ts,tsx}",
                plugin: pluginName,
                parent: result.opts.from
            })
        }

        const css = await builder.collectMochiCss({
            onDep: depPath => {
                result.messages.push({
                    type: "dependency",
                    file: depPath,
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
                    .map(f => path.resolve(tmpDir, f))
            )

            const diskManifest: DiskManifest = { files: {}, sourcemods: css.sourcemods }
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
                diskManifest.files[source] = cssPath
                writtenCssPaths.add(cssPath)
            }

            for (const existingPath of existingCssFiles) {
                if (!writtenCssPaths.has(existingPath)) {
                    await fs.promises.unlink(existingPath)
                }
            }

            const manifestPath = path.resolve(tmpDir, "manifest.json")
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
