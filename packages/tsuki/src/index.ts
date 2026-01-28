import { program } from "commander";
import * as p from "@clack/prompts";
import pc from "picocolors";
import fs from "fs-extra";
import path from "path";

declare const __VERSION__: string;

function parsePostcss(value: string): boolean | string {
    if (value === "true") return true;
    if (value === "false") return false;
    return value;
}

interface Options {
    postcss?: boolean | string;
}

const postcssConfigNames = [
    "postcss.config.mts",
    "postcss.config.ts",
    "postcss.config.mjs",
    "postcss.config.js",
    "postcss.config.cjs",
    ".postcssrc.mts",
    ".postcssrc.ts",
    ".postcssrc.mjs",
    ".postcssrc.js",
    ".postcssrc.cjs",
    ".postcssrc.json",
    ".postcssrc.yml",
    ".postcssrc.yaml",
    ".postcssrc"
];

function findPostcssConfig(): string | undefined {
    return postcssConfigNames.find((name) => fs.existsSync(name));
}

const defaultPostcssConfig = /* language=typescript */ `export default {
    plugins: {
        "@mochi-css/postcss": {}
    }
}
`;

async function addMochiToPostcss(configPath: string): Promise<void> {
    if (!fs.existsSync(configPath)) {
        await fs.writeFile("postcss.config.mts", defaultPostcssConfig);
        return;
    }

    const ext = configPath.split(".").pop();

    if (ext === "json" || path.basename(configPath) === ".postcssrc") {
        const config = await fs.readJson(configPath);
        config.plugins ??= {};
        config.plugins["@mochi-css/postcss"] = {};
        await fs.writeJson(configPath, config, { spaces: 2 });
        return;
    }

    if (ext === "yml" || ext === "yaml") {
        throw new Error("YAML PostCSS config is not supported yet");
    }

    // JS/TS config
    const content = await fs.readFile(configPath, "utf-8");

    if (content.includes("@mochi-css/postcss")) {
        return; // Already added
    }

    const isESM = ext === "mjs" || ext === "mts" || content.includes("export default");

    const importStatement = isESM
        ? `import mochiCss from "@mochi-css/postcss";\n`
        : `const mochiCss = require("@mochi-css/postcss");\n`;

    // Add import at the top
    const withImport = importStatement + content;

    // Try to add to plugins array
    const pluginsRegex = /plugins\s*:\s*\[/;
    if (pluginsRegex.test(withImport)) {
        const result = withImport.replace(pluginsRegex, "plugins: [\n        mochiCss(),");
        await fs.writeFile(configPath, result);
        return;
    }

    // Try to add to plugins object
    const pluginsObjRegex = /plugins\s*:\s*\{/;
    if (pluginsObjRegex.test(withImport)) {
        const result = withImport.replace(pluginsObjRegex, 'plugins: {\n        "@mochi-css/postcss": {},');
        await fs.writeFile(configPath, result);
        return;
    }

    throw new Error(`Could not find plugins in ${configPath}. Please add @mochi-css/postcss manually.`);
}

async function askForPostcssPath(): Promise<string | false> {
    const defaultConfig = findPostcssConfig() ?? "postcss.config.js";

    const configPath = await p.text({
        message: "Path to PostCSS config",
        placeholder: defaultConfig,
        defaultValue: defaultConfig
    });

    if (p.isCancel(configPath)) return false;

    return configPath;
}

async function resolvePostcss(postcss: boolean | string | undefined): Promise<string | false> {
    if (postcss === false) return false;
    if (typeof postcss === "string") return postcss;
    if (postcss === true) return askForPostcssPath();

    const usePostcss = await p.confirm({
        message: "Do you use PostCSS?"
    });

    if (p.isCancel(usePostcss) || !usePostcss) return false;

    return askForPostcssPath();
}

program
    .name("tsuki")
    .description("Add mochi-css to your project")
    .version(__VERSION__)
    .option("--postcss [config]", "PostCSS integration (true/false/path)", parsePostcss)
    .action(async (options: Options) => {
        p.intro(pc.cyan("Installing Mochi-CSS..."));

        try {
            const postcss = await resolvePostcss(options.postcss);

            if (postcss) {
                await addMochiToPostcss(postcss);
                p.log.success(`Added @mochi-css/postcss to ${postcss}`);
            }

            p.outro(pc.green("Done!"))
        } catch (e) {
            if (e instanceof Error)
                p.outro(pc.red(e.message))
        }
    })

program.parse()
