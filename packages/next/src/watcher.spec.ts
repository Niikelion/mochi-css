import { describe, it, expect, vi, beforeEach } from "vitest"

const {
    mockWatch,
    mockExistsSync,
    mockCollectMochiCss,
    mockWriteFile,
    mockReadFile,
    mockMkdir,
    mockReaddir,
} = vi.hoisted(() => ({
    mockWatch: vi.fn(),
    mockExistsSync: vi.fn(() => true),
    mockCollectMochiCss: vi.fn().mockResolvedValue({ global: undefined, files: {} }),
    mockWriteFile: vi.fn().mockResolvedValue(undefined),
    mockReadFile: vi.fn().mockRejectedValue(new Error("not found")),
    mockMkdir: vi.fn().mockResolvedValue(undefined),
    mockReaddir: vi.fn().mockResolvedValue([]),
}))

vi.mock("fs", () => ({
    default: {
        watch: mockWatch,
        existsSync: mockExistsSync,
        promises: {
            mkdir: mockMkdir,
            readdir: mockReaddir,
            readFile: mockReadFile,
            writeFile: mockWriteFile,
            unlink: vi.fn().mockResolvedValue(undefined),
        },
    },
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
    // Must use function (not arrow) so it can be used as a constructor
    FullContext: vi.fn(function MockFullContext(this: Record<string, unknown>) {
        this["stages"] = { getAll: vi.fn(() => []) }
        this["filePreProcess"] = { transform: vi.fn((c: string) => c) }
        this["sourceTransforms"] = { getAll: vi.fn(() => []) }
        this["emitHooks"] = { getAll: vi.fn(() => []) }
        this["cleanup"] = { runAll: vi.fn() }
    }),
}))

vi.mock("@mochi-css/builder", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@mochi-css/builder")>()
    return {
        ...actual,
        Builder: vi.fn(function MockBuilder(this: Record<string, unknown>) {
            this["collectMochiCss"] = mockCollectMochiCss
        }),
        RolldownBundler: vi.fn(function MockRolldownBundler() {}),
        VmRunner: vi.fn(function MockVmRunner() {}),
        fileHash: vi.fn((s: string) => s),
    }
})

import { buildCssOnce, startCssWatcher } from "./watcher.js"
import { resolveConfig } from "@mochi-css/config"

beforeEach(() => {
    vi.clearAllMocks()
    delete (process as unknown as Record<string, unknown>)["__mochiWatcherActive"]
    mockCollectMochiCss.mockResolvedValue({ global: undefined, files: {} })
    mockReadFile.mockRejectedValue(new Error("not found"))
})

describe("startCssWatcher", () => {
    it("sets __mochiWatcherActive on process synchronously", () => {
        expect((process as unknown as Record<string, unknown>)["__mochiWatcherActive"]).toBeUndefined()
        startCssWatcher(".mochi")
        expect((process as unknown as Record<string, unknown>)["__mochiWatcherActive"]).toBe(true)
    })
})

describe("buildCssOnce", () => {
    it("calls collectMochiCss and writes manifest", async () => {
        mockCollectMochiCss.mockResolvedValueOnce({
            global: "body {}",
            files: { "/src/App.tsx": ".foo { color: red }" },
        })
        await buildCssOnce(".mochi")
        expect(mockCollectMochiCss).toHaveBeenCalledTimes(1)
    })

    it("warns and returns early when no roots are configured", async () => {
        vi.mocked(resolveConfig).mockResolvedValueOnce({
            tmpDir: undefined,
            roots: [],
            plugins: [],
            splitCss: true,
            onDiagnostic: undefined,
        } as never)
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
        await buildCssOnce(".mochi")
        expect(mockCollectMochiCss).not.toHaveBeenCalled()
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("no roots configured"))
        warnSpy.mockRestore()
    })

    it("stores posix file and sourcemod keys from builder unchanged in manifest", async () => {
        mockCollectMochiCss.mockResolvedValueOnce({
            global: undefined,
            files: { "C:/src/App.tsx": ".foo { color: red }" },
            sourcemods: { "C:/src/App.tsx": "--- patch ---" },
        })
        await buildCssOnce(".mochi")
        const writeFileCalls = mockWriteFile.mock.calls
        const manifestCall = writeFileCalls.find((args) => String(args[0]).endsWith("manifest.json"))
        expect(manifestCall).toBeDefined()
        const manifest = JSON.parse(manifestCall![1] as string) as {
            files: Record<string, string>
            sourcemods: Record<string, string>
        }
        expect(Object.keys(manifest.files)).toEqual(["C:/src/App.tsx"])
        expect(Object.keys(manifest.sourcemods)).toEqual(["C:/src/App.tsx"])
    })
})
