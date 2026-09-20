import fsExtra from "fs-extra"
import fs from "fs/promises"
import * as p from "@clack/prompts"
import { parseModule, generateCode } from "magicast"
import type { Module, ModuleContext } from "@/types"
import { mochiPackage } from "@/version"
import { getArrayPropElements, resolveExportedConfigObject, type ObjNode } from "./ast"
import dedent from "dedent"

const viteConfigNames = ["vite.config.ts", "vite.config.mts", "vite.config.js", "vite.config.mjs"]

export function findViteConfig(): string | undefined {
    return viteConfigNames.find((name) => fsExtra.existsSync(name))
}

// noinspection TypeScriptCheckImport
const defaultViteConfig = /* language=typescript */ dedent`
    import { defineConfig } from "vite"
    import { mochiCss } from "@mochi-css/vite"

    export default defineConfig({
        plugins: [mochiCss()],
    })
`

function addPluginCallToObj(obj: ObjNode, configPath: string): void {
    const elements = getArrayPropElements(obj, "plugins", configPath)
    elements.push({
        type: "CallExpression",
        callee: { type: "Identifier", name: "mochiCss" },
        arguments: [],
    })
}

function addToVitePlugins(mod: ReturnType<typeof parseModule>, configPath: string): void {
    const obj = resolveExportedConfigObject(mod, configPath)
    addPluginCallToObj(obj, configPath)
}

async function addMochiToViteConfig(configPath: string): Promise<void> {
    const content = await fs.readFile(configPath, "utf-8")
    const mod = parseModule(content)

    mod.imports.$prepend({ from: "@mochi-css/vite", imported: "mochiCss", local: "mochiCss" })
    addToVitePlugins(mod, configPath)

    const { code } = generateCode(mod)
    await fs.writeFile(configPath, code)
}

export const viteModule: Module = {
    id: "vite",
    name: "Vite",

    async run(ctx: ModuleContext): Promise<void> {
        const existingConfig = findViteConfig()
        const { vite: cliOption } = ctx.moduleOptions

        let configPath: string
        if (cliOption !== undefined) {
            configPath = typeof cliOption === "string" ? cliOption : (existingConfig ?? "vite.config.ts")
        } else if (existingConfig) {
            configPath = existingConfig
        } else if (ctx.nonInteractive) {
            configPath = "vite.config.ts"
        } else {
            const selected = await p.text({
                message: "Path to Vite config",
                placeholder: "vite.config.ts",
                defaultValue: "vite.config.ts",
            })
            if (p.isCancel(selected)) return
            configPath = selected
        }

        if (!fsExtra.existsSync(configPath)) {
            await fs.writeFile(configPath, defaultViteConfig)
            p.log.success("Created vite config with mochi plugin")
        } else {
            await addMochiToViteConfig(configPath)
            p.log.success("Added mochiCss() to vite config")
        }

        ctx.requirePackage(mochiPackage("@mochi-css/vite"))
    },
}
