import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import fs from "fs/promises"
import path from "path"
import os from "os"

vi.mock("@clack/prompts", () => ({
    confirm: vi.fn(),
    text: vi.fn(),
    select: vi.fn(),
    isCancel: vi.fn().mockReturnValue(false),
    log: { step: vi.fn(), info: vi.fn(), success: vi.fn() },
    intro: vi.fn(),
    outro: vi.fn(),
}))

vi.mock("../src/install", () => ({
    installPackages: vi.fn().mockResolvedValue(undefined),
}))

import * as p from "@clack/prompts"
import { installPackages } from "@/install"
import { ModuleRunner } from "@/runner"
import { vitePreset, nextjsPreset } from "@/presets"

let tmpDir: string
let origCwd: string

beforeEach(async () => {
    vi.stubGlobal("__VERSION__", "2.1.0")
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "mochi-tsuki-preset-"))
    origCwd = process.cwd()
    process.chdir(tmpDir)
    vi.mocked(p.confirm).mockResolvedValue(true)
})

afterEach(async () => {
    process.chdir(origCwd)
    await fs.rm(tmpDir, { recursive: true })
    vi.clearAllMocks()
})

describe("vite preset integration", () => {
    it("sets up postcss with outDir and vite config", async () => {
        await fs.writeFile(path.join(tmpDir, "postcss.config.js"), `export default { plugins: {} }`)
        await fs.writeFile(path.join(tmpDir, "vite.config.ts"), `export default defineConfig({ plugins: [] })`)

        vi.mocked(p.text).mockResolvedValue("postcss.config.js")

        const runner = new ModuleRunner()
        vitePreset.setup(runner)
        await runner.run()

        const postcssContent = await fs.readFile(path.join(tmpDir, "postcss.config.js"), "utf-8")
        expect(postcssContent).toContain("@mochi-css/postcss")

        const mochiContent = await fs.readFile(path.join(tmpDir, "mochi.config.ts"), "utf-8")
        expect(mochiContent).toContain("outDir")
        expect(mochiContent).toContain(".mochi")

        const viteContent = await fs.readFile(path.join(tmpDir, "vite.config.ts"), "utf-8")
        expect(viteContent).toContain("mochiCss()")

        expect(installPackages).toHaveBeenCalled()
    })
})

describe("nextjs preset integration", () => {
    it("sets up postcss automatically and wraps next config", async () => {
        await fs.writeFile(path.join(tmpDir, "postcss.config.js"), `export default { plugins: {} }`)
        await fs.writeFile(path.join(tmpDir, "next.config.ts"), `export default {}`)

        const runner = new ModuleRunner()
        nextjsPreset.setup(runner)
        await runner.run()

        const postcssContent = await fs.readFile(path.join(tmpDir, "postcss.config.js"), "utf-8")
        expect(postcssContent).toContain("@mochi-css/postcss")

        const mochiContent = await fs.readFile(path.join(tmpDir, "mochi.config.ts"), "utf-8")
        expect(mochiContent).toContain("outDir")
        expect(mochiContent).toContain(".mochi")

        const nextContent = await fs.readFile(path.join(tmpDir, "next.config.ts"), "utf-8")
        expect(nextContent).toContain("withMochi")

        expect(installPackages).toHaveBeenCalled()
    })

    it("creates postcss config when none exists", async () => {
        await fs.writeFile(path.join(tmpDir, "next.config.ts"), `export default {}`)

        const runner = new ModuleRunner()
        nextjsPreset.setup(runner)
        await runner.run()

        const postcssContent = await fs.readFile(path.join(tmpDir, "postcss.config.mjs"), "utf-8")
        expect(postcssContent).toContain("@mochi-css/postcss")

        const mochiContent = await fs.readFile(path.join(tmpDir, "mochi.config.ts"), "utf-8")
        expect(mochiContent).toContain("outDir")
    })
})
