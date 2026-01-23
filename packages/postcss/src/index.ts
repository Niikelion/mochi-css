import {PluginCreator, TransformCallback} from "postcss";
import * as path from "path";
import {Builder, StyleSource, defaultStyleSources} from "@mochi-css/builder";

function isValidCssFilePath(file: string) {
    const [filePath] = file.split('?')
    return path.extname(filePath ?? "") === '.css'
}

type Options = {
    rootDir?: string
    styleSources?: StyleSource[]
}

const pluginName = "postcss-mochi-css"

const creator: PluginCreator<Options> = (opts?: Options) => {
    const options = Object.assign({
        rootDir: "src",
        styleSources: defaultStyleSources
    }, opts)

    const builder = new Builder(options)
    let builderGuard: Promise<void> | undefined

    const postcssProcess: TransformCallback = async (root, result) => {
        const filePath = result.opts.from

        if (!filePath || !isValidCssFilePath(filePath)) return

        //TODO: better matching for global css
        if (!filePath.endsWith("globals.css")) return

        const css = await builder.collectMochiCss(path => {
            result.messages.push({
                type: "dependency",
                file: path,
                plugin: pluginName,
                parent: result.opts.from
            })
        })

        root.append(css["global.css"])

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
