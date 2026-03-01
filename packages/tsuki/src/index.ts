import { program, Option } from "commander"
import * as p from "@clack/prompts"
import pc from "picocolors"
import { ModuleRunner } from "./runner"
import { presets } from "./presets"

declare const __VERSION__: string

program
    .name("tsuki")
    .description("Add mochi-css to your project")
    .version(__VERSION__)
    .addOption(new Option("-p, --preset <preset>", "Preset to use").choices(["vite", "nextjs", "lib"]))
    .action(async (options: { preset?: string }) => {
        p.intro(pc.cyan("Installing Mochi-CSS..."))

        try {
            const runner = new ModuleRunner()

            let presetId = options.preset
            if (presetId === undefined) {
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

            await runner.run()

            p.outro(pc.green("Done!"))
        } catch (e) {
            if (e instanceof Error) p.outro(pc.red(e.message))
        }
    })

program.parse()
