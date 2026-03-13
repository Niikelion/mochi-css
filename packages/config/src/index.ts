import type { RootEntry, StyleExtractor, OnDiagnostic } from "@mochi-css/builder"
import { createJiti } from "jiti"
import * as path from "path"
import * as fs from "fs"

export type { RootEntry, StyleExtractor, OnDiagnostic }

export type EsbuildBuild = {
    onLoad(
        options: { filter: RegExp; namespace?: string },
        callback: (args: unknown) => unknown,
    ): void
    onResolve(
        options: { filter: RegExp; namespace?: string },
        callback: (args: unknown) => unknown,
    ): void
}

export type EsbuildPlugin = {
    name: string
    setup(build: EsbuildBuild): void | Promise<void>
}

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
}

export type ResolvedConfig = {
    roots: RootEntry[]
    extractors: StyleExtractor[]
    splitBySource: boolean
    onDiagnostic?: OnDiagnostic
    esbuildPlugins: EsbuildPlugin[]
    plugins: MochiPlugin[]
}

export function defineConfig(config: MochiConfig): MochiConfig {
    return config
}

const CONFIG_FILE_NAMES = [
    "mochi.config.ts",
    "mochi.config.mts",
    "mochi.config.js",
    "mochi.config.mjs",
]

export async function loadConfig(cwd?: string): Promise<MochiConfig> {
    const dir = cwd ?? process.cwd()
    const configFile = CONFIG_FILE_NAMES.map(name => path.resolve(dir, name)).find(p =>
        fs.existsSync(p),
    )

    if (!configFile) {
        return {}
    }

    const jiti = createJiti(import.meta.url)
    const mod = await jiti.import(configFile)
    const config =
        mod != null && typeof mod === "object" && "default" in mod
            ? (mod as { default: unknown }).default
            : mod

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
    let resolved: ResolvedConfig = {
        roots: inlineOpts?.roots ?? fileConfig.roots ?? defaults?.roots ?? [],
        extractors: inlineOpts?.extractors ?? fileConfig.extractors ?? defaults?.extractors ?? [],
        splitBySource:
            inlineOpts?.splitBySource ??
            fileConfig.splitBySource ??
            defaults?.splitBySource ??
            false,
        onDiagnostic:
            inlineOpts?.onDiagnostic ?? fileConfig.onDiagnostic ?? defaults?.onDiagnostic,
        esbuildPlugins: [
            ...(defaults?.esbuildPlugins ?? []),
            ...(fileConfig.esbuildPlugins ?? []),
            ...(inlineOpts?.esbuildPlugins ?? []),
        ],
        plugins: [
            ...(defaults?.plugins ?? []),
            ...(fileConfig.plugins ?? []),
            ...(inlineOpts?.plugins ?? []),
        ],
    }

    for (const plugin of resolved.plugins) {
        resolved = (await plugin.onConfigResolved?.(resolved)) ?? resolved
    }

    return resolved
}
