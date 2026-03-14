import * as p from "@clack/prompts"
import type { Module, ModuleContext } from "@/types"
import { mochiPackage } from "@/version"

export interface UiFrameworkModuleOptions {
    /** Skip the "Do you use React?" prompt and auto-install React. */
    auto?: boolean
}

export function createUiFrameworkModule(options: UiFrameworkModuleOptions = {}): Module {
    return {
        id: "ui-framework",
        name: "UI Framework",
        async run(ctx: ModuleContext): Promise<void> {
            const { framework: cliOption } = ctx.moduleOptions

            let useReact = options.auto === true || cliOption === "react"

            if (useReact) {
                ctx.requirePackage(mochiPackage("@mochi-css/react"), false)
                return
            }

            if (ctx.nonInteractive) return
            const confirmed = await p.confirm({ message: "Do you use React?" })
            if (p.isCancel(confirmed) || !confirmed) return
            useReact = true
        },
    }
}
