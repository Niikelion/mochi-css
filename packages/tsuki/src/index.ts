import { program } from "commander";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { postcss, PostCSSOption } from "./postcss"

declare const __VERSION__: string

interface Options {
    postcss?: PostCSSOption
}

program
    .name("tsuki")
    .description("Add mochi-css to your project")
    .version(__VERSION__)
    .option("--postcss [config]", "PostCSS integration (true/false/path)", postcss.parseOption)
    .action(async (options: Options) => {
        p.intro(pc.cyan("Installing Mochi-CSS..."))

        try {
            await postcss.handle(options.postcss)

            p.outro(pc.green("Done!"))
        } catch (e) {
            if (e instanceof Error)
                p.outro(pc.red(e.message))
        }
    })

program.parse()
