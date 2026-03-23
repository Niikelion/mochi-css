import path from "path"
import { NextConfig } from "next"
import { startCssWatcher } from "./watcher.js"

const MOCHI_DIR = ".mochi"
const MANIFEST_FILE = "manifest.json"

export type MochiNextOptions = {
    /**
     * Path to the `manifest.json` file produced by the PostCSS plugin's `tmpDir` option.
     * The webpack/Turbopack loader reads this file to inject per-route CSS imports.
     * Defaults to `.mochi/manifest.json` relative to the project root.
     */
    manifestPath?: string
}

/**
 * Wraps your Next.js config with Mochi CSS loaders.
 *
 * The loader automatically reads `mochi.config.ts` from the project root and applies
 * any registered source transforms (e.g. `styledIdPlugin`) before Next.js compiles each file.
 *
 * Turbopack support requires you to explicitly opt in via your config:
 * - Next.js 15.3+ / 16: add `turbopack: {}` to your next.config
 * - Next.js 14 / 15.0–15.2: add `experimental: { turbo: {} }` to your next.config
 */
export function withMochi(nextConfig: NextConfig, opts?: MochiNextOptions): NextConfig {
    const manifestPath = opts?.manifestPath ?? path.resolve(MOCHI_DIR, MANIFEST_FILE)

    if (process.env["NODE_ENV"] !== "production") {
        const tmpDir = path.dirname(manifestPath)
        startCssWatcher(tmpDir).catch(err => {
            console.error("[mochi-css] watcher error:", err instanceof Error ? err.message : err)
        })
    }
    const loaderPath = require.resolve("@mochi-css/next/loader")

    const loaderRule = {
        test: /\.(ts|tsx|js|jsx)$/,
        use: [
            {
                loader: loaderPath,
                options: { manifestPath, cwd: process.cwd() },
            },
        ],
    }

    const turbopackRule = {
        loaders: [{ loader: loaderPath, options: { manifestPath, cwd: process.cwd() } }],
    }

    // Next.js 15.3+ / 16: top-level turbopack key (only if user already has it)
    const existingTurbopack = nextConfig["turbopack"] as Record<string, unknown> | undefined
    const turbopackPatch = existingTurbopack
        ? (() => {
              const rules = (existingTurbopack["rules"] as Record<string, unknown>) ?? {}
              rules["*.{ts,tsx,js,jsx}"] = turbopackRule
              return { ...existingTurbopack, rules }
          })()
        : undefined

    // Next.js 14 / 15.0–15.2: experimental.turbo key (only if user already has it)
    const existingExperimental = nextConfig["experimental"] as Record<string, unknown> | undefined
    const existingExpTurbo = existingExperimental?.["turbo"] as Record<string, unknown> | undefined
    const experimentalPatch = existingExpTurbo
        ? (() => {
              const rules = (existingExpTurbo["rules"] as Record<string, unknown>) ?? {}
              rules["*.{ts,tsx,js,jsx}"] = turbopackRule
              return {
                  ...existingExperimental,
                  turbo: { ...existingExpTurbo, rules },
              }
          })()
        : undefined

    // Configure webpack
    const existingWebpack = nextConfig["webpack"] as
        | ((config: Record<string, unknown>, context: unknown) => Record<string, unknown>)
        | undefined

    return {
        ...nextConfig,
        ...(turbopackPatch !== undefined && { turbopack: turbopackPatch as NextConfig["turbopack"] }),
        ...(experimentalPatch !== undefined && {
            experimental: experimentalPatch as NextConfig["experimental"],
        }),
        webpack(config: Record<string, unknown>, context: unknown) {
            const result = existingWebpack ? existingWebpack(config, context) : config
            const mod = result["module"] as { rules?: unknown[] } | undefined
            if (mod) {
                mod.rules ??= []
                mod.rules.push(loaderRule)
            } else {
                result["module"] = { rules: [loaderRule] }
            }
            return result
        },
    }
}
