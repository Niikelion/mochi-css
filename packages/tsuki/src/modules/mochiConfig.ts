import fsExtra from "fs-extra"
import fs from "fs/promises"
import * as p from "@clack/prompts"
import { parseModule, generateCode } from "magicast"
import type { Module, ModuleContext } from "@/types"
import { mochiPackage } from "@/version"
import { getPluginsElements, getPropKeyName, type ObjNode } from "./ast"
import dedent from "dedent"

const mochiConfigNames = ["mochi.config.ts", "mochi.config.mts", "mochi.config.js", "mochi.config.mjs"]

export function findMochiConfig(): string | undefined {
    return mochiConfigNames.find((name) => fsExtra.existsSync(name))
}

// noinspection TypeScriptCheckImport
const defaultMochiConfigBase = /* language=typescript */ dedent`
    import { defineConfig } from "@mochi-css/config"

    export default defineConfig({})
`

function defaultMochiConfigWithOptions(outDir: string | undefined, styledId: boolean): string {
    const lines: string[] = []
    if (outDir !== undefined) lines.push(`    outDir: ${JSON.stringify(outDir)},`)
    if (styledId) lines.push(`    plugins: [styledIdPlugin()],`)

    if (!styledId && lines.length === 0) return defaultMochiConfigBase

    const imports = styledId
        ? // noinspection TypeScriptCheckImport
          dedent`
              import { defineConfig } from "@mochi-css/config"
              import { styledIdPlugin } from "@mochi-css/builder"
          `
        : `import { defineConfig } from "@mochi-css/config"`

    return `${imports}\n\nexport default defineConfig({\n${lines.join("\n")}\n})\n`
}

function addStyledIdPluginToObj(obj: ObjNode, configPath: string): void {
    const elements = getPluginsElements(obj, configPath)
    elements.push({
        type: "CallExpression",
        callee: { type: "Identifier", name: "styledIdPlugin" },
        arguments: [],
    })
}

function addStyledIdToAst(mod: ReturnType<typeof parseModule>, configPath: string): void {
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
        addStyledIdPluginToObj(decl as ObjNode, configPath)
        return
    }

    if (decl["type"] === "CallExpression") {
        const args = decl["arguments"] as Record<string, unknown>[]
        const firstArg = args[0]
        if (firstArg?.["type"] === "ObjectExpression") {
            addStyledIdPluginToObj(firstArg as ObjNode, configPath)
            return
        }
    }

    throw new Error(`Failed to add styledIdPlugin to ${configPath}`)
}

async function addStyledIdToExistingConfig(configPath: string): Promise<void> {
    const content = await fs.readFile(configPath, "utf-8")
    if (content.includes("styledIdPlugin")) return
    const mod = parseModule(content)
    mod.imports.$prepend({ from: "@mochi-css/builder", imported: "styledIdPlugin", local: "styledIdPlugin" })
    addStyledIdToAst(mod, configPath)
    const { code } = generateCode(mod)
    await fs.writeFile(configPath, code)
}

function getConfigObject(mod: ReturnType<typeof parseModule>): Record<string, unknown> | undefined {
    type ExportDefaultDecl = { type: "ExportDefaultDeclaration"; declaration: Record<string, unknown> }

    const body = (mod.$ast as unknown as { body: unknown[] }).body
    const exportDefault = body.find((s) => (s as { type: string }).type === "ExportDefaultDeclaration") as
        | ExportDefaultDecl
        | undefined

    if (!exportDefault) return undefined

    const decl = exportDefault.declaration
    if (decl["type"] === "ObjectExpression") return decl

    if (decl["type"] === "CallExpression") {
        const args = decl["arguments"] as Record<string, unknown>[]
        const firstArg = args[0]
        if (firstArg?.["type"] === "ObjectExpression") return firstArg
    }

    return undefined
}

async function addOutDirToExistingConfig(configPath: string, outDir: string): Promise<void> {
    const content = await fs.readFile(configPath, "utf-8")
    const mod = parseModule(content)
    const obj = getConfigObject(mod)
    if (!obj) throw new Error(`Failed to add outDir to ${configPath}`)

    const hasOutDir = (obj["properties"] as Record<string, unknown>[]).some((prop) => getPropKeyName(prop) === "outDir")
    if (hasOutDir) return

    obj["properties"] = [
        {
            type: "ObjectProperty",
            key: { type: "StringLiteral", value: "outDir" },
            value: { type: "StringLiteral", value: outDir },
            computed: false,
            shorthand: false,
        },
        ...(obj["properties"] as unknown[]),
    ]

    const { code } = generateCode(mod)
    await fs.writeFile(configPath, code)
}

export interface MochiConfigModuleOptions {
    /** Whether to include styledIdPlugin for stable component selectors */
    styledId?: boolean
    /** Output directory for generated CSS files */
    outDir?: string
}

export function createMochiConfigModule(options: MochiConfigModuleOptions = {}): Module {
    const { styledId = false, outDir } = options

    return {
        id: "mochi-config",
        name: "Mochi Config",

        async run(ctx: ModuleContext): Promise<void> {
            const existing = findMochiConfig()

            if (!existing) {
                const configPath = "mochi.config.ts"
                await fs.writeFile(configPath, defaultMochiConfigWithOptions(outDir, styledId))
                p.log.success("Created mochi.config.ts")
            } else {
                if (outDir !== undefined) {
                    try {
                        await addOutDirToExistingConfig(existing, outDir)
                        p.log.success(`Added outDir to ${existing}`)
                    } catch {
                        p.log.warn(`Could not automatically add outDir to ${existing} — add it manually`)
                    }
                }
                if (styledId) {
                    try {
                        await addStyledIdToExistingConfig(existing)
                        p.log.success("Added styledIdPlugin to mochi.config.ts")
                    } catch {
                        p.log.warn(`Could not automatically add styledIdPlugin to ${existing} — add it manually`)
                    }
                }
            }

            ctx.requirePackage(mochiPackage("@mochi-css/config"))
            if (styledId) ctx.requirePackage(mochiPackage("@mochi-css/builder"))
        },
    }
}
