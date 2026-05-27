import fsExtra from "fs-extra"
import fs from "fs/promises"
import * as p from "@clack/prompts"
import { parseModule, generateCode } from "magicast"
import type { Module, ModuleContext } from "@/types"
import { mochiPackage } from "@/version"
import { getPluginsElements, type ObjNode } from "./ast"
import dedent from "dedent"

const tsdownConfigNames = ["tsdown.config.mts", "tsdown.config.ts", "tsdown.config.js", "tsdown.config.mjs"]

export function findTsdownConfig(): string | undefined {
    return tsdownConfigNames.find((name) => fsExtra.existsSync(name))
}

// noinspection TypeScriptCheckImport
const defaultTsdownConfig = /* language=typescript */ dedent`
    import { defineConfig } from "tsdown"
    import { mochiCss } from "@mochi-css/rolldown"

    export default defineConfig({
        entry: ["src/index.ts"],
        format: ["esm", "cjs"],
        dts: true,
        sourcemap: true,
        plugins: [mochiCss()],
    })
`

type DeclNode = { type: string; declaration: Record<string, unknown> }
type CallNode = { type: "CallExpression"; callee: Record<string, unknown>; arguments: Record<string, unknown>[] }

function findDefineConfigArg(body: unknown[]): ObjNode | undefined {
    for (const stmt of body) {
        const s = stmt as Record<string, unknown>
        if (s["type"] !== "ExportDefaultDeclaration") continue

        const decl = (s as DeclNode).declaration
        if (decl["type"] !== "CallExpression") continue

        const call = decl as CallNode
        const callee = call.callee as { name?: string; object?: { name?: string } }
        const calleeName = callee.name ?? callee.object?.name ?? ""
        if (calleeName !== "defineConfig") continue

        const firstArg = call.arguments[0]
        if (!firstArg) continue

        if (firstArg["type"] === "ObjectExpression") {
            return firstArg as ObjNode
        }

        if (firstArg["type"] === "ArrayExpression") {
            const elements = (firstArg as { elements: Record<string, unknown>[] }).elements
            const firstElem = elements[0]
            if (firstElem?.["type"] === "ObjectExpression") {
                return firstElem as ObjNode
            }
        }
    }
    return undefined
}

function addMochiToTsdownConfig(mod: ReturnType<typeof parseModule>, configPath: string): void {
    const body = (mod.$ast as unknown as { body: unknown[] }).body
    const configObj = findDefineConfigArg(body)

    if (!configObj) {
        throw new Error(`Failed to find defineConfig() call in ${configPath}`)
    }

    const elements = getPluginsElements(configObj, configPath)
    elements.push({
        type: "CallExpression",
        callee: { type: "Identifier", name: "mochiCss" },
        arguments: [],
    })
}

async function addMochiToConfig(configPath: string): Promise<void> {
    const content = await fs.readFile(configPath, "utf-8")
    const mod = parseModule(content)

    mod.imports.$prepend({ from: "@mochi-css/rolldown", imported: "mochiCss", local: "mochiCss" })
    addMochiToTsdownConfig(mod, configPath)

    const { code } = generateCode(mod)
    await fs.writeFile(configPath, code)
}

export const tsdownModule: Module = {
    id: "tsdown",
    name: "tsdown",

    async run(ctx: ModuleContext): Promise<void> {
        const existingConfig = findTsdownConfig()
        const { tsdown: cliOption } = ctx.moduleOptions

        let configPath: string
        if (cliOption !== undefined) {
            configPath = typeof cliOption === "string" ? cliOption : (existingConfig ?? "tsdown.config.mts")
        } else if (existingConfig) {
            configPath = existingConfig
        } else if (ctx.nonInteractive) {
            configPath = "tsdown.config.mts"
        } else {
            const selected = await p.text({
                message: "Path to tsdown config file",
                placeholder: "tsdown.config.mts",
                defaultValue: "tsdown.config.mts",
            })
            if (p.isCancel(selected)) return
            configPath = selected
        }

        if (!fsExtra.existsSync(configPath)) {
            await fs.writeFile(configPath, defaultTsdownConfig)
            p.log.success("Created tsdown config with mochi plugin")
        } else {
            await addMochiToConfig(configPath)
            p.log.success("Added mochiCss() to tsdown config")
        }

        ctx.requirePackage(mochiPackage("@mochi-css/rolldown"))
        ctx.requirePackage("tsdown")
    },
}
