import {PluginCreator, Result, TransformCallback} from "postcss";
import * as fs from "fs";
import * as path from "path";
import {
    Builder,
    defaultExtractors,
    BuilderOptions,
    RolldownBundler,
    VmRunner,
    OnDiagnostic,
    fileHash,
    MochiManifest
} from "@mochi-css/builder"
import { loadConfig, resolveConfig, type MochiConfig, type ResolvedConfig } from "@mochi-css/config"

function isValidCssFilePath(file: string) {
    const [filePath] = file.split('?')
    return path.extname(filePath ?? "") === '.css'
}

type DiskManifest = {
    global?: string
    files: Record<string, string>
}

type Options = Partial<BuilderOptions> & Pick<MochiConfig, "esbuildPlugins" | "plugins"> & {
    globalCss?: RegExp
    outDir?: string
}

const pluginName = "postcss-mochi-css"

const defaultOptions = {
    globalCss: /\/globals\.css$/,
    roots: ["src"] as BuilderOptions["roots"],
    extractors: defaultExtractors,
    bundler: new RolldownBundler(),
    runner: new VmRunner(),
    splitBySource: false,
}

const creator: PluginCreator<Options> = (opts?: Options) => {
    let resolvedPromise: Promise<ResolvedConfig> | undefined

    const getResolved = () => {
        resolvedPromise ??= loadConfig().then(fileConfig =>
            resolveConfig(fileConfig, opts, {
                roots: defaultOptions.roots,
                extractors: defaultOptions.extractors,
                splitBySource: opts?.outDir ? true : defaultOptions.splitBySource,
            })
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
            const onDiagnostic: OnDiagnostic = (diagnostic) => {
                resolved.onDiagnostic?.(diagnostic)
                currentResult?.warn(`[${diagnostic.code}] ${diagnostic.message}${diagnostic.file ? ` (${diagnostic.file})` : ''}`, {
                    plugin: pluginName,
                })
            }

            builder = new Builder({
                roots: resolved.roots,
                extractors: resolved.extractors,
                bundler: opts?.bundler ?? defaultOptions.bundler,
                runner: opts?.runner ?? defaultOptions.runner,
                splitBySource: opts?.outDir ? true : resolved.splitBySource,
                onDiagnostic,
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

        // Write per-file CSS and manifest to outDir
        if (opts?.outDir) {
            const outDir = opts.outDir
            await fs.promises.mkdir(outDir, { recursive: true })

            const manifest: MochiManifest = { global: css.global, files: css.files ?? {} }
            const diskManifest: DiskManifest = { files: {} }

            if (manifest.global) {
                const globalPath = path.resolve(outDir, "global.css")
                await fs.promises.writeFile(globalPath, manifest.global, "utf-8")
                diskManifest.global = globalPath
            }

            for (const [source, fileCss] of Object.entries(manifest.files)) {
                const hash = fileHash(source)
                const cssPath = path.resolve(outDir, `${hash}.css`)
                await fs.promises.writeFile(cssPath, fileCss, "utf-8")
                diskManifest.files[source] = cssPath
            }

            const manifestPath = path.resolve(outDir, "manifest.json")
            await fs.promises.writeFile(manifestPath, JSON.stringify(diskManifest), "utf-8")
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
