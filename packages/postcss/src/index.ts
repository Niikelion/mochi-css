import {PluginCreator, TransformCallback} from "postcss";
import * as path from "path";
import {Builder, defaultStyleSources, BuilderOptions, RolldownBundler, VmRunner} from "@mochi-css/builder";

function isValidCssFilePath(file: string) {
    const [filePath] = file.split('?')
    return path.extname(filePath ?? "") === '.css'
}

type Options = Partial<BuilderOptions> & {
    globalCss?: RegExp
}

const pluginName = "postcss-mochi-css"

const defaultOptions: Required<Options> = {
    globalCss: /^.*\/globals.css$/g,
    rootDir: "src",
    styleSources: defaultStyleSources,
    bundler: new RolldownBundler(),
    runner: new VmRunner()
}

const creator: PluginCreator<Options> = (opts?: Options) => {
    const options = Object.assign({}, defaultOptions, opts)

    const builder = new Builder(options)
    let builderGuard: Promise<void> | undefined

    const postcssProcess: TransformCallback = async (root, result) => {
        const filePath = result.opts.from

        if (!filePath || !isValidCssFilePath(filePath)) return

        const normalizedPath = filePath.replaceAll(path.win32.sep, path.posix.sep)

        if (!options.globalCss.test(normalizedPath)) return

        const css = await builder.collectMochiCss(path => {
            result.messages.push({
                type: "dependency",
                file: path,
                plugin: pluginName,
                parent: result.opts.from
            })
        })

        root.append(css.global)

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
                    .catch(() => {})
                    .then(() => postcssProcess(...args))
                return builderGuard
            }
        ]
    }
}
creator.postcss = true

export default creator
