import fsExtra from "fs-extra"
import fs from "fs/promises"
import * as p from "@clack/prompts"
import { parseModule, generateCode } from "magicast"
import type { Module, ModuleContext } from "@/types"
import { mochiPackage } from "@/version"
import { getArrayPropElements, getPropKeyName, resolveExportedConfigObject, type ObjNode } from "./ast"
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

type Located = Record<string, unknown> & { type: string; start: number; end: number }

const isMochiCall = (el: Located | null) =>
    el?.type === "CallExpression" && (el["callee"] as { name?: unknown } | undefined)?.name === "mochiCss"

/** The import to add, matching the quotes and semicolons of the file's first import. */
function importLine(content: string): string {
    const first = /^import\b.*$/m.exec(content)?.[0]
    const quote = first?.includes("'") ? "'" : '"'
    const semi = first?.trimEnd().endsWith(";") ? ";" : ""
    return `import { mochiCss } from ${quote}@mochi-css/vite${quote}${semi}\n`
}

/**
 * Adds `mochiCss()` by editing the source text, so the rest of the file keeps its formatting.
 * Returns undefined when there is no `plugins` array literal to edit in place.
 */
export function addMochiToViteSource(source: string, configPath: string): string | undefined {
    // The parser reports offsets in LF-normalized text, so edit an LF copy and restore line endings after.
    const crlf = source.includes("\r\n")
    const content = crlf ? source.replace(/\r\n/g, "\n") : source
    const mod = parseModule(content)
    const obj = resolveExportedConfigObject(mod, configPath)
    const plugins = obj.properties.find((prop) => getPropKeyName(prop) === "plugins")?.["value"] as
        | (Located & { elements: (Located | null)[] })
        | undefined
    if (plugins?.type !== "ArrayExpression" || typeof plugins.start !== "number") return undefined

    const insert = (at: number, text: string) => content.slice(0, at) + text + content.slice(at)
    let out = content

    if (!plugins.elements.some(isMochiCall)) {
        const last = plugins.elements.filter((el): el is Located => el !== null).at(-1)
        if (!last) {
            out = insert(plugins.end - 1, "mochiCss()")
        } else if (!content.slice(plugins.start, plugins.end).includes("\n")) {
            out = insert(last.end, ", mochiCss()")
        } else {
            // One plugin per line: add another line with the same indentation, keeping any trailing comma.
            const lineStart = content.lastIndexOf("\n", last.start) + 1
            const indent = /^[ \t]*/.exec(content.slice(lineStart))?.[0] ?? ""
            const comma = /^\s*,/.exec(content.slice(last.end, plugins.end - 1))?.[0]
            out = comma
                ? insert(last.end + comma.length, `\n${indent}mochiCss(),`)
                : insert(last.end, `,\n${indent}mochiCss()`)
        }
    }

    const imported = mod.imports.$items.some((item) => item.from === "@mochi-css/vite" && item.local === "mochiCss")
    if (!imported) out = importLine(content) + out
    return crlf ? out.replace(/\n/g, "\r\n") : out
}

async function addMochiToViteConfig(configPath: string): Promise<void> {
    const content = await fs.readFile(configPath, "utf-8")
    const edited = addMochiToViteSource(content, configPath)
    if (edited !== undefined) return fs.writeFile(configPath, edited)

    // No plugins array to edit in place: rebuild the config through the AST instead.
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
