import { describe, it, expect, vi, beforeEach } from "vitest"
import { createPatch } from "diff"

const { mockStatSync, mockReadFileSync } = vi.hoisted(() => ({
    mockStatSync: vi.fn((_p: string) => undefined as { mtimeMs: number } | undefined),
    mockReadFileSync: vi.fn((_p: string, _enc: string) => "{}"),
}))

vi.mock("fs", () => ({
    default: {
        statSync: (p: string, _opts?: unknown) => mockStatSync(p),
        readFileSync: (p: string, enc: string) => mockReadFileSync(p, enc),
    },
}))

import mochiLoader from "./loader.js"

let testMtime = 0
function nextMtime() {
    return ++testMtime
}

function makeCtx(overrides?: { resourcePath?: string; manifestPath?: string }) {
    const callback = vi.fn()
    const ctx = {
        resourcePath: overrides?.resourcePath ?? "/project/src/App.tsx",
        getOptions: () => ({
            manifestPath: overrides?.manifestPath ?? "/project/.mochi/manifest.json",
        }),
        addDependency: vi.fn(),
        async: () => callback,
    }
    return { ctx, callback }
}

describe("mochiLoader", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockStatSync.mockReturnValue(undefined)
    })

    it("passes source through unchanged when manifest does not exist", () => {
        const { ctx, callback } = makeCtx()
        mochiLoader.call(ctx, "const x = 1")
        expect(callback).toHaveBeenCalledWith(null, "const x = 1")
    })

    it("passes source through unchanged when manifest has no sourcemod for this file", () => {
        mockStatSync.mockReturnValue({ mtimeMs: nextMtime() })
        mockReadFileSync.mockReturnValue(JSON.stringify({ files: {} }))

        const { ctx, callback } = makeCtx()
        mochiLoader.call(ctx, "const x = 1")
        expect(callback).toHaveBeenCalledWith(null, "const x = 1")
    })

    it("applies sourcemod from manifest", () => {
        const resourcePath = "/project/src/App.tsx"
        const original = "const x = 1\n"
        const modified = "const x = 2\n"
        const sourcemod = createPatch(resourcePath, original, modified)

        mockStatSync.mockReturnValue({ mtimeMs: nextMtime() })
        mockReadFileSync.mockReturnValue(
            JSON.stringify({ files: {}, sourcemods: { [resourcePath]: sourcemod } }),
        )

        const { ctx, callback } = makeCtx({ resourcePath })
        mochiLoader.call(ctx, original)
        expect(callback).toHaveBeenCalledWith(null, modified)
    })

    it("passes source through unchanged when sourcemod does not apply (stale)", () => {
        const resourcePath = "/project/src/App.tsx"
        const original = "const x = 1\n"
        const staleSource = "const old = 0\n"
        const sourcemod = createPatch(resourcePath, staleSource, staleSource + "//extra\n")

        mockStatSync.mockReturnValue({ mtimeMs: nextMtime() })
        mockReadFileSync.mockReturnValue(
            JSON.stringify({ files: {}, sourcemods: { [resourcePath]: sourcemod } }),
        )

        const { ctx, callback } = makeCtx({ resourcePath })
        mochiLoader.call(ctx, original)
        // applyPatch returns false when patch doesn't apply — falls back to original
        expect(callback).toHaveBeenCalledWith(null, original)
    })

    it("injects CSS import from manifest", () => {
        const manifestPath = "/project/.mochi/manifest.json"
        const resourcePath = "/project/src/App.tsx"

        mockStatSync.mockReturnValue({ mtimeMs: nextMtime() })
        mockReadFileSync.mockReturnValue(
            JSON.stringify({ files: { [resourcePath]: "/project/.mochi/abc123.css" } }),
        )

        const { ctx, callback } = makeCtx({ resourcePath, manifestPath })
        mochiLoader.call(ctx, "const x = 1")

        const result = callback.mock.calls[0]?.[1] as string
        expect(result).toContain("abc123.css")
    })

    it("injects CSS import with sourcemod applied", () => {
        const manifestPath = "/project/.mochi/manifest.json"
        const resourcePath = "/project/src/App.tsx"
        const original = "const x = 1\n"
        const modified = "const x = 2\n"
        const sourcemod = createPatch(resourcePath, original, modified)

        mockStatSync.mockReturnValue({ mtimeMs: nextMtime() })
        mockReadFileSync.mockReturnValue(
            JSON.stringify({
                files: { [resourcePath]: "/project/.mochi/abc123.css" },
                sourcemods: { [resourcePath]: sourcemod },
            }),
        )

        const { ctx, callback } = makeCtx({ resourcePath, manifestPath })
        mochiLoader.call(ctx, original)

        const result = callback.mock.calls[0]?.[1] as string
        expect(result).toContain("abc123.css")
        expect(result).toContain("const x = 2")
    })

    it("injects global CSS import when manifest has global styles", () => {
        const manifestPath = "/project/.mochi/manifest.json"
        const resourcePath = "/project/src/App.tsx"

        mockStatSync.mockReturnValue({ mtimeMs: nextMtime() })
        mockReadFileSync.mockReturnValue(
            JSON.stringify({
                files: { [resourcePath]: "/project/.mochi/abc123.css" },
                global: "/project/.mochi/global.css",
            }),
        )

        const { ctx, callback } = makeCtx({ resourcePath, manifestPath })
        mochiLoader.call(ctx, "const x = 1")

        const result = callback.mock.calls[0]?.[1] as string
        expect(result).toContain("abc123.css")
        expect(result).toContain("global.css")
    })

    it("tracks manifest and CSS file as webpack dependencies", () => {
        const manifestPath = "/project/.mochi/manifest.json"
        const resourcePath = "/project/src/App.tsx"

        mockStatSync.mockReturnValue({ mtimeMs: nextMtime() })
        mockReadFileSync.mockReturnValue(
            JSON.stringify({ files: { [resourcePath]: "/project/.mochi/abc123.css" } }),
        )

        const { ctx } = makeCtx({ resourcePath, manifestPath })
        mochiLoader.call(ctx, "const x = 1")

        expect(ctx.addDependency).toHaveBeenCalledWith(manifestPath)
        expect(ctx.addDependency).toHaveBeenCalledWith(expect.stringContaining("abc123.css"))
    })

    it("calls callback with error when manifest is invalid JSON", () => {
        mockStatSync.mockReturnValue({ mtimeMs: nextMtime() })
        mockReadFileSync.mockReturnValue("not valid json")

        const { ctx, callback } = makeCtx()
        mochiLoader.call(ctx, "const x = 1")

        expect(callback.mock.calls[0]?.[0]).toBeInstanceOf(Error)
    })

    it("caches manifest across calls with the same mtime", () => {
        const manifestPath = "/project/.mochi/manifest.json"
        const mtime = nextMtime()
        mockStatSync.mockReturnValue({ mtimeMs: mtime })
        mockReadFileSync.mockReturnValue(JSON.stringify({ files: {} }))

        const { ctx: ctx1 } = makeCtx({ manifestPath })
        const { ctx: ctx2 } = makeCtx({ manifestPath })
        mochiLoader.call(ctx1, "const x = 1")
        mochiLoader.call(ctx2, "const x = 2")

        // readFileSync called only once — second invocation used the cache
        expect(mockReadFileSync).toHaveBeenCalledTimes(1)
    })

    it("re-reads manifest when mtime changes", () => {
        const manifestPath = "/project/.mochi/manifest.json"
        mockReadFileSync.mockReturnValue(JSON.stringify({ files: {} }))

        mockStatSync.mockReturnValue({ mtimeMs: nextMtime() })
        const { ctx: ctx1 } = makeCtx({ manifestPath })
        mochiLoader.call(ctx1, "const x = 1")

        mockStatSync.mockReturnValue({ mtimeMs: nextMtime() })
        const { ctx: ctx2 } = makeCtx({ manifestPath })
        mochiLoader.call(ctx2, "const x = 2")

        expect(mockReadFileSync).toHaveBeenCalledTimes(2)
    })
})
