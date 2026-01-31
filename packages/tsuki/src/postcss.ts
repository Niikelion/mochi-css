import fsExtra from "fs-extra"
import fs from "fs/promises"
import path from "path"
import * as p from "@clack/prompts"
import { parseModule, generateCode } from "magicast"

export type PostCSSOption = boolean | string

const postcssConfigNames = [
    "postcss.config.mts",
    "postcss.config.ts",
    "postcss.config.mjs",
    "postcss.config.js",
    "postcss.config.cjs",
    ".postcssrc.mts",
    ".postcssrc.ts",
    ".postcssrc.mjs",
    ".postcssrc.js",
    ".postcssrc.cjs",
    ".postcssrc.json",
    ".postcssrc.yml",
    ".postcssrc.yaml",
    ".postcssrc"
]

function findPostcssConfig(): string | undefined {
    return postcssConfigNames.find((name) => fsExtra.existsSync(name))
}

const defaultPostcssConfig = /* language=typescript */ `export default {
    plugins: {
        "@mochi-css/postcss": {}
    }
}
`

async function askForPath(): Promise<string | false> {
    const defaultConfig = findPostcssConfig() ?? "postcss.config.js"

    const configPath = await p.text({
        message: "Path to PostCSS config",
        placeholder: defaultConfig,
        defaultValue: defaultConfig
    })

    if (p.isCancel(configPath)) return false

    return configPath
}

async function resolve(target?: PostCSSOption): Promise<string | false> {
    switch (target) {
        case true:
            return askForPath()
        case false:
            return false
        case undefined: {
            const usePostcss = await p.confirm({
                message: "Do you use PostCSS?",
            })

            if (p.isCancel(usePostcss) || !usePostcss) return false
            return askForPath()
        }
        default:
            return target
    }
}

async function addPostcssPlugin(
    configPath: string,
    pluginName: string,
    pluginOptions: Record<string, unknown> = {}
): Promise<void> {
    const content = await fs.readFile(configPath, "utf-8")

    const mod = parseModule(content)
    const defaultExport = mod.exports["default"]

    // Handle both `export default { ... }` and `export default defineConfig({ ... })`
    const config = defaultExport.$type === "function-call"
        ? defaultExport.$args[0]
        : defaultExport

    // Ensure plugins object exists
    config.plugins ??= {}

    // Add plugin
    config.plugins[pluginName] = pluginOptions

    const { code } = generateCode(mod)
    await fs.writeFile(configPath, code)
}

async function addToConfig(configPath: string): Promise<void> {
    if (!fsExtra.existsSync(configPath)) {
        await fsExtra.writeFile("postcss.config.mts", defaultPostcssConfig);
        return
    }

    const ext = configPath.split(".").pop()

    if (ext === "json" || path.basename(configPath) === ".postcssrc") {
        const config = await fsExtra.readJson(configPath)
        config.plugins ??= {}
        config.plugins["@mochi-css/postcss"] = {}
        await fsExtra.writeJson(configPath, config, { spaces: 2 })
        return
    }

    if (ext === "yml" || ext === "yaml") {
        throw new Error("YAML PostCSS config is not supported yet");
    }

    // JS/TS config - use magicast
    await addPostcssPlugin(configPath, "@mochi-css/postcss")
}

export const postcss = {
    parseOption(value: string): boolean | string {
        switch (value) {
            case "true":
                return true
            case "false":
                return false
            default:
                return value
        }
    },

    async handle(target?: PostCSSOption): Promise<void> {
        const configPath = await resolve(target)
        if (configPath === false) return
        await addToConfig(configPath)
    }
}
