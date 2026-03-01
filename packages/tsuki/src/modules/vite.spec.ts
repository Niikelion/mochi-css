import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import fs from "fs/promises"
import path from "path"
import os from "os"
import { viteModule } from "./vite"

vi.mock("@clack/prompts", () => ({
    text: vi.fn(),
    isCancel: vi.fn().mockReturnValue(false),
    log: { step: vi.fn(), info: vi.fn(), success: vi.fn() },
}))

import * as p from "@clack/prompts"

let tmpDir: string
let origCwd: string

beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "mochi-tsuki-vite-"))
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
const ctx = { requirePackage: noop, requirePackages: noop }

describe("viteModule.run", () => {
    it("creates vite.config.ts with default template when no config exists", async () => {
        vi.mocked(p.text).mockResolvedValue(path.join(tmpDir, "vite.config.ts"))
        await viteModule.run(ctx)
        const content = await fs.readFile(path.join(tmpDir, "vite.config.ts"), "utf-8")
        expect(content).toContain("mochiCss()")
        expect(content).toContain("@mochi-css/vite")
    })

    it("adds mochiCss() to existing defineConfig config", async () => {
        const configPath = path.join(tmpDir, "vite.config.ts")
        await fs.writeFile(configPath, `export default defineConfig({ plugins: [] })`)
        await viteModule.run(ctx)
        const content = await fs.readFile(configPath, "utf-8")
        expect(content).toContain("mochiCss()")
        expect(content).toContain("@mochi-css/vite")
    })

    it("adds mochiCss() to existing plain object config", async () => {
        const configPath = path.join(tmpDir, "vite.config.ts")
        await fs.writeFile(configPath, `export default { plugins: [] }`)
        await viteModule.run(ctx)
        const content = await fs.readFile(configPath, "utf-8")
        expect(content).toContain("mochiCss()")
    })

    it("adds mochiCss() to config with no plugins property", async () => {
        const configPath = path.join(tmpDir, "vite.config.ts")
        await fs.writeFile(configPath, `export default defineConfig({})`)
        await viteModule.run(ctx)
        const content = await fs.readFile(configPath, "utf-8")
        expect(content).toContain("mochiCss()")
    })

    it("adds mochiCss() to identifier export config", async () => {
        const configPath = path.join(tmpDir, "vite.config.ts")
        await fs.writeFile(configPath, `const config = { plugins: [] };\nexport default config`)
        await viteModule.run(ctx)
        const content = await fs.readFile(configPath, "utf-8")
        expect(content).toContain("mochiCss()")
    })

    it("adds import to existing config", async () => {
        const configPath = path.join(tmpDir, "vite.config.ts")
        await fs.writeFile(configPath, `export default { plugins: [] }`)
        await viteModule.run(ctx)
        const content = await fs.readFile(configPath, "utf-8")
        expect(content).toContain(`from "@mochi-css/vite"`)
    })

    it("returns early when user cancels path prompt", async () => {
        vi.mocked(p.isCancel).mockReturnValueOnce(true)
        vi.mocked(p.text).mockResolvedValue("vite.config.ts")
        await viteModule.run(ctx)
        expect(p.log.success).not.toHaveBeenCalled()
    })
})
