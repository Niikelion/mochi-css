import type { RootEntry, StyleExtractor, OnDiagnostic, EsbuildBuild, EsbuildPlugin } from "@mochi-css/builder"
import { createJiti } from "jiti"
import * as path from "path"
import * as fs from "fs"

export type { RootEntry, StyleExtractor, OnDiagnostic, EsbuildBuild, EsbuildPlugin }

export interface MochiPlugin {
    name: string
    onConfigResolved?: (config: ResolvedConfig) => Promise<ResolvedConfig> | ResolvedConfig
}

export type MochiConfig = {
    roots?: RootEntry[]
    extractors?: StyleExtractor[]
    splitBySource?: boolean
    onDiagnostic?: OnDiagnostic
    esbuildPlugins?: EsbuildPlugin[]
    plugins?: MochiPlugin[]
    outDir?: string
}

export type ResolvedConfig = {
    roots: RootEntry[]
    extractors: StyleExtractor[]
    splitBySource: boolean
    onDiagnostic?: OnDiagnostic
    esbuildPlugins: EsbuildPlugin[]
    outDir?: string
}

export { mergeArrays, mergeCallbacks } from "./merge"
import { mergeArrays, mergeCallbacks } from "./merge"

export function defineConfig(config: MochiConfig): MochiConfig {
    return config
}

const configName = "mochi.config"
const extensions = ["mts", "cts", "ts", "mjs", "cjs", "js"]

const CONFIG_FILE_NAMES = extensions.map((ext: string) => `${configName}.${ext}`)

export async function loadConfig(cwd?: string): Promise<MochiConfig> {
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

    return config as MochiConfig
}

export async function resolveConfig(
    fileConfig: MochiConfig,
    inlineOpts?: MochiConfig,
    defaults?: Partial<ResolvedConfig>,
): Promise<ResolvedConfig> {
    const plugins: MochiPlugin[] = [...(fileConfig.plugins ?? []), ...(inlineOpts?.plugins ?? [])]

    const merged = {
        roots: mergeArrays(fileConfig.roots, inlineOpts?.roots),
        extractors: mergeArrays(fileConfig.extractors, inlineOpts?.extractors),
        splitBySource: inlineOpts?.splitBySource ?? fileConfig.splitBySource,
        onDiagnostic: mergeCallbacks(fileConfig.onDiagnostic, inlineOpts?.onDiagnostic),
        esbuildPlugins: mergeArrays(fileConfig.esbuildPlugins, inlineOpts?.esbuildPlugins),
    }

    let resolved: ResolvedConfig = {
        roots: merged.roots ?? defaults?.roots ?? [],
        extractors: merged.extractors ?? defaults?.extractors ?? [],
        splitBySource: merged.splitBySource ?? defaults?.splitBySource ?? false,
        onDiagnostic: merged.onDiagnostic ?? defaults?.onDiagnostic,
        esbuildPlugins: merged.esbuildPlugins ?? defaults?.esbuildPlugins ?? [],
        outDir: inlineOpts?.outDir ?? fileConfig.outDir ?? defaults?.outDir,
    }

    for (const plugin of plugins) {
        resolved = (await plugin.onConfigResolved?.(resolved)) ?? resolved
    }

    return resolved
}
