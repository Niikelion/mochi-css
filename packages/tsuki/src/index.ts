import { program, Option } from "commander"
import * as p from "@clack/prompts"
import pc from "picocolors"
import { ModuleRunner } from "./runner"
import { presets } from "./presets"
import type { ModuleOptions } from "./types"

declare const __VERSION__: string

interface CliOptions {
    preset?: string
    interactive?: boolean
    install?: boolean
    postcss?: string | true
    vite?: string | true
    next?: string | true
}

program
    .name("tsuki")
    .description("Add mochi-css to your project")
    .version(__VERSION__)
    .addOption(new Option("-p, --preset <preset>", "Preset to use").choices(["vite", "nextjs", "lib"]))
    .option("-n, --no-interactive", "Non-interactive mode: skip all prompts (treat as cancelled)")
    .option("--install", "Auto-accept package installation without prompting")
    .option("--postcss [path]", "Enable PostCSS module; optionally specify config path")
    .option("--vite [path]", "Use the given Vite config path instead of prompting")
    .option("--next [path]", "Use the given Next.js config path instead of prompting")
    .action(async (options: CliOptions) => {
        p.intro(pc.cyan("Installing Mochi-CSS..."))

        try {
            const runner = new ModuleRunner()
            const nonInteractive = options.interactive === false

            let presetId = options.preset
            if (presetId === undefined) {
                if (nonInteractive) {
                    p.outro(pc.red("Cancelled"))
                    return
                }

                const selected = await p.select({
                    message: "Which framework are you using?",
                    options: Object.values(presets).map((preset) => ({
                        value: preset.id,
                        label: preset.name,
                    })),
                })

                if (p.isCancel(selected)) {
                    p.outro(pc.red("Cancelled"))
                    return
                }

                presetId = selected
            }

            const preset = presets[presetId]
            if (!preset) throw new Error(`Unknown preset: ${presetId}`)
            preset.setup(runner)

            const moduleOptions: ModuleOptions = {}
            if (options.postcss !== undefined) moduleOptions.postcss = options.postcss
            else if (presetId === "nextjs") moduleOptions.postcss = true
            if (options.vite !== undefined) moduleOptions.vite = options.vite
            if (options.next !== undefined) moduleOptions.next = options.next

            await runner.run({
                nonInteractive,
                autoInstall: options.install ?? false,
                moduleOptions,
            })

            p.outro(pc.green("Done!"))
        } catch (e) {
            if (e instanceof Error) p.outro(pc.red(e.message))
        }
    })

program.parse()
