import { program } from "commander"
import * as p from "@clack/prompts"
import pc from "picocolors"
import { ModuleRunner } from "./runner"
import { postcssModule } from "./modules"

declare const __VERSION__: string

program
    .name("tsuki")
    .description("Add mochi-css to your project")
    .version(__VERSION__)
    .action(async () => {
        p.intro(pc.cyan("Installing Mochi-CSS..."))

        try {
            const runner = new ModuleRunner()
            runner.register(postcssModule)

            await runner.run()

            p.outro(pc.green("Done!"))
        } catch (e) {
            if (e instanceof Error)
                p.outro(pc.red(e.message))
        }
    })

program.parse()
