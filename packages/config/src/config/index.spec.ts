import { describe, it, expect, vi, beforeEach } from "vitest"
import * as fs from "fs"
import { defineConfig, loadConfig, resolveConfig } from "./index"
import type { Config, MochiPlugin } from "./index"

vi.mock("fs")
vi.mock("jiti", () => ({
    createJiti: vi.fn(),
}))

describe("defineConfig", () => {
    it("returns config unchanged", () => {
        const config: Partial<Config> = { roots: ["src"], splitCss: true }
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
        vi.mocked(fs.existsSync).mockImplementation((p) => String(p).endsWith("mochi.config.ts"))
        const mockConfig: Partial<Config> = { roots: ["app"], splitCss: true }
        const { createJiti } = await import("jiti")
        vi.mocked(createJiti).mockReturnValue({
            import: vi.fn().mockResolvedValue({ default: mockConfig }),
        } as unknown as ReturnType<typeof createJiti>)

        const result = await loadConfig("/some/project")
        expect(result).toBe(mockConfig)
    })

    it("returns {} when config module default export is not an object", async () => {
        vi.mocked(fs.existsSync).mockImplementation((p) => String(p).endsWith("mochi.config.ts"))
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
        const result = await resolveConfig({}, undefined, {
            roots: ["src"],
            extractors: [],
            splitCss: true,
        })
        expect(result.roots).toEqual(["src"])
        expect(result.splitCss).toBe(true)
    })

    it("merges roots from fileConfig and inlineOpts, overriding defaults", async () => {
        const fileConfig: Partial<Config> = { roots: ["lib"], splitCss: false }
        const inlineOpts: Partial<Config> = { roots: ["app"], splitCss: true }
        const result = await resolveConfig(fileConfig, inlineOpts)
        expect(result.roots).toEqual(["lib", "app"])
        expect(result.splitCss).toBe(true)
    })

    it("falls back to defaults roots when neither fileConfig nor inlineOpts provide any", async () => {
        const result = await resolveConfig({}, undefined, { roots: ["src"] })
        expect(result.roots).toEqual(["src"])
    })

    it("merges plugins from fileConfig and inlineOpts, overriding defaults", async () => {
        const pluginA: MochiPlugin = { name: "a" }
        const pluginB: MochiPlugin = { name: "b" }
        const pluginC: MochiPlugin = { name: "c" }
        const result = await resolveConfig({ plugins: [pluginB] }, { plugins: [pluginC] }, { plugins: [pluginA] })
        expect(result.plugins).toEqual([pluginB, pluginC])
    })

    it("falls back to defaults plugins when neither fileConfig nor inlineOpts provide any", async () => {
        const pluginA: MochiPlugin = { name: "a" }
        const result = await resolveConfig({}, undefined, { plugins: [pluginA] })
        expect(result.plugins).toEqual([pluginA])
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
        const result = await resolveConfig({ plugins: [plugin1, plugin2] })
        expect(calls).toEqual(["plugin1", 'plugin2:["from-plugin1"]'])
        expect(result.roots).toEqual(["from-plugin2"])
    })

    it("uses default values when all sources are empty", async () => {
        const result = await resolveConfig({})
        expect(result.roots).toEqual([])
        expect(result.extractors).toEqual([])
        expect(result.splitCss).toBe(false)
        expect(result.onDiagnostic).toBeUndefined()
        expect(result.plugins).toEqual([])
    })
})
