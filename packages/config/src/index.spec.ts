import { describe, it, expect, vi, beforeEach } from "vitest"
import * as fs from "fs"
import { defineConfig, loadConfig, resolveConfig } from "./index"
import type { MochiConfig, ResolvedConfig, MochiPlugin } from "./index"

vi.mock("fs")
vi.mock("jiti", () => ({
    createJiti: vi.fn(),
}))

describe("defineConfig", () => {
    it("returns config unchanged", () => {
        const config: MochiConfig = { roots: ["src"], splitBySource: true }
        expect(defineConfig(config)).toBe(config)
    })
})

describe("loadConfig", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("returns {} when no config file found", async () => {
        vi.mocked(fs.existsSync).mockReturnValue(false)
        const result = await loadConfig("/some/project")
        expect(result).toEqual({})
    })

    it("loads a config file and returns its default export", async () => {
        vi.mocked(fs.existsSync).mockImplementation((p) =>
            String(p).endsWith("mochi.config.ts"),
        )
        const mockConfig: MochiConfig = { roots: ["app"], splitBySource: true }
        const { createJiti } = await import("jiti")
        vi.mocked(createJiti).mockReturnValue({
            import: vi.fn().mockResolvedValue({ default: mockConfig }),
        } as unknown as ReturnType<typeof createJiti>)

        const result = await loadConfig("/some/project")
        expect(result).toBe(mockConfig)
    })

    it("returns {} when config module default export is not an object", async () => {
        vi.mocked(fs.existsSync).mockImplementation((p) =>
            String(p).endsWith("mochi.config.ts"),
        )
        const { createJiti } = await import("jiti")
        vi.mocked(createJiti).mockReturnValue({
            import: vi.fn().mockResolvedValue({ default: null }),
        } as unknown as ReturnType<typeof createJiti>)

        const result = await loadConfig("/some/project")
        expect(result).toEqual({})
    })
})

describe("resolveConfig", () => {
    it("fills in defaults when file config is empty", async () => {
        const result = await resolveConfig(
            {},
            undefined,
            { roots: ["src"], extractors: [], splitBySource: true, esbuildPlugins: [], plugins: [] },
        )
        expect(result.roots).toEqual(["src"])
        expect(result.splitBySource).toBe(true)
        expect(result.esbuildPlugins).toEqual([])
        expect(result.plugins).toEqual([])
    })

    it("gives inline opts priority over file config", async () => {
        const fileConfig: MochiConfig = { roots: ["lib"], splitBySource: false }
        const inlineOpts: MochiConfig = { roots: ["app"], splitBySource: true }
        const result = await resolveConfig(fileConfig, inlineOpts)
        expect(result.roots).toEqual(["app"])
        expect(result.splitBySource).toBe(true)
    })

    it("gives file config priority over defaults", async () => {
        const fileConfig: MochiConfig = { roots: ["lib"] }
        const result = await resolveConfig(fileConfig, undefined, { roots: ["src"] })
        expect(result.roots).toEqual(["lib"])
    })

    it("merges esbuildPlugins as defaults + fileConfig + inlineOpts", async () => {
        const pluginA = { name: "a", setup: vi.fn() }
        const pluginB = { name: "b", setup: vi.fn() }
        const pluginC = { name: "c", setup: vi.fn() }
        const result = await resolveConfig(
            { esbuildPlugins: [pluginB] },
            { esbuildPlugins: [pluginC] },
            { esbuildPlugins: [pluginA] },
        )
        expect(result.esbuildPlugins).toEqual([pluginA, pluginB, pluginC])
    })

    it("runs onConfigResolved hooks sequentially, passing updated config to each", async () => {
        const calls: string[] = []
        const plugin1: MochiPlugin = {
            name: "plugin1",
            onConfigResolved(config) {
                calls.push("plugin1")
                return { ...config, roots: ["from-plugin1"] }
            },
        }
        const plugin2: MochiPlugin = {
            name: "plugin2",
            onConfigResolved(config) {
                calls.push(`plugin2:${JSON.stringify(config.roots)}`)
                return { ...config, roots: ["from-plugin2"] }
            },
        }
        const fileConfig: MochiConfig = { plugins: [plugin1, plugin2] }
        const result = await resolveConfig(fileConfig)
        expect(calls).toEqual(["plugin1", 'plugin2:["from-plugin1"]'])
        expect(result.roots).toEqual(["from-plugin2"])
    })

    it("uses default values when all sources are empty", async () => {
        const result = await resolveConfig({})
        expect(result.roots).toEqual([])
        expect(result.extractors).toEqual([])
        expect(result.splitBySource).toBe(false)
        expect(result.onDiagnostic).toBeUndefined()
        expect(result.esbuildPlugins).toEqual([])
        expect(result.plugins).toEqual([])
    })
})
