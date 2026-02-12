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

function isValidCssFilePath(file: string) {
    const [filePath] = file.split('?')
    return path.extname(filePath ?? "") === '.css'
}

type DiskManifest = {
    global?: string
    files: Record<string, string>
}

type Options = Partial<BuilderOptions> & {
    globalCss?: RegExp
    outDir?: string
}

const pluginName = "postcss-mochi-css"

const defaultOptions: Required<Omit<Options, 'onDiagnostic' | 'outDir'>> = {
    globalCss: /\/globals\.css$/,
    rootDir: "src",
    extractors: defaultExtractors,
    bundler: new RolldownBundler(),
    runner: new VmRunner(),
    splitBySource: false,
}

const creator: PluginCreator<Options> = (opts?: Options) => {
    const options = Object.assign({}, defaultOptions, opts)

    // When outDir is set, force splitBySource
    if (options.outDir) {
        options.splitBySource = true
    }

    let currentResult: Result | undefined
    const onDiagnostic: OnDiagnostic = (diagnostic) => {
        options.onDiagnostic?.(diagnostic)
        currentResult?.warn(`[${diagnostic.code}] ${diagnostic.message}${diagnostic.file ? ` (${diagnostic.file})` : ''}`, {
            plugin: pluginName,
        })
    }

    const builder = new Builder({ ...options, onDiagnostic })
    let builderGuard: Promise<void> | undefined

    const postcssProcess: TransformCallback = async (root, result) => {
        currentResult = result

        const filePath = result.opts.from

        if (!filePath || !isValidCssFilePath(filePath)) return

        const normalizedPath = filePath.replaceAll(path.win32.sep, path.posix.sep)

        // Reset lastIndex to handle regexes with /g flag correctly
        options.globalCss.lastIndex = 0
        if (!options.globalCss.test(normalizedPath)) return

        // Watch the root directory so new files trigger a rebuild
        result.messages.push({
            type: "dir-dependency",
            dir: path.resolve(options.rootDir),
            glob: "**/*.{ts,tsx}",
            plugin: pluginName,
            parent: result.opts.from
        })

        const css = await builder.collectMochiCss({
            onDep: filePath => {
                result.messages.push({
                    type: "dependency",
                    file: filePath,
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
        if (options.outDir) {
            const outDir = options.outDir
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
