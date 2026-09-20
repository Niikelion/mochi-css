import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import fs from "fs/promises"
import path from "path"
import os from "os"
import { tsdownModule, findTsdownConfig } from "./tsdown"
import { noop } from "@mochi-css/core"

vi.mock("@clack/prompts", () => ({
    text: vi.fn(),
    isCancel: vi.fn().mockReturnValue(false),
    log: { step: vi.fn(), info: vi.fn(), success: vi.fn() },
}))

import * as p from "@clack/prompts"

let tmpDir: string
let origCwd: string

beforeEach(async () => {
    vi.stubGlobal("__VERSION__", "2.1.0")
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "mochi-tsuki-tsdown-"))
    origCwd = process.cwd()
    process.chdir(tmpDir)
})

afterEach(async () => {
    process.chdir(origCwd)
    await fs.rm(tmpDir, { recursive: true })
    vi.clearAllMocks()
})

const ctx = { requirePackage: noop, requirePackages: noop, nonInteractive: false as const, moduleOptions: {} }

describe("findTsdownConfig", () => {
    it("returns undefined when no config file exists", () => {
        expect(findTsdownConfig()).toBeUndefined()
    })

    it("finds an existing tsdown.config.mts", async () => {
        await fs.writeFile(path.join(tmpDir, "tsdown.config.mts"), "export default {}")
        expect(findTsdownConfig()).toBe("tsdown.config.mts")
    })
})

describe("tsdownModule.run", () => {
    it("creates default tsdown.config.mts with mochiCss() when none exists (non-interactive)", async () => {
        await tsdownModule.run({ ...ctx, nonInteractive: true })
        const content = await fs.readFile(path.join(tmpDir, "tsdown.config.mts"), "utf-8")
        expect(content).toContain("mochiCss()")
        expect(content).toContain(`from "@mochi-css/rolldown"`)
        expect(content).toContain(`from "tsdown"`)
    })

    it("creates the default config when tsdown option is passed with no existing config", async () => {
        await tsdownModule.run({ ...ctx, moduleOptions: { tsdown: true } })
        const content = await fs.readFile(path.join(tmpDir, "tsdown.config.mts"), "utf-8")
        expect(content).toContain("mochiCss()")
    })

    it("patches an existing tsdown.config.mts to add mochiCss()", async () => {
        const configPath = path.join(tmpDir, "tsdown.config.mts")
        await fs.writeFile(
            configPath,
            `import { defineConfig } from "tsdown"\nexport default defineConfig({ entry: ["src/index.ts"], plugins: [] })\n`,
        )
        await tsdownModule.run({ ...ctx, moduleOptions: { tsdown: true } })
        const content = await fs.readFile(configPath, "utf-8")
        expect(content).toContain("mochiCss()")
        expect(content).toContain(`from "@mochi-css/rolldown"`)
    })

    it("patches a defineConfig array-form config", async () => {
        const configPath = path.join(tmpDir, "tsdown.config.mts")
        await fs.writeFile(
            configPath,
            `import { defineConfig } from "tsdown"\nexport default defineConfig([{ entry: ["src/index.ts"], plugins: [] }])\n`,
        )
        await tsdownModule.run({ ...ctx, moduleOptions: { tsdown: true } })
        const content = await fs.readFile(configPath, "utf-8")
        expect(content).toContain("mochiCss()")
    })

    it("uses the config path given as a string option", async () => {
        const custom = "build.config.ts"
        await fs.writeFile(
            path.join(tmpDir, custom),
            `import { defineConfig } from "tsdown"\nexport default defineConfig({ plugins: [] })\n`,
        )
        await tsdownModule.run({ ...ctx, moduleOptions: { tsdown: custom } })
        const content = await fs.readFile(path.join(tmpDir, custom), "utf-8")
        expect(content).toContain("mochiCss()")
    })

    it("prompts for the config path and returns early when the user cancels", async () => {
        vi.mocked(p.isCancel).mockReturnValueOnce(true)
        vi.mocked(p.text).mockResolvedValue("tsdown.config.mts")
        await tsdownModule.run(ctx)
        expect(p.log.success).not.toHaveBeenCalled()
    })
})
