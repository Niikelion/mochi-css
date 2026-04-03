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
        expect(content).toContain("@mochi-css/vanilla/config")
    })

    it("creates mochi.config.ts with vanilla-react/config when styledId: true", async () => {
        await createMochiConfigModule({ styledId: true }).run(ctx)
        const content = await fs.readFile(path.join(tmpDir, "mochi.config.ts"), "utf-8")
        expect(content).toContain("@mochi-css/vanilla-react/config")
        expect(content).not.toContain("styledIdPlugin")
    })

    it("patches existing config to vanilla-react/config when styledId: true", async () => {
        const configPath = path.join(tmpDir, "mochi.config.ts")
        await fs.writeFile(
            configPath,
            `import { defineConfig } from "@mochi-css/vanilla/config"\nexport default defineConfig({ plugins: [] })\n`,
        )
        await createMochiConfigModule({ styledId: true }).run(ctx)
        const content = await fs.readFile(configPath, "utf-8")
        expect(content).toContain("@mochi-css/vanilla-react/config")
        expect(content).not.toContain("styledIdPlugin")
    })

    it("patches existing config with no plugins property to vanilla-react/config", async () => {
        const configPath = path.join(tmpDir, "mochi.config.ts")
        await fs.writeFile(
            configPath,
            `import { defineConfig } from "@mochi-css/vanilla/config"\nexport default defineConfig({})\n`,
        )
        await createMochiConfigModule({ styledId: true }).run(ctx)
        const content = await fs.readFile(configPath, "utf-8")
        expect(content).toContain("@mochi-css/vanilla-react/config")
    })

    it("is idempotent — does not duplicate patch on second call", async () => {
        const configPath = path.join(tmpDir, "mochi.config.ts")
        await fs.writeFile(
            configPath,
            `import { defineConfig } from "@mochi-css/vanilla/config"\nexport default defineConfig({ plugins: [] })\n`,
        )
        await createMochiConfigModule({ styledId: true }).run(ctx)
        const afterFirst = await fs.readFile(configPath, "utf-8")
        await createMochiConfigModule({ styledId: true }).run(ctx)
        const afterSecond = await fs.readFile(configPath, "utf-8")
        expect(afterFirst).toBe(afterSecond)
        expect(afterSecond).toContain("@mochi-css/vanilla-react/config")
    })

    it("is idempotent — does not duplicate tmpDir on second call", async () => {
        const configPath = path.join(tmpDir, "mochi.config.ts")
        await fs.writeFile(
            configPath,
            `import { defineConfig } from "@mochi-css/config"\nexport default defineConfig({})\n`,
        )
        await createMochiConfigModule({ tmpDir: ".mochi" }).run(ctx)
        const afterFirst = await fs.readFile(configPath, "utf-8")
        await createMochiConfigModule({ tmpDir: ".mochi" }).run(ctx)
        const afterSecond = await fs.readFile(configPath, "utf-8")
        expect(afterFirst).toBe(afterSecond)
        expect(afterSecond.match(/tmpDir/g)).toHaveLength(1)
    })

    it("skips modification when styledId is false and config already exists", async () => {
        const configPath = path.join(tmpDir, "mochi.config.ts")
        const original = `import { defineConfig } from "@mochi-css/config"\nexport default defineConfig({})\n`
        await fs.writeFile(configPath, original)
        await createMochiConfigModule().run(ctx)
        const content = await fs.readFile(configPath, "utf-8")
        expect(content).toBe(original)
    })

    it("requires @mochi-css/vanilla package", async () => {
        const requirePackage = vi.fn()
        await createMochiConfigModule().run({ ...ctx, requirePackage })
        expect(requirePackage).toHaveBeenCalledWith("@mochi-css/vanilla@^2.0.0")
    })

    it("requires @mochi-css/vanilla-react when styledId: true", async () => {
        const requirePackage = vi.fn()
        await createMochiConfigModule({ styledId: true }).run({ ...ctx, requirePackage })
        expect(requirePackage).toHaveBeenCalledWith("@mochi-css/vanilla-react@^2.0.0")
    })

    it("does not explicitly require @mochi-css/builder (it installs transitively)", async () => {
        const requirePackage = vi.fn()
        await createMochiConfigModule({ styledId: true }).run({ ...ctx, requirePackage })
        expect(requirePackage).not.toHaveBeenCalledWith(expect.stringContaining("@mochi-css/builder"))
    })
})
