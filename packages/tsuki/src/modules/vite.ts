import fsExtra from "fs-extra"
import fs from "fs/promises"
import * as p from "@clack/prompts"
import { parseModule, generateCode } from "magicast"
import type { Module, ModuleContext } from "@/types"
import { mochiPackage } from "@/version"
import { getPluginsElements, type ObjNode } from "./ast"
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
    const elements = getPluginsElements(obj, configPath)
    elements.push({
        type: "CallExpression",
        callee: { type: "Identifier", name: "mochiCss" },
        arguments: [],
    })
}

function addToVitePlugins(mod: ReturnType<typeof parseModule>, configPath: string): void {
    type DeclNode = { id: { type: string; name: string }; init: Record<string, unknown> | null }
    type VarDeclNode = { type: "VariableDeclaration"; declarations: DeclNode[] }
    type ExportDefaultDecl = {
        type: "ExportDefaultDeclaration"
        declaration: Record<string, unknown>
    }

    const body = (mod.$ast as unknown as { body: unknown[] }).body
    const exportDefault = body.find((s) => (s as { type: string }).type === "ExportDefaultDeclaration") as
        | ExportDefaultDecl
        | undefined

    if (!exportDefault) throw new Error(`No default export found in ${configPath}`)

    const decl = exportDefault.declaration

    if (decl["type"] === "ObjectExpression") {
        addPluginCallToObj(decl as ObjNode, configPath)
        return
    }

    if (decl["type"] === "CallExpression") {
        const args = decl["arguments"] as Record<string, unknown>[]
        const firstArg = args[0]
        if (firstArg?.["type"] === "ObjectExpression") {
            addPluginCallToObj(firstArg as ObjNode, configPath)
            return
        }
    }

    if (decl["type"] === "Identifier") {
        const varName = decl["name"] as string
        for (const stmt of body) {
            if ((stmt as { type: string }).type !== "VariableDeclaration") continue
            for (const d of (stmt as VarDeclNode).declarations) {
                if (d.id.type !== "Identifier" || d.id.name !== varName) continue
                if (d.init?.["type"] !== "ObjectExpression") {
                    throw new Error(`Failed to add vite plugin to ${configPath}`)
                }
                addPluginCallToObj(d.init as ObjNode, configPath)
                return
            }
        }
    }

    throw new Error(`Failed to add vite plugin to ${configPath}`)
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
