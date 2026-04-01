import fs from "fs/promises"
import * as p from "@clack/prompts"
import type { Module, ModuleContext } from "@/types"
import { mochiPackage } from "@/version"
import { findMochiConfig } from "./mochiConfig"

export interface UiFrameworkModuleOptions {
    /** Skip the "Do you use React?" prompt and auto-install React. */
    auto?: boolean
}

async function patchConfigForReact(configPath: string): Promise<void> {
    const content = await fs.readFile(configPath, "utf-8")
    if (content.includes("@mochi-css/vanilla-react")) return
    const patched = content.replace(/"@mochi-css\/vanilla\/config"/g, '"@mochi-css/vanilla-react/config"')
    await fs.writeFile(configPath, patched)
}

export function createUiFrameworkModule(options: UiFrameworkModuleOptions = {}): Module {
    return {
        id: "ui-framework",
        name: "UI Framework",
        async run(ctx: ModuleContext): Promise<void> {
            const { framework: cliOption } = ctx.moduleOptions

            let useReact = options.auto === true || cliOption === "react"

            if (!useReact) {
                if (ctx.nonInteractive) return
                const confirmed = await p.confirm({ message: "Do you use React?" })
                if (p.isCancel(confirmed) || !confirmed) return
                useReact = true
            }

            ctx.requirePackage(mochiPackage("@mochi-css/vanilla-react"), false)

            const configPath = findMochiConfig()
            if (configPath) {
                try {
                    await patchConfigForReact(configPath)
                } catch {
                    p.log.warn(
                        `Could not patch ${configPath} — change the import to @mochi-css/vanilla-react/config manually`,
                    )
                }
            }
        },
    }
}
