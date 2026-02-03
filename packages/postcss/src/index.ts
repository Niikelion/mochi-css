import {PluginCreator, Result, TransformCallback} from "postcss";
import * as path from "path";
import {Builder, defaultExtractors, BuilderOptions, RolldownBundler, VmRunner, OnDiagnostic} from "@mochi-css/builder";

function isValidCssFilePath(file: string) {
    const [filePath] = file.split('?')
    return path.extname(filePath ?? "") === '.css'
}

type Options = Partial<BuilderOptions> & {
    globalCss?: RegExp
}

const pluginName = "postcss-mochi-css"

const defaultOptions: Required<Omit<Options, 'onDiagnostic'>> = {
    globalCss: /\/globals\.css$/,
    rootDir: "src",
    extractors: defaultExtractors,
    bundler: new RolldownBundler(),
    runner: new VmRunner()
}

const creator: PluginCreator<Options> = (opts?: Options) => {
    const options = Object.assign({}, defaultOptions, opts)

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

        const css = await builder.collectMochiCss(filePath => {
            result.messages.push({
                type: "dependency",
                file: filePath,
                plugin: pluginName,
                parent: result.opts.from
            })
        })

        if (css.global) {
            root.append(css.global)
        }

        root.walk(node => {
            if (node.source) return
            node.source = root.source
        })
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
