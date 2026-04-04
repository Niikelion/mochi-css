import { describe, it, expect, vi, beforeEach } from "vitest"
import { type NextConfig } from "next"

vi.mock("@mochi-css/next/loader", () => ({}))
vi.mock("./watcher.js", () => ({
    startCssWatcher: vi.fn().mockResolvedValue(undefined),
    buildCssOnce: vi.fn().mockResolvedValue(undefined),
}))

// Stub require.resolve before importing the module under test
const LOADER_PATH = "/mock/loader.js"
vi.stubGlobal("require", {
    resolve: (_id: string) => LOADER_PATH,
})

// Import after mocking
const { withMochi } = await import("./index.js")

describe("withMochi", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    // ─── Turbopack (Next.js 15.3+ / 16) ───────────────────────────────────────

    describe("turbopack (top-level key)", () => {
        it("injects rule when turbopack key is present", () => {
            const result = withMochi({ turbopack: {} })
            expect(result.turbopack).toBeDefined()
            const rules = (result.turbopack as Record<string, unknown>)["rules"] as Record<
                string,
                unknown
            >
            expect(rules).toBeDefined()
            expect(rules["*.{ts,tsx,js,jsx}"]).toBeDefined()
        })

        it("does NOT add turbopack key when absent", () => {
            const result = withMochi({})
            expect(result.turbopack).toBeUndefined()
        })

        it("preserves existing turbopack config", () => {
            const result = withMochi({
                turbopack: { resolveAlias: { foo: "bar" } },
            })
            const tp = result.turbopack as Record<string, unknown>
            expect(tp["resolveAlias"]).toEqual({ foo: "bar" })
        })

        it("preserves existing turbopack rules", () => {
            const result = withMochi({
                turbopack: {
                    rules: { "*.svg": { loaders: [{ loader: "svg-loader" }] } } as never,
                },
            })
            const rules = (result.turbopack as Record<string, unknown>)["rules"] as Record<
                string,
                unknown
            >
            expect(rules["*.svg"]).toBeDefined()
            expect(rules["*.{ts,tsx,js,jsx}"]).toBeDefined()
        })
    })

    // ─── Turbopack (Next.js 14 / 15.0–15.2) ──────────────────────────────────

    describe("experimental.turbo key", () => {
        it("injects rule when experimental.turbo is present", () => {
            const result = withMochi({
                experimental: { turbo: {} } as unknown as NextConfig["experimental"],
            })
            const expTurbo = (result.experimental as Record<string, unknown>)["turbo"] as Record<
                string,
                unknown
            >
            expect(expTurbo).toBeDefined()
            const rules = expTurbo["rules"] as Record<string, unknown>
            expect(rules).toBeDefined()
            expect(rules["*.{ts,tsx,js,jsx}"]).toBeDefined()
        })

        it("does NOT add experimental.turbo when absent", () => {
            const result = withMochi({
                experimental: { appDir: true } as unknown as NextConfig["experimental"],
            })
            const exp = result.experimental as Record<string, unknown>
            expect(exp["turbo"]).toBeUndefined()
        })

        it("does NOT add experimental key when completely absent", () => {
            const result = withMochi({})
            expect(result.experimental).toBeUndefined()
        })

        it("preserves existing experimental config", () => {
            const result = withMochi({
                experimental: { appDir: true, turbo: {} } as unknown as NextConfig["experimental"],
            })
            const exp = result.experimental as Record<string, unknown>
            expect(exp["appDir"]).toBe(true)
        })

        it("preserves existing experimental.turbo config", () => {
            const result = withMochi({
                experimental: {
                    turbo: { resolveAlias: { foo: "bar" } },
                } as unknown as NextConfig["experimental"],
            })
            const expTurbo = (result.experimental as Record<string, unknown>)["turbo"] as Record<
                string,
                unknown
            >
            expect(expTurbo["resolveAlias"]).toEqual({ foo: "bar" })
        })
    })

    // ─── Webpack ──────────────────────────────────────────────────────────────

    describe("webpack", () => {
        it("adds mochi loader rule to module.rules", () => {
            const result = withMochi({})
            const webpackFn = result["webpack"] as (
                config: Record<string, unknown>,
                context: unknown,
            ) => Record<string, unknown>
            const config = { module: { rules: [] } }
            const out = webpackFn(config, {})
            const rules = (out["module"] as { rules: unknown[] }).rules
            expect(rules).toHaveLength(1)
            expect(rules[0]).toMatchObject({ test: /\.(ts|tsx|js|jsx)$/ })
        })

        it("adds mochi rule even when existingWebpack returns a new config object", () => {
            const newConfig = { module: { rules: [] } }
            const result = withMochi({
                webpack: () => newConfig,
            })
            const webpackFn = result["webpack"] as (
                config: Record<string, unknown>,
                context: unknown,
            ) => Record<string, unknown>
            const out = webpackFn({}, {})
            const rules = (out["module"] as { rules: unknown[] }).rules
            expect(rules).toHaveLength(1)
        })

        it("initializes module.rules when config.module is absent", () => {
            const result = withMochi({})
            const webpackFn = result["webpack"] as (
                config: Record<string, unknown>,
                context: unknown,
            ) => Record<string, unknown>
            const out = webpackFn({}, {})
            const rules = (out["module"] as { rules: unknown[] }).rules
            expect(rules).toHaveLength(1)
        })

        it("calls existingWebpack before adding mochi rule", () => {
            const calls: string[] = []
            const result = withMochi({
                webpack: (config: Record<string, unknown>) => {
                    calls.push("existing")
                    return { ...config, module: { rules: [] } }
                },
            })
            const webpackFn = result["webpack"] as (
                config: Record<string, unknown>,
                context: unknown,
            ) => Record<string, unknown>
            const out = webpackFn({}, {})
            expect(calls).toEqual(["existing"])
            const rules = (out["module"] as { rules: unknown[] }).rules
            expect(rules).toHaveLength(1)
        })
    })

    // ─── Production beforeRun plugin ─────────────────────────────────────────

    describe("production webpack beforeRun plugin", () => {
        it("adds a beforeRun plugin when NODE_ENV is production", async () => {
            vi.stubEnv("NODE_ENV", "production")
            vi.resetModules()
            const { withMochi: withMochiProd } = await import("./index.js")

            const result = withMochiProd({})
            const webpackFn = result["webpack"] as (
                config: Record<string, unknown>,
                context: unknown,
            ) => Record<string, unknown>
            const out = webpackFn({ module: { rules: [] }, plugins: [] }, {})
            const plugins = out["plugins"] as { apply: (compiler: unknown) => void }[]
            expect(plugins.length).toBeGreaterThan(0)

            const tapPromise = vi.fn()
            const mockCompiler = { hooks: { beforeRun: { tapPromise } } }
            plugins[0]!.apply(mockCompiler)
            expect(tapPromise).toHaveBeenCalledWith("mochi-css", expect.any(Function))

            vi.unstubAllEnvs()
        })

        it("does not add a beforeRun plugin when NODE_ENV is not production", () => {
            const result = withMochi({})
            const webpackFn = result["webpack"] as (
                config: Record<string, unknown>,
                context: unknown,
            ) => Record<string, unknown>
            const out = webpackFn({ module: { rules: [] }, plugins: [] }, {})
            const plugins = out["plugins"] as unknown[]
            expect(plugins).toHaveLength(0)
        })
    })
})
