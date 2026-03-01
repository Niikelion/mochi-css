import fsExtra from "fs-extra"
import fs from "fs/promises"
import * as p from "@clack/prompts"
import { parseModule, generateCode } from "magicast"
import type { Module, ModuleContext } from "@/types"

const nextConfigNames = ["next.config.ts", "next.config.mts", "next.config.js", "next.config.mjs"]

export function findNextConfig(): string | undefined {
    return nextConfigNames.find((name) => fsExtra.existsSync(name))
}

const defaultNextConfig = /* language=typescript */ `import { withMochi } from "@mochi-css/next"

export default withMochi({})
`

function wrapExportDefault(mod: ReturnType<typeof parseModule>, configPath: string): void {
    type ExportDefaultDecl = {
        type: "ExportDefaultDeclaration"
        declaration: Record<string, unknown>
    }

    const body = (mod.$ast as unknown as { body: unknown[] }).body
    const exportDefault = body.find((s) => (s as { type: string }).type === "ExportDefaultDeclaration") as
        | ExportDefaultDecl
        | undefined

    if (!exportDefault) throw new Error(`No default export found in ${configPath}`)

    const originalDecl = exportDefault.declaration
    ;(exportDefault as Record<string, unknown>)["declaration"] = {
        type: "CallExpression",
        callee: { type: "Identifier", name: "withMochi" },
        arguments: [originalDecl],
    }
}

async function addMochiToNextConfig(configPath: string): Promise<void> {
    const content = await fs.readFile(configPath, "utf-8")
    const mod = parseModule(content)

    mod.imports.$prepend({ from: "@mochi-css/next", imported: "withMochi", local: "withMochi" })
    wrapExportDefault(mod, configPath)

    const { code } = generateCode(mod)
    await fs.writeFile(configPath, code)
}

export const nextModule: Module = {
    id: "next",
    name: "Next.js",

    async run(ctx: ModuleContext): Promise<void> {
        const existingConfig = findNextConfig()

        let configPath: string
        if (!existingConfig) {
            const selected = await p.text({
                message: "Path to Next.js config",
                placeholder: "next.config.ts",
                defaultValue: "next.config.ts",
            })
            if (p.isCancel(selected)) return
            configPath = selected
        } else {
            configPath = existingConfig
        }

        if (!fsExtra.existsSync(configPath)) {
            await fs.writeFile(configPath, defaultNextConfig)
            p.log.success("Created next config with mochi")
        } else {
            await addMochiToNextConfig(configPath)
            p.log.success("Added withMochi() to next config")
        }

        ctx.requirePackage("@mochi-css/next")
    },
}
