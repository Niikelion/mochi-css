import { OnDiagnostic, RootEntry, StyleExtractor } from "@mochi-css/builder"
import { makePipeline, Plugin } from "@/plugin"
import { mergeArrays, mergeCallbacks } from "@/merge"
import path from "path"
import fs from "fs"
import { createJiti } from "jiti"

export interface Config {
    roots: RootEntry[]
    extractors: StyleExtractor[]
    splitCss: boolean
    onDiagnostic?: OnDiagnostic
    plugins: Plugin<Config>[]
    tmpDir?: string
}

export type MochiPlugin = Plugin<Config>

export function defineConfig(config: Partial<Config>): Partial<Config> {
    return config
}

export async function resolveConfig(
    fileConfig: Partial<Config>,
    inlineConfig?: Partial<Config>,
    defaults?: Partial<Config>,
): Promise<Config> {
    const plugins: MochiPlugin[] = mergeArrays(fileConfig.plugins, inlineConfig?.plugins) ?? defaults?.plugins ?? []

    const resolved: Config = {
        roots: mergeArrays(fileConfig.roots, inlineConfig?.roots) ?? defaults?.roots ?? [],
        extractors: mergeArrays(fileConfig.extractors, inlineConfig?.extractors) ?? defaults?.extractors ?? [],
        splitCss: inlineConfig?.splitCss ?? fileConfig.splitCss ?? defaults?.splitCss ?? false,
        onDiagnostic: mergeCallbacks(fileConfig.onDiagnostic, inlineConfig?.onDiagnostic),
        plugins,
    }

    return await makePipeline(
        plugins.map((plugin) => plugin.onConfigResolved).filter((c) => c !== undefined),
    ).transform(resolved)
}

const configName = "mochi.config"
const extensions = ["mts", "cts", "ts", "mjs", "cjs", "js"]

const CONFIG_FILE_NAMES = extensions.map((ext: string) => `${configName}.${ext}`)

export async function loadConfig(cwd?: string): Promise<Partial<Config>> {
    const dir = cwd ?? process.cwd()
    const configFile = CONFIG_FILE_NAMES.map((name) => path.resolve(dir, name)).find((p) => fs.existsSync(p))

    if (!configFile) {
        return {}
    }

    const jiti = createJiti(import.meta.url)
    const mod = await jiti.import(configFile)
    const config =
        mod != null && typeof mod === "object" && "default" in mod ? (mod as { default: unknown }).default : mod

    if (config == null || typeof config !== "object") {
        return {}
    }

    return config as Config
}
