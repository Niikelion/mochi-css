import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import fs from "fs/promises"
import path from "path"
import os from "os"
import { storybookModule, findStorybookConfig } from "./storybook"
import { noop } from "@mochi-css/core"

vi.mock("@clack/prompts", () => ({
    confirm: vi.fn(),
    text: vi.fn(),
    isCancel: vi.fn().mockReturnValue(false),
    log: { step: vi.fn(), info: vi.fn(), success: vi.fn() },
}))

import * as p from "@clack/prompts"

let tmpDir: string
let origCwd: string

beforeEach(async () => {
    vi.stubGlobal("__VERSION__", "2.1.0")
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "mochi-tsuki-storybook-"))
    origCwd = process.cwd()
    process.chdir(tmpDir)
})

afterEach(async () => {
    process.chdir(origCwd)
    await fs.rm(tmpDir, { recursive: true })
    vi.clearAllMocks()
})

const ctx = { requirePackage: noop, requirePackages: noop, nonInteractive: false as const, moduleOptions: {} }

describe("findStorybookConfig", () => {
    it("returns undefined when no config file exists", () => {
        expect(findStorybookConfig()).toBeUndefined()
    })

    it("finds an existing .storybook/main.ts", async () => {
        await fs.mkdir(path.join(tmpDir, ".storybook"), { recursive: true })
        await fs.writeFile(path.join(tmpDir, ".storybook", "main.ts"), "export default {}")
        expect(findStorybookConfig()).toBe(path.join(".storybook", "main.ts"))
    })
})

describe("storybookModule.run", () => {
    it("does nothing when the user declines the confirm prompt", async () => {
        vi.mocked(p.confirm).mockResolvedValue(false)
        await storybookModule.run(ctx)
        expect(p.log.success).not.toHaveBeenCalled()
        expect(await fs.readdir(tmpDir)).toHaveLength(0)
    })

    it("does nothing in non-interactive mode with no --storybook flag", async () => {
        await storybookModule.run({ ...ctx, nonInteractive: true })
        expect(p.log.success).not.toHaveBeenCalled()
    })

    it("creates a default .storybook/main.ts with the mochi addon when none exists and confirmed", async () => {
        vi.mocked(p.confirm).mockResolvedValue(true)
        vi.mocked(p.text).mockResolvedValue(path.join(".storybook", "main.ts"))

        await storybookModule.run(ctx)

        const content = await fs.readFile(path.join(tmpDir, ".storybook", "main.ts"), "utf-8")
        expect(content).toContain("@mochi-css/storybook")
        expect(content).toContain("addons")
    })

    it("creates the default config directly when the --storybook flag is passed with no existing config", async () => {
        await storybookModule.run({ ...ctx, moduleOptions: { storybook: true } })

        const content = await fs.readFile(path.join(tmpDir, ".storybook", "main.ts"), "utf-8")
        expect(content).toContain("@mochi-css/storybook")
    })

    it("adds the addon to an existing object-literal config", async () => {
        await fs.mkdir(path.join(tmpDir, ".storybook"), { recursive: true })
        const configPath = path.join(tmpDir, ".storybook", "main.ts")
        await fs.writeFile(configPath, `export default { stories: [], addons: [] }`)

        await storybookModule.run({ ...ctx, moduleOptions: { storybook: true } })

        const content = await fs.readFile(configPath, "utf-8")
        expect(content).toContain("@mochi-css/storybook")
    })

    it("adds the addon to an existing defineMain(...)-wrapped config", async () => {
        await fs.mkdir(path.join(tmpDir, ".storybook"), { recursive: true })
        const configPath = path.join(tmpDir, ".storybook", "main.ts")
        await fs.writeFile(
            configPath,
            `import { defineMain } from "@storybook/react-vite"\nexport default defineMain({ stories: [], addons: [] })`,
        )

        await storybookModule.run({ ...ctx, moduleOptions: { storybook: true } })

        const content = await fs.readFile(configPath, "utf-8")
        expect(content).toContain("@mochi-css/storybook")
    })

    it("adds the addon to an identifier-exported config", async () => {
        await fs.mkdir(path.join(tmpDir, ".storybook"), { recursive: true })
        const configPath = path.join(tmpDir, ".storybook", "main.ts")
        await fs.writeFile(configPath, `const config = { stories: [], addons: [] }\nexport default config`)

        await storybookModule.run({ ...ctx, moduleOptions: { storybook: true } })

        const content = await fs.readFile(configPath, "utf-8")
        expect(content).toContain("@mochi-css/storybook")
    })

    it("adds an addons array when the config has none", async () => {
        await fs.mkdir(path.join(tmpDir, ".storybook"), { recursive: true })
        const configPath = path.join(tmpDir, ".storybook", "main.ts")
        await fs.writeFile(configPath, `export default { stories: [] }`)

        await storybookModule.run({ ...ctx, moduleOptions: { storybook: true } })

        const content = await fs.readFile(configPath, "utf-8")
        expect(content).toContain("addons")
        expect(content).toContain("@mochi-css/storybook")
    })

    it("does not add the addon twice when already present", async () => {
        await fs.mkdir(path.join(tmpDir, ".storybook"), { recursive: true })
        const configPath = path.join(tmpDir, ".storybook", "main.ts")
        await fs.writeFile(configPath, `export default { stories: [], addons: ["@mochi-css/storybook"] }`)

        await storybookModule.run({ ...ctx, moduleOptions: { storybook: true } })

        const content = await fs.readFile(configPath, "utf-8")
        expect(content.match(/@mochi-css\/storybook/g)).toHaveLength(1)
    })

    it("uses the config path given as a string option", async () => {
        const custom = "storybook-main.ts"
        await fs.writeFile(path.join(tmpDir, custom), `export default { stories: [], addons: [] }`)

        await storybookModule.run({ ...ctx, moduleOptions: { storybook: custom } })

        const content = await fs.readFile(path.join(tmpDir, custom), "utf-8")
        expect(content).toContain("@mochi-css/storybook")
    })

    it("returns early when the user cancels the path prompt", async () => {
        vi.mocked(p.confirm).mockResolvedValue(true)
        vi.mocked(p.isCancel).mockReturnValueOnce(true)
        vi.mocked(p.text).mockResolvedValue(path.join(".storybook", "main.ts"))

        await storybookModule.run(ctx)

        expect(p.log.success).not.toHaveBeenCalled()
    })
})
