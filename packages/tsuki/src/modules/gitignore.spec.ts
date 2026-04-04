import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import fs from "fs/promises"
import path from "path"
import os from "os"
import { createGitignoreModule } from "./gitignore"

vi.mock("@clack/prompts", () => ({
    isCancel: vi.fn().mockReturnValue(false),
    log: { step: vi.fn(), info: vi.fn(), success: vi.fn(), warn: vi.fn() },
}))

let tmpDir: string
let origCwd: string

beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "mochi-tsuki-gitignore-"))
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
const ctx = {
    requirePackage: noop,
    requirePackages: noop,
    nonInteractive: false as const,
    moduleOptions: {},
}

describe("createGitignoreModule", () => {
    it("creates .gitignore with the entry when no file exists", async () => {
        await createGitignoreModule(".mochi").run(ctx)
        const content = await fs.readFile(path.join(tmpDir, ".gitignore"), "utf-8")
        expect(content).toContain(".mochi")
    })

    it("appends entry to existing .gitignore", async () => {
        await fs.writeFile(path.join(tmpDir, ".gitignore"), "node_modules\n")
        await createGitignoreModule(".mochi").run(ctx)
        const content = await fs.readFile(path.join(tmpDir, ".gitignore"), "utf-8")
        expect(content).toContain("node_modules")
        expect(content).toContain(".mochi")
    })

    it("is idempotent — does not duplicate entry", async () => {
        await createGitignoreModule(".mochi").run(ctx)
        await createGitignoreModule(".mochi").run(ctx)
        const content = await fs.readFile(path.join(tmpDir, ".gitignore"), "utf-8")
        expect(content.match(/\.mochi/g)).toHaveLength(1)
    })

    it("does not add entry when it already exists", async () => {
        await fs.writeFile(path.join(tmpDir, ".gitignore"), "node_modules\n.mochi\n")
        await createGitignoreModule(".mochi").run(ctx)
        const content = await fs.readFile(path.join(tmpDir, ".gitignore"), "utf-8")
        expect(content.match(/\.mochi/g)).toHaveLength(1)
    })

    it("appends with newline separator when existing file has no trailing newline", async () => {
        await fs.writeFile(path.join(tmpDir, ".gitignore"), "node_modules")
        await createGitignoreModule(".mochi").run(ctx)
        const content = await fs.readFile(path.join(tmpDir, ".gitignore"), "utf-8")
        expect(content).toBe("node_modules\n.mochi\n")
    })
})
