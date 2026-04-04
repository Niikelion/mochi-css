import fsExtra from "fs-extra"
import fs from "fs/promises"
import * as p from "@clack/prompts"
import { parseModule, generateCode } from "magicast"
import type { Module, ModuleContext } from "@/types"
import { mochiPackage } from "@/version"
import { getPropKeyName } from "./ast"
import dedent from "dedent"

const mochiConfigNames = ["mochi.config.ts", "mochi.config.mts", "mochi.config.js", "mochi.config.mjs"]

export function findMochiConfig(): string | undefined {
    return mochiConfigNames.find((name) => fsExtra.existsSync(name))
}

// noinspection TypeScriptCheckImport
const defaultMochiConfigBase = /* language=typescript */ dedent`
    import { defineConfig } from "@mochi-css/vanilla/config"

    export default defineConfig({})
`

function defaultMochiConfigWithOptions(
    tmpDir: string | undefined,
    styledId: boolean,
    splitCss: boolean | undefined,
): string {
    const importPath = styledId ? "@mochi-css/vanilla-react/config" : "@mochi-css/vanilla/config"
    const lines: string[] = []
    if (tmpDir !== undefined) lines.push(`    tmpDir: ${JSON.stringify(tmpDir)},`)
    if (splitCss !== undefined) lines.push(`    splitCss: ${splitCss},`)

    if (!styledId && lines.length === 0) return defaultMochiConfigBase

    return `import { defineConfig } from "${importPath}"\n\nexport default defineConfig({\n${lines.join("\n")}\n})\n`
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

async function addTmpDirToExistingConfig(configPath: string, tmpDir: string): Promise<void> {
    const content = await fs.readFile(configPath, "utf-8")
    const mod = parseModule(content)
    const obj = getConfigObject(mod)
    if (!obj) throw new Error(`Failed to add tmpDir to ${configPath}`)

    const hasTmpDir = (obj["properties"] as Record<string, unknown>[]).some((prop) => getPropKeyName(prop) === "tmpDir")
    if (hasTmpDir) return

    obj["properties"] = [
        {
            type: "ObjectProperty",
            key: { type: "StringLiteral", value: "tmpDir" },
            value: { type: "StringLiteral", value: tmpDir },
            computed: false,
            shorthand: false,
        },
        ...(obj["properties"] as unknown[]),
    ]

    const { code } = generateCode(mod)
    await fs.writeFile(configPath, code)
}

async function addSplitCssToExistingConfig(configPath: string, splitCss: boolean): Promise<void> {
    const content = await fs.readFile(configPath, "utf-8")
    const mod = parseModule(content)
    const obj = getConfigObject(mod)
    if (!obj) throw new Error(`Failed to add splitCss to ${configPath}`)

    const hasSplitCss = (obj["properties"] as Record<string, unknown>[]).some(
        (prop) => getPropKeyName(prop) === "splitCss",
    )
    if (hasSplitCss) return

    obj["properties"] = [
        {
            type: "ObjectProperty",
            key: { type: "StringLiteral", value: "splitCss" },
            value: { type: "BooleanLiteral", value: splitCss },
            computed: false,
            shorthand: false,
        },
        ...(obj["properties"] as unknown[]),
    ]

    const { code } = generateCode(mod)
    await fs.writeFile(configPath, code)
}

async function patchToVanillaReact(configPath: string): Promise<void> {
    const content = await fs.readFile(configPath, "utf-8")
    if (content.includes("@mochi-css/vanilla-react")) return
    const patched = content.replace(/"@mochi-css\/vanilla\/config"/g, '"@mochi-css/vanilla-react/config"')
    await fs.writeFile(configPath, patched)
}

export interface MochiConfigModuleOptions {
    /** Whether to use @mochi-css/vanilla-react/config for stable component selectors */
    styledId?: boolean
    /** Intermediate directory for generated CSS files */
    tmpDir?: string
    /** Whether to emit per-file CSS chunks instead of a single global file */
    splitCss?: boolean
}

export function createMochiConfigModule(options: MochiConfigModuleOptions = {}): Module {
    const { styledId = false, tmpDir, splitCss } = options

    return {
        id: "mochi-config",
        name: "Mochi Config",

        async run(ctx: ModuleContext): Promise<void> {
            const existing = findMochiConfig()

            if (!existing) {
                const configPath = "mochi.config.ts"
                await fs.writeFile(configPath, defaultMochiConfigWithOptions(tmpDir, styledId, splitCss))
                p.log.success("Created mochi.config.ts")
            } else {
                if (tmpDir !== undefined) {
                    try {
                        await addTmpDirToExistingConfig(existing, tmpDir)
                        p.log.success(`Added tmpDir to ${existing}`)
                    } catch {
                        p.log.warn(`Could not automatically add tmpDir to ${existing} — add it manually`)
                    }
                }
                if (splitCss !== undefined) {
                    try {
                        await addSplitCssToExistingConfig(existing, splitCss)
                        p.log.success(`Added splitCss to ${existing}`)
                    } catch {
                        p.log.warn(`Could not automatically add splitCss to ${existing} — add it manually`)
                    }
                }
                if (styledId) {
                    try {
                        await patchToVanillaReact(existing)
                        p.log.success("Switched mochi.config to @mochi-css/vanilla-react/config")
                    } catch {
                        p.log.warn(
                            `Could not patch ${existing} — change the import to @mochi-css/vanilla-react/config manually`,
                        )
                    }
                }
            }

            ctx.requirePackage(mochiPackage("@mochi-css/vanilla"))
            if (styledId) {
                ctx.requirePackage(mochiPackage("@mochi-css/vanilla-react"))
            }
        },
    }
}
