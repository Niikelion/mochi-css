import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import fs from "fs/promises"
import path from "path"
import os from "os"
import { nextModule } from "./next"

vi.mock("@clack/prompts", () => ({
    text: vi.fn(),
    isCancel: vi.fn().mockReturnValue(false),
    log: { step: vi.fn(), info: vi.fn(), success: vi.fn() },
}))

import * as p from "@clack/prompts"

let tmpDir: string
let origCwd: string

beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "mochi-tsuki-next-"))
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

describe("nextModule.run", () => {
    it("creates next.config.ts with default template when no config exists", async () => {
        vi.mocked(p.text).mockResolvedValue(path.join(tmpDir, "next.config.ts"))
        await nextModule.run(ctx)
        const content = await fs.readFile(path.join(tmpDir, "next.config.ts"), "utf-8")
        expect(content).toContain("withMochi")
        expect(content).toContain("@mochi-css/next")
    })

    it("wraps export default object with withMochi()", async () => {
        const configPath = path.join(tmpDir, "next.config.ts")
        await fs.writeFile(configPath, `export default {}`)
        await nextModule.run(ctx)
        const content = await fs.readFile(configPath, "utf-8")
        expect(content).toContain("withMochi")
        expect(content).toContain("@mochi-css/next")
    })

    it("wraps identifier export with withMochi(varName)", async () => {
        const configPath = path.join(tmpDir, "next.config.ts")
        await fs.writeFile(configPath, `const config = {};\nexport default config`)
        await nextModule.run(ctx)
        const content = await fs.readFile(configPath, "utf-8")
        expect(content).toContain("withMochi(config)")
        expect(content).toContain("@mochi-css/next")
    })

    it("adds import to existing config", async () => {
        const configPath = path.join(tmpDir, "next.config.ts")
        await fs.writeFile(configPath, `export default {}`)
        await nextModule.run(ctx)
        const content = await fs.readFile(configPath, "utf-8")
        expect(content).toContain(`from "@mochi-css/next"`)
    })

    it("returns early when user cancels path prompt", async () => {
        vi.mocked(p.isCancel).mockReturnValueOnce(true)
        vi.mocked(p.text).mockResolvedValue("next.config.ts")
        await nextModule.run(ctx)
        expect(p.log.success).not.toHaveBeenCalled()
    })
})
