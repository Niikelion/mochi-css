import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockTransform, mockLoadConfig, mockExistsSync, mockReadFileSync } = vi.hoisted(() => ({
    mockTransform: vi.fn(async (source: string, _opts: { filePath: string }) => source),
    mockLoadConfig: vi.fn(async () => ({})),
    mockExistsSync: vi.fn((_p: string) => false),
    mockReadFileSync: vi.fn((_p: string, _enc: string) => "{}"),
}))

vi.mock("@mochi-css/config", () => ({
    loadConfig: mockLoadConfig,
    FullContext: class {
        sourceTransform = {
            transform: (source: string, opts: { filePath: string }) => mockTransform(source, opts),
        }
    },
}))

vi.mock("fs", () => ({
    default: {
        existsSync: (p: string) => mockExistsSync(p),
        readFileSync: (p: string, enc: string) => mockReadFileSync(p, enc),
    },
}))

import mochiLoader, { resetContext } from "./loader.js"

function makeCtx(overrides?: {
    resourcePath?: string
    manifestPath?: string
    cwd?: string
}) {
    const callback = vi.fn()
    const ctx = {
        resourcePath: overrides?.resourcePath ?? "/project/src/App.tsx",
        getOptions: () => ({
            manifestPath: overrides?.manifestPath ?? "/project/.mochi/manifest.json",
            cwd: overrides?.cwd,
        }),
        addDependency: vi.fn(),
        async: () => callback,
    }
    return { ctx, callback }
}

describe("mochiLoader", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        resetContext()
        mockLoadConfig.mockResolvedValue({})
        mockTransform.mockImplementation(async (source: string, _opts: { filePath: string }) => source)
        mockExistsSync.mockReturnValue(false)
    })

    it("passes source through unchanged when no plugins", async () => {
        const { ctx, callback } = makeCtx()
        mochiLoader.call(ctx, "const x = 1")

        await vi.waitUntil(() => callback.mock.calls.length > 0)
        expect(callback).toHaveBeenCalledWith(null, "const x = 1")
    })

    it("applies source transform from plugin", async () => {
        mockTransform.mockImplementation(async (source: string, _opts: { filePath: string }) => source + "\n//transformed")

        const { ctx, callback } = makeCtx()
        mochiLoader.call(ctx, "const x = 1")

        await vi.waitUntil(() => callback.mock.calls.length > 0)
        expect(callback).toHaveBeenCalledWith(null, "const x = 1\n//transformed")
    })

    it("injects CSS import after transform", async () => {
        const manifestPath = "/project/.mochi/manifest.json"
        const resourcePath = "/project/src/App.tsx"

        mockExistsSync.mockReturnValue(true)
        mockReadFileSync.mockReturnValue(
            JSON.stringify({ files: { [resourcePath]: "/project/.mochi/abc123.css" } }),
        )
        mockTransform.mockImplementation(async (source: string, _opts: { filePath: string }) => source + "\n//transformed")

        const { ctx, callback } = makeCtx({ resourcePath, manifestPath })
        mochiLoader.call(ctx, "const x = 1")

        await vi.waitUntil(() => callback.mock.calls.length > 0)
        const result = callback.mock.calls[0]?.[1] as string
        expect(result).toContain("//transformed")
        expect(result).toContain("abc123.css")
    })

    it("injects global CSS import when manifest has global styles", async () => {
        const manifestPath = "/project/.mochi/manifest.json"
        const resourcePath = "/project/src/App.tsx"

        mockExistsSync.mockReturnValue(true)
        mockReadFileSync.mockReturnValue(
            JSON.stringify({
                files: { [resourcePath]: "/project/.mochi/abc123.css" },
                global: "/project/.mochi/global.css",
            }),
        )

        const { ctx, callback } = makeCtx({ resourcePath, manifestPath })
        mochiLoader.call(ctx, "const x = 1")

        await vi.waitUntil(() => callback.mock.calls.length > 0)
        const result = callback.mock.calls[0]?.[1] as string
        expect(result).toContain("abc123.css")
        expect(result).toContain("global.css")
    })

    it("tracks manifest and CSS file as webpack dependencies", async () => {
        const manifestPath = "/project/.mochi/manifest.json"
        const resourcePath = "/project/src/App.tsx"

        mockExistsSync.mockReturnValue(true)
        mockReadFileSync.mockReturnValue(
            JSON.stringify({ files: { [resourcePath]: "/project/.mochi/abc123.css" } }),
        )

        const { ctx, callback } = makeCtx({ resourcePath, manifestPath })
        mochiLoader.call(ctx, "const x = 1")

        await vi.waitUntil(() => callback.mock.calls.length > 0)
        expect(ctx.addDependency).toHaveBeenCalledWith(manifestPath)
        expect(ctx.addDependency).toHaveBeenCalledWith(expect.stringContaining("abc123.css"))
    })

    it("resetContext() clears the singleton so next call uses fresh config", async () => {
        // First call — uses passthrough transform
        const { ctx: ctx1, callback: cb1 } = makeCtx()
        mochiLoader.call(ctx1, "first")
        await vi.waitUntil(() => cb1.mock.calls.length > 0)
        expect(cb1).toHaveBeenCalledWith(null, "first")

        // Reset and set up a transform for the second call
        resetContext()
        mockTransform.mockImplementation(async (source: string, _opts: { filePath: string }) => source + "//v2")

        const { ctx: ctx2, callback: cb2 } = makeCtx()
        mochiLoader.call(ctx2, "second")
        await vi.waitUntil(() => cb2.mock.calls.length > 0)
        expect(cb2).toHaveBeenCalledWith(null, "second//v2")
    })

    it("calls callback with error when initContext rejects", async () => {
        mockLoadConfig.mockRejectedValue(new Error("config load failed"))

        const { ctx, callback } = makeCtx()
        mochiLoader.call(ctx, "const x = 1")

        await vi.waitUntil(() => callback.mock.calls.length > 0)
        const err = callback.mock.calls[0]?.[0]
        expect(err).toBeInstanceOf(Error)
        expect((err as Error).message).toBe("config load failed")
    })
})
