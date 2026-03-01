import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import fs from "fs/promises"
import path from "path"
import os from "os"

vi.mock("@clack/prompts", () => ({
    confirm: vi.fn(),
    text: vi.fn(),
    isCancel: vi.fn().mockReturnValue(false),
    log: { step: vi.fn(), info: vi.fn(), success: vi.fn() },
    intro: vi.fn(),
    outro: vi.fn(),
    multiselect: vi.fn(),
}))

vi.mock("../src/install", () => ({
    installPackages: vi.fn().mockResolvedValue(undefined),
}))

import * as p from "@clack/prompts"
import { installPackages } from "../src/install"
import { ModuleRunner } from "../src/runner"
import { postcssModule } from "../src/modules/postcss"

let tmpDir: string
let origCwd: string

beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "mochi-tsuki-integration-"))
    origCwd = process.cwd()

    await fs.writeFile(
        path.join(tmpDir, "postcss.config.mjs"),
        `const config = { plugins: { tailwindcss: {} } };\nexport default config\n`,
    )

    process.chdir(tmpDir)

    vi.mocked(p.confirm).mockResolvedValue(true)
    vi.mocked(p.text).mockResolvedValue("postcss.config.mjs")
})

afterEach(async () => {
    process.chdir(origCwd)
    await fs.rm(tmpDir, { recursive: true })
    vi.clearAllMocks()
})

describe("postcss integration", () => {
    it("adds mochi plugin to config and queues package install", async () => {
        const runner = new ModuleRunner()
        runner.register(postcssModule)
        await runner.run()

        const modified = await fs.readFile(path.join(tmpDir, "postcss.config.mjs"), "utf-8")
        expect(modified).toContain("@mochi-css/postcss")
        expect(modified).toContain("tailwindcss")
        expect(installPackages).toHaveBeenCalledWith([{ name: "@mochi-css/postcss", dev: true }])
    })
})
