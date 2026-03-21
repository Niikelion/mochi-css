import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockTransform, mockLoadConfig, mockCollectMochiCss } = vi.hoisted(() => ({
    mockTransform: vi.fn(async (source: string, _opts: { filePath: string }) => source),
    mockLoadConfig: vi.fn(async () => ({})),
    mockCollectMochiCss: vi.fn(async (): Promise<{ files: Record<string, string>; global: string | undefined }> => ({ files: {}, global: undefined })),
}))

vi.mock("@mochi-css/config", () => ({
    loadConfig: mockLoadConfig,
    resolveConfig: vi.fn(async (_file: unknown, _opts: unknown, defaults: unknown) => ({
        plugins: [],
        roots: ["src"],
        extractors: [],
        splitCss: true,
        onDiagnostic: undefined,
        ...(defaults as object),
    })),
    FullContext: class {
        sourceTransform = {
            transform: (source: string, opts: { filePath: string }) => mockTransform(source, opts),
        }
    },
}))

vi.mock("@mochi-css/builder", () => ({
    Builder: class {
        collectMochiCss() {
            return mockCollectMochiCss()
        }
    },
    defaultExtractors: [],
    RolldownBundler: class {},
    VmRunner: class {},
    fileHash: (id: string) => id.split("/").pop()?.replace(/\.[^.]+$/, "") ?? id,
}))

import { mochiCss } from "./index.js"
import type { Plugin } from "vite"

type PluginHooks = {
    configResolved: (cfg: { root: string }) => Promise<void>
    buildStart: () => Promise<void>
    transform: (code: string, id: string) => Promise<{ code: string; map: null } | undefined>
    resolveId: (id: string) => string | undefined
    load: (id: string) => string | undefined
}

function getHooks(plugin: Plugin): PluginHooks {
    return plugin as unknown as PluginHooks
}

describe("mochiCss vite plugin transform", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockLoadConfig.mockResolvedValue({})
        mockCollectMochiCss.mockResolvedValue({ files: {}, global: undefined })
        mockTransform.mockImplementation(async (source: string, _opts: { filePath: string }) => source)
    })

    async function setupPlugin(manifestOverride?: { files: Record<string, string>; global: string | undefined }) {
        const plugin = mochiCss()
        const hooks = getHooks(plugin)

        if (manifestOverride) {
            mockCollectMochiCss.mockResolvedValue(manifestOverride)
        }

        await hooks.configResolved({ root: "/project" })
        await hooks.buildStart()

        return hooks
    }

    it("applies source transform to source files", async () => {
        mockTransform.mockImplementation(async (source: string) => source + "\n//transformed")
        const hooks = await setupPlugin()

        const result = await hooks.transform("const x = 1", "/src/App.tsx")
        expect(result).not.toBeUndefined()
        expect(result?.code).toContain("//transformed")
    })

    it("passes source through unchanged when code is unmodified and file has no CSS", async () => {
        // mockTransform returns source unchanged (default)
        const hooks = await setupPlugin()

        const result = await hooks.transform("const x = 1", "/src/App.tsx")
        expect(result).toBeUndefined()
    })

    it("injects CSS import alongside source transform", async () => {
        mockTransform.mockImplementation(async (source: string) => source + "\n//transformed")
        const hooks = await setupPlugin({
            files: { "/src/App.tsx": ".s-abc { color: red; }" },
            global: undefined,
        })

        const result = await hooks.transform("const x = 1", "/src/App.tsx")
        expect(result).not.toBeUndefined()
        expect(result?.code).toContain("//transformed")
        expect(result?.code).toContain("virtual:mochi-css/")
        expect(result?.code).toContain(".css")
    })

    it("does not transform non-source files", async () => {
        mockTransform.mockImplementation(async (source: string) => source + "\n//transformed")
        const hooks = await setupPlugin()

        const result = await hooks.transform("body { color: red; }", "/src/styles.css")
        expect(result).toBeUndefined()
    })

    it("injects global CSS import when manifest has global styles", async () => {
        mockTransform.mockImplementation(async (source: string) => source + "\n//transformed")
        const hooks = await setupPlugin({
            files: { "/src/App.tsx": ".s-abc { color: red; }" },
            global: ".global { box-sizing: border-box; }",
        })

        const result = await hooks.transform("const x = 1", "/src/App.tsx")
        expect(result).not.toBeUndefined()
        expect(result?.code).toContain("virtual:mochi-css/global.css")
    })

    it("resolveId returns resolved id for virtual modules", async () => {
        const hooks = await setupPlugin()

        expect(hooks.resolveId("virtual:mochi-css/global.css")).toBe("\0virtual:mochi-css/global.css")
        expect(hooks.resolveId("virtual:mochi-css/abc123.css")).toBe("\0virtual:mochi-css/abc123.css")
        expect(hooks.resolveId("some-other-module")).toBeUndefined()
    })

    it("load returns global CSS for global virtual module", async () => {
        const hooks = await setupPlugin({
            files: {},
            global: ".global { color: blue; }",
        })

        const result = hooks.load("\0virtual:mochi-css/global.css")
        expect(result).toBe(".global { color: blue; }")
    })

    it("load returns per-file CSS for hashed virtual module", async () => {
        mockCollectMochiCss.mockResolvedValue({
            files: { "/src/App.tsx": ".s-abc { color: red; }" },
            global: undefined,
        })
        const hooks = await setupPlugin()

        // The hash is computed by fileHash — mocked as basename without extension
        const result = hooks.load("\0virtual:mochi-css/App.css")
        expect(result).toBe(".s-abc { color: red; }")
    })

    it("load returns undefined when manifest is not ready", async () => {
        const plugin = mochiCss()
        const hooks = getHooks(plugin)
        // configResolved but NOT buildStart — manifest stays undefined

        const result = hooks.load("\0virtual:mochi-css/global.css")
        expect(result).toBeUndefined()
    })

    it("skips transform when context not yet initialized", async () => {
        // Don't call buildStart — context stays undefined
        mockCollectMochiCss.mockResolvedValue({
            files: { "/src/App.tsx": ".s-abc { color: red; }" },
            global: undefined,
        })

        const plugin = mochiCss()
        const hooks = getHooks(plugin)
        await hooks.configResolved({ root: "/project" })
        // buildStart NOT called — context is undefined

        mockTransform.mockImplementation(async (source: string) => source + "\n//transformed")

        // File has CSS in manifest but manifest is also not set since buildStart wasn't called
        const result = await hooks.transform("const x = 1", "/src/App.tsx")
        // No manifest, no context → undefined (passthrough, code unchanged)
        expect(result).toBeUndefined()
    })
})
