import fsExtra from "fs-extra"
import fs from "fs/promises"
import path from "path"
import * as p from "@clack/prompts"
import { parseModule, generateCode } from "magicast"
import type { Module, ModuleContext } from "@/types"
import { mochiPackage } from "@/version"
import { getArrayPropElements, resolveExportedConfigObject, pushUniqueStringLiteral } from "./ast"
import dedent from "dedent"

const defaultStorybookConfigPath = path.join(".storybook", "main.ts")

const storybookConfigNames = [
    defaultStorybookConfigPath,
    path.join(".storybook", "main.mts"),
    path.join(".storybook", "main.js"),
    path.join(".storybook", "main.mjs"),
    path.join(".storybook", "main.cjs"),
]

export function findStorybookConfig(): string | undefined {
    return storybookConfigNames.find((name) => fsExtra.existsSync(name))
}

// noinspection TypeScriptCheckImport
const defaultStorybookConfig = /* language=typescript */ dedent`
    import type { StorybookConfig } from "@storybook/react-vite"

    const config: StorybookConfig = {
        stories: ["../src/**/*.stories.@(ts|tsx)"],
        addons: ["@mochi-css/storybook"],
        framework: "@storybook/react-vite",
    }

    export default config
`

function addAddonToConfig(mod: ReturnType<typeof parseModule>, configPath: string): void {
    const obj = resolveExportedConfigObject(mod, configPath)
    const elements = getArrayPropElements(obj, "addons", configPath)
    pushUniqueStringLiteral(elements, "@mochi-css/storybook")
}

async function addMochiToStorybookConfig(configPath: string): Promise<void> {
    const content = await fs.readFile(configPath, "utf-8")
    const mod = parseModule(content)

    addAddonToConfig(mod, configPath)

    const { code } = generateCode(mod)
    await fs.writeFile(configPath, code)
}

export const storybookModule: Module = {
    id: "storybook",
    name: "Storybook",

    async run(ctx: ModuleContext): Promise<void> {
        const { storybook: cliOption } = ctx.moduleOptions

        let configPath: string
        if (cliOption !== undefined) {
            // --storybook [path]: forced on, use provided path or auto-detect
            configPath =
                typeof cliOption === "string" ? cliOption : (findStorybookConfig() ?? defaultStorybookConfigPath)
        } else if (ctx.nonInteractive) {
            return
        } else {
            const useStorybook = await p.confirm({
                message: "Do you use Storybook?",
            })

            if (p.isCancel(useStorybook) || !useStorybook) return

            const defaultConfig = findStorybookConfig() ?? defaultStorybookConfigPath
            const selected = await p.text({
                message: "Path to Storybook config",
                placeholder: defaultConfig,
                defaultValue: defaultConfig,
            })
            if (p.isCancel(selected)) return
            configPath = selected
        }

        if (!fsExtra.existsSync(configPath)) {
            await fs.mkdir(path.dirname(configPath), { recursive: true })
            await fs.writeFile(configPath, defaultStorybookConfig)
            p.log.success("Created Storybook config with mochi addon")
        } else {
            await addMochiToStorybookConfig(configPath)
            p.log.success("Added @mochi-css/storybook to Storybook config")
        }

        ctx.requirePackage(mochiPackage("@mochi-css/storybook"))
    },
}
