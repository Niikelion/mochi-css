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
import { vitePreset, nextjsPreset, tsdownPreset } from "@/presets"

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
    it("sets up postcss with tmpDir and vite config", async () => {
        await fs.writeFile(path.join(tmpDir, "postcss.config.js"), `export default { plugins: {} }`)
        await fs.writeFile(path.join(tmpDir, "vite.config.ts"), `export default defineConfig({ plugins: [] })`)

        // Decline the Storybook prompt so it doesn't also patch postcss.config.js with the
        // shared `p.text` mock below.
        vi.mocked(p.confirm).mockImplementation(async (opts: { message: string }) =>
            Promise.resolve(opts.message === "Do you use PostCSS?"),
        )
        vi.mocked(p.text).mockResolvedValue("postcss.config.js")

        const runner = new ModuleRunner()
        vitePreset.setup(runner)
        await runner.run()

        const postcssContent = await fs.readFile(path.join(tmpDir, "postcss.config.js"), "utf-8")
        expect(postcssContent).toContain("@mochi-css/postcss")
        expect(postcssContent).not.toContain("@mochi-css/storybook")

        const mochiContent = await fs.readFile(path.join(tmpDir, "mochi.config.ts"), "utf-8")
        expect(mochiContent).toContain("tmpDir")
        expect(mochiContent).toContain(".mochi")

        const viteContent = await fs.readFile(path.join(tmpDir, "vite.config.ts"), "utf-8")
        expect(viteContent).toContain("mochiCss()")

        expect(installPackages).toHaveBeenCalled()
    })

    it("adds the mochi addon to an existing Storybook config", async () => {
        await fs.mkdir(path.join(tmpDir, ".storybook"), { recursive: true })
        await fs.writeFile(
            path.join(tmpDir, ".storybook", "main.ts"),
            `export default { stories: [], addons: [] }`,
        )

        // Decline everything except the Storybook prompt.
        vi.mocked(p.confirm).mockImplementation(async (opts: { message: string }) =>
            Promise.resolve(opts.message === "Do you use Storybook?"),
        )
        vi.mocked(p.text).mockResolvedValue(path.join(".storybook", "main.ts"))

        const runner = new ModuleRunner()
        vitePreset.setup(runner)
        await runner.run()

        const storybookContent = await fs.readFile(path.join(tmpDir, ".storybook", "main.ts"), "utf-8")
        expect(storybookContent).toContain("@mochi-css/storybook")

        expect(installPackages).toHaveBeenCalled()
    })

    it("creates a default Storybook config via --storybook flag with no prompts", async () => {
        vi.mocked(p.confirm).mockResolvedValue(false)
        // viteModule always prompts for its own path (no confirm gate) — give it a fresh
        // value so it doesn't reuse a prior test's mocked Storybook path.
        vi.mocked(p.text).mockResolvedValue("vite.config.ts")

        const runner = new ModuleRunner()
        vitePreset.setup(runner)
        await runner.run({ moduleOptions: { storybook: true } })

        const storybookContent = await fs.readFile(path.join(tmpDir, ".storybook", "main.ts"), "utf-8")
        expect(storybookContent).toContain("@mochi-css/storybook")

        expect(installPackages).toHaveBeenCalled()
    })
})

describe("tsdown preset integration", () => {
    it("creates default tsdown.config.mts and mochi config when neither exists", async () => {
        const runner = new ModuleRunner()
        tsdownPreset.setup(runner)
        await runner.run({ moduleOptions: { tsdown: true } })

        const configContent = await fs.readFile(path.join(tmpDir, "tsdown.config.mts"), "utf-8")
        expect(configContent).toContain("mochiCss()")
        expect(configContent).toContain("@mochi-css/rolldown")

        const mochiContent = await fs.readFile(path.join(tmpDir, "mochi.config.ts"), "utf-8")
        expect(mochiContent).toContain("tmpDir")
        expect(mochiContent).toContain(".mochi")

        expect(installPackages).toHaveBeenCalled()
    })

    it("patches existing tsdown.config.mts to add mochiCss()", async () => {
        await fs.writeFile(
            path.join(tmpDir, "tsdown.config.mts"),
            `import { defineConfig } from "tsdown"\nexport default defineConfig({ entry: ["src/index.ts"], format: ["esm", "cjs"], plugins: [] })\n`,
        )

        const runner = new ModuleRunner()
        tsdownPreset.setup(runner)
        await runner.run({ moduleOptions: { tsdown: true } })

        const configContent = await fs.readFile(path.join(tmpDir, "tsdown.config.mts"), "utf-8")
        expect(configContent).toContain("mochiCss()")
        expect(configContent).toContain("@mochi-css/rolldown")

        expect(installPackages).toHaveBeenCalled()
    })
})

describe("nextjs preset integration", () => {
    it("wraps next config and sets up mochi config (no postcss)", async () => {
        await fs.writeFile(path.join(tmpDir, "next.config.ts"), `export default {}`)

        const runner = new ModuleRunner()
        nextjsPreset.setup(runner)
        await runner.run()

        const mochiContent = await fs.readFile(path.join(tmpDir, "mochi.config.ts"), "utf-8")
        expect(mochiContent).toContain("tmpDir")
        expect(mochiContent).toContain(".mochi")

        const nextContent = await fs.readFile(path.join(tmpDir, "next.config.ts"), "utf-8")
        expect(nextContent).toContain("withMochi")

        // Postcss plugin must NOT be added — withMochi() handles all CSS for Next.js
        const postcssExists = await fs
            .access(path.join(tmpDir, "postcss.config.mjs"))
            .then(() => true)
            .catch(() => false)
        expect(postcssExists).toBe(false)

        expect(installPackages).toHaveBeenCalled()
    })
})
