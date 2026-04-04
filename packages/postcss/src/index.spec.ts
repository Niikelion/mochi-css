import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import type { Root, Result } from "postcss"

const { mockCollectMochiCss } = vi.hoisted(() => ({
    mockCollectMochiCss: vi.fn().mockResolvedValue({ global: undefined, files: {}, sourcemods: {} }),
}))

vi.mock("@mochi-css/config", () => ({
    loadConfig: vi.fn().mockResolvedValue({}),
    resolveConfig: vi.fn().mockResolvedValue({
        tmpDir: undefined,
        roots: ["src"],
        plugins: [],
        splitCss: true,
        onDiagnostic: undefined,
    }),
    FullContext: vi.fn(function MockFullContext(this: Record<string, unknown>) {
        this["stages"] = { getAll: vi.fn(() => []) }
        this["filePreProcess"] = { transform: vi.fn((c: string) => c) }
        this["sourceTransforms"] = { getAll: vi.fn(() => []) }
        this["emitHooks"] = { getAll: vi.fn(() => []) }
        this["cleanup"] = { runAll: vi.fn() }
    }),
    mergeCallbacks: vi.fn((_a: unknown, b: unknown) => b),
}))

vi.mock("@mochi-css/builder", () => ({
    Builder: vi.fn(function MockBuilder(this: Record<string, unknown>) {
        this["collectMochiCss"] = mockCollectMochiCss
    }),
    RolldownBundler: vi.fn(function MockRolldownBundler() {}),
    VmRunner: vi.fn(function MockVmRunner() {}),
    fileHash: vi.fn((s: string) => s),
}))

vi.mock("fs", () => ({
    default: {
        promises: {
            mkdir: vi.fn().mockResolvedValue(undefined),
            readdir: vi.fn().mockResolvedValue([]),
            readFile: vi.fn().mockRejectedValue(new Error("not found")),
            writeFile: vi.fn().mockResolvedValue(undefined),
            unlink: vi.fn().mockResolvedValue(undefined),
        },
    },
}))

import mochiPostcss from "./index.js"

function makeResult(from: string): { root: Root; result: Result } {
    const messages: unknown[] = []
    const root = { append: vi.fn(), walk: vi.fn(), source: undefined } as unknown as Root
    const result = {
        opts: { from },
        messages,
        warn: vi.fn(),
    } as unknown as Result
    return { root, result }
}

async function runPlugin(from: string): Promise<void> {
    const plugin = mochiPostcss()
    const { root, result } = makeResult(from)
    // The plugin queues calls via builderGuard; invoke directly
    const fn = (plugin as unknown as { plugins: ((...args: unknown[]) => Promise<void>)[] }).plugins[0] as (...args: unknown[]) => Promise<void>
    await fn(root, result)
}

describe("postcss plugin watcher guard", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        delete (process as unknown as Record<string, unknown>)["__mochiWatcherActive"]
    })

    afterEach(() => {
        delete (process as unknown as Record<string, unknown>)["__mochiWatcherActive"]
    })

    it("skips collectMochiCss and emits a warning when watcher is active", async () => {
        ;(process as unknown as Record<string, unknown>)["__mochiWatcherActive"] = true
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
        await runPlugin("/project/globals.css")
        expect(mockCollectMochiCss).not.toHaveBeenCalled()
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("withMochi()"))
        warnSpy.mockRestore()
    })

    it("emits the warning at most once across repeated invocations in the same session", async () => {
        // Use a fresh plugin instance (new creator call) to avoid cross-test state leakage
        // The module-level _warnedAboutWatcher flag means repeated calls in one session warn once
        ;(process as unknown as Record<string, unknown>)["__mochiWatcherActive"] = true
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
        // Create a separate plugin instance for this test to get a clean warning state
        const plugin2 = mochiPostcss()
        const fn2 = (plugin2 as unknown as { plugins: ((...args: unknown[]) => Promise<void>)[] }).plugins[0] as (...args: unknown[]) => Promise<void>
        const { root: r1, result: res1 } = makeResult("/project/globals.css")
        const { root: r2, result: res2 } = makeResult("/project/globals.css")
        await fn2(r1, res1)
        await fn2(r2, res2)
        // Warning count from this spy should be 0 or 1 (not 2)
        expect(warnSpy.mock.calls.length).toBeLessThanOrEqual(1)
        warnSpy.mockRestore()
    })

    it("runs normally when watcher is not active", async () => {
        await runPlugin("/project/globals.css")
        expect(mockCollectMochiCss).toHaveBeenCalledTimes(1)
    })
})
