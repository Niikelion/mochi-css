import fsExtra from "fs-extra"
import fs from "fs/promises"
import path from "path"
import * as p from "@clack/prompts"
import { parseModule, generateCode, ProxifiedValue } from "magicast"
import type { Module, ModuleContext } from "@/types"

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
    ".postcssrc",
]

export function findPostcssConfig(): string | undefined {
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
        defaultValue: defaultConfig,
    })

    if (p.isCancel(configPath)) return false

    return configPath
}

type MagicastValue = ProxifiedValue | number | string | null | undefined | boolean | bigint | symbol

// magicast v0.5: object proxies override the `has` trap to only expose user-visible keys,
// so `"$ast" in proxy` returns false. Use property access (get trap) instead.
function isProxy(v: MagicastValue): v is ProxifiedValue {
    return v !== null && typeof v === "object" && typeof (v as Record<string, unknown>)["$ast"] === "object"
}

function isObject(v: unknown): v is Record<string, unknown> {
    return v !== null && typeof v === "object"
}

type ObjNode = { type: "ObjectExpression"; properties: Record<string, unknown>[] }

function getPropKeyName(prop: Record<string, unknown>): string | undefined {
    const key = prop["key"] as Record<string, unknown>
    if (typeof key["name"] === "string") return key["name"]
    if (typeof key["value"] === "string") return key["value"]
    return undefined
}

// Handles `const config = { ... }; export default config` by directly mutating the
// module's babel AST — the only approach that works when magicast returns an identifier proxy.
function addPluginToNamedVar(
    mod: ReturnType<typeof parseModule>,
    varName: string,
    pluginName: string,
    configPath: string,
): void {
    type DeclNode = { id: { type: string; name: string }; init: ObjNode | null }
    type VarDeclNode = { type: "VariableDeclaration"; declarations: DeclNode[] }

    const body = (mod.$ast as unknown as { body: unknown[] }).body

    for (const stmt of body) {
        if ((stmt as { type: string }).type !== "VariableDeclaration") continue

        for (const decl of (stmt as VarDeclNode).declarations) {
            if (decl.id.type !== "Identifier" || decl.id.name !== varName) continue

            const init = decl.init
            if (!init) throw new Error(`Failed to add postcss plugin to ${configPath}`)

            const pluginsProp = init.properties.find((p) => getPropKeyName(p) === "plugins") as
                | (Record<string, unknown> & { value: ObjNode })
                | undefined

            if (!pluginsProp) throw new Error(`Failed to find plugins object in ${configPath}`)

            pluginsProp.value.properties.push({
                type: "ObjectProperty",
                key: { type: "StringLiteral", value: pluginName },
                value: { type: "ObjectExpression", properties: [] as Record<string, unknown>[] },
                computed: false,
                shorthand: false,
            } as Record<string, unknown>)

            return
        }
    }

    throw new Error(`Failed to add postcss plugin to ${configPath}`)
}

async function addPostcssPlugin(
    configPath: string,
    pluginName: string,
    pluginOptions: Record<string, unknown> = {},
): Promise<void> {
    const content = await fs.readFile(configPath, "utf-8")

    const mod = parseModule(content)
    const defaultExport = mod.exports["default"] as MagicastValue

    // Handle `export default config` (identifier — variable reference)
    if (isProxy(defaultExport) && defaultExport.$type === "identifier") {
        addPluginToNamedVar(mod, defaultExport.$name, pluginName, configPath)
        const { code } = generateCode(mod)
        await fs.writeFile(configPath, code)
        return
    }

    // Handle both `export default { ... }` and `export default defineConfig({ ... })`
    const config = (
        isProxy(defaultExport) && defaultExport.$type === "function-call" ? defaultExport.$args[0] : defaultExport
    ) as MagicastValue

    if (!isProxy(config) || config.$type !== "object" || !isObject(config))
        throw new Error(`Failed to add postcss plugin to ${configPath}`)

    if ("plugins" in config && config["plugins"] !== undefined && !isObject(config["plugins"]))
        throw new Error(`Unrecognized plugins config type in ${configPath}`)

    // Ensure plugins object exists
    config["plugins"] ??= {}

    // Add plugin
    ;(config["plugins"] as Record<string, unknown>)[pluginName] = pluginOptions

    const { code } = generateCode(mod)
    await fs.writeFile(configPath, code)
}

export async function addToConfig(configPath: string): Promise<void> {
    if (!fsExtra.existsSync(configPath)) {
        await fsExtra.writeFile("postcss.config.mts", defaultPostcssConfig)
        return
    }

    const ext = configPath.split(".").pop()

    if (ext === "json" || path.basename(configPath) === ".postcssrc") {
        const config = (await fsExtra.readJson(configPath)) as unknown
        if (!isObject(config)) throw new Error("Unrecognized config type in ${configPath}`)")
        config["plugins"] ??= {}
        if (!isObject(config["plugins"])) throw new Error("Unrecognized config type in ${configPath}`)")
        config["plugins"]["@mochi-css/postcss"] = {}
        await fsExtra.writeJson(configPath, config, { spaces: 2 })
        return
    }

    if (ext === "yml" || ext === "yaml") throw new Error("YAML PostCSS config is not supported yet")

    // JS/TS config - use magicast
    await addPostcssPlugin(configPath, "@mochi-css/postcss")
}

export const postcssModule: Module = {
    id: "postcss",
    name: "PostCSS",

    async run(ctx: ModuleContext): Promise<void> {
        const usePostcss = await p.confirm({
            message: "Do you use PostCSS?",
        })

        if (p.isCancel(usePostcss) || !usePostcss) return

        const configPath = await askForPath()
        if (configPath === false) return

        await addToConfig(configPath)
        p.log.step("Added mochi plugin to the postcss config")

        ctx.requirePackage("@mochi-css/postcss")
    },
}
