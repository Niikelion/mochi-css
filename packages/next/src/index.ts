import path from "path"
import { NextConfig } from "next"

const MOCHI_DIR = ".mochi"
const MANIFEST_FILE = "manifest.json"

export type MochiNextOptions = {
    manifestPath?: string
}

export function withMochi(
    nextConfig: NextConfig,
    opts?: MochiNextOptions,
): NextConfig {
    const manifestPath = opts?.manifestPath ?? path.resolve(MOCHI_DIR, MANIFEST_FILE)
    const loaderPath = require.resolve("@mochi-css/next/loader")

    const loaderRule = {
        test: /\.(ts|tsx|js|jsx)$/,
        use: [
            {
                loader: loaderPath,
                options: { manifestPath },
            },
        ],
    }

    // Configure Turbopack rules
    const turbopack = (nextConfig["turbopack"] as Record<string, unknown>) ?? {}
    const turboRules = (turbopack["rules"] as Record<string, unknown>) ?? {}
    turboRules["*.{ts,tsx,js,jsx}"] = {
        loaders: [{ loader: loaderPath, options: { manifestPath } }],
    }
    turbopack["rules"] = turboRules

    // Configure webpack
    const existingWebpack = nextConfig["webpack"] as
        | ((config: Record<string, unknown>, context: unknown) => Record<string, unknown>)
        | undefined

    return {
        ...nextConfig,
        turbopack,
        webpack(config: Record<string, unknown>, context: unknown) {
            const moduleConfig = config["module"] as { rules?: unknown[] } | undefined
            if (moduleConfig?.rules) {
                moduleConfig.rules.push(loaderRule)
            }
            if (existingWebpack) {
                return existingWebpack(config, context)
            }
            return config
        },
    }
}
