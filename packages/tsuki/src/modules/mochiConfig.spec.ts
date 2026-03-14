import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import fs from "fs/promises"
import path from "path"
import os from "os"
import { createMochiConfigModule } from "./mochiConfig"

vi.mock("@clack/prompts", () => ({
    isCancel: vi.fn().mockReturnValue(false),
    log: { step: vi.fn(), info: vi.fn(), success: vi.fn(), warn: vi.fn() },
}))

let tmpDir: string
let origCwd: string

beforeEach(async () => {
    vi.stubGlobal("__VERSION__", "2.1.0")
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "mochi-tsuki-mochiconfig-"))
    origCwd = process.cwd()
    process.chdir(tmpDir)
})

afterEach(async () => {
    process.chdir(origCwd)
    await fs.rm(tmpDir, { recursive: true })
    vi.clearAllMocks()
})

const noop = () => {
    // no-op
}
const ctx = { requirePackage: noop, requirePackages: noop, nonInteractive: false as const, moduleOptions: {} }

describe("createMochiConfigModule", () => {
    it("creates mochi.config.ts with defineConfig when no config exists", async () => {
        await createMochiConfigModule().run(ctx)
        const content = await fs.readFile(path.join(tmpDir, "mochi.config.ts"), "utf-8")
        expect(content).toContain("defineConfig")
        expect(content).toContain("@mochi-css/config")
    })

    it("creates mochi.config.ts with styledIdPlugin when styledId: true", async () => {
        await createMochiConfigModule({ styledId: true }).run(ctx)
        const content = await fs.readFile(path.join(tmpDir, "mochi.config.ts"), "utf-8")
        expect(content).toContain("styledIdPlugin()")
        expect(content).toContain("@mochi-css/builder")
        expect(content).toContain("@mochi-css/config")
    })

    it("adds styledIdPlugin to existing defineConfig mochi.config.ts", async () => {
        const configPath = path.join(tmpDir, "mochi.config.ts")
        await fs.writeFile(
            configPath,
            `import { defineConfig } from "@mochi-css/config"\nexport default defineConfig({ plugins: [] })\n`,
        )
        await createMochiConfigModule({ styledId: true }).run(ctx)
        const content = await fs.readFile(configPath, "utf-8")
        expect(content).toContain("styledIdPlugin()")
        expect(content).toContain("@mochi-css/builder")
    })

    it("adds styledIdPlugin to existing config with no plugins property", async () => {
        const configPath = path.join(tmpDir, "mochi.config.ts")
        await fs.writeFile(
            configPath,
            `import { defineConfig } from "@mochi-css/config"\nexport default defineConfig({})\n`,
        )
        await createMochiConfigModule({ styledId: true }).run(ctx)
        const content = await fs.readFile(configPath, "utf-8")
        expect(content).toContain("styledIdPlugin()")
    })

    it("is idempotent — does not duplicate styledIdPlugin on second call", async () => {
        const configPath = path.join(tmpDir, "mochi.config.ts")
        await fs.writeFile(
            configPath,
            `import { defineConfig } from "@mochi-css/config"\nexport default defineConfig({ plugins: [] })\n`,
        )
        await createMochiConfigModule({ styledId: true }).run(ctx)
        const afterFirst = await fs.readFile(configPath, "utf-8")
        await createMochiConfigModule({ styledId: true }).run(ctx)
        const afterSecond = await fs.readFile(configPath, "utf-8")
        expect(afterFirst).toBe(afterSecond)
        expect(afterSecond.match(/styledIdPlugin/g)).toHaveLength(2) // import + call
    })

    it("is idempotent — does not duplicate outDir on second call", async () => {
        const configPath = path.join(tmpDir, "mochi.config.ts")
        await fs.writeFile(
            configPath,
            `import { defineConfig } from "@mochi-css/config"\nexport default defineConfig({})\n`,
        )
        await createMochiConfigModule({ outDir: ".mochi" }).run(ctx)
        const afterFirst = await fs.readFile(configPath, "utf-8")
        await createMochiConfigModule({ outDir: ".mochi" }).run(ctx)
        const afterSecond = await fs.readFile(configPath, "utf-8")
        expect(afterFirst).toBe(afterSecond)
        expect(afterSecond.match(/outDir/g)).toHaveLength(1)
    })

    it("skips modification when styledId is false and config already exists", async () => {
        const configPath = path.join(tmpDir, "mochi.config.ts")
        const original = `import { defineConfig } from "@mochi-css/config"\nexport default defineConfig({})\n`
        await fs.writeFile(configPath, original)
        await createMochiConfigModule().run(ctx)
        const content = await fs.readFile(configPath, "utf-8")
        expect(content).toBe(original)
    })

    it("requires @mochi-css/config package", async () => {
        const requirePackage = vi.fn()
        await createMochiConfigModule().run({ ...ctx, requirePackage })
        expect(requirePackage).toHaveBeenCalledWith("@mochi-css/config@^2.0.0")
    })

    it("requires @mochi-css/builder when styledId: true", async () => {
        const requirePackage = vi.fn()
        await createMochiConfigModule({ styledId: true }).run({ ...ctx, requirePackage })
        expect(requirePackage).toHaveBeenCalledWith("@mochi-css/builder@^2.0.0")
    })
})
