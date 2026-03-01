import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import fs from "fs/promises"
import path from "path"
import os from "os"
import { findPostcssConfig, addToConfig, postcssModule } from "./postcss"

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
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "mochi-tsuki-unit-"))
    origCwd = process.cwd()
})

afterEach(async () => {
    process.chdir(origCwd)
    await fs.rm(tmpDir, { recursive: true })
})

describe("findPostcssConfig", () => {
    it("returns undefined when no config exists", () => {
        process.chdir(tmpDir)
        expect(findPostcssConfig()).toBeUndefined()
    })

    it("returns filename when postcss.config.mjs exists", async () => {
        await fs.writeFile(path.join(tmpDir, "postcss.config.mjs"), "export default {}")
        process.chdir(tmpDir)
        expect(findPostcssConfig()).toBe("postcss.config.mjs")
    })
})

describe("addToConfig", () => {
    it("creates postcss.config.mts in cwd when path does not exist", async () => {
        process.chdir(tmpDir)
        await addToConfig("nonexistent.config.ts")
        const content = await fs.readFile(path.join(tmpDir, "postcss.config.mts"), "utf-8")
        expect(content).toContain("@mochi-css/postcss")
    })

    it("adds plugin to plain JS config", async () => {
        const configPath = path.join(tmpDir, "postcss.config.js")
        await fs.writeFile(configPath, `export default { plugins: {} }`)
        await addToConfig(configPath)
        const content = await fs.readFile(configPath, "utf-8")
        expect(content).toContain("@mochi-css/postcss")
    })

    it("adds plugin to Next.js-style mjs config with indirect export", async () => {
        const configPath = path.join(tmpDir, "postcss.config.mjs")
        await fs.writeFile(configPath, `const config = { plugins: { tailwindcss: {} } };\nexport default config\n`)
        await addToConfig(configPath)
        const content = await fs.readFile(configPath, "utf-8")
        expect(content).toContain("@mochi-css/postcss")
        expect(content).toContain("tailwindcss")
    })

    it("adds plugin to TypeScript config with defineConfig wrapper", async () => {
        const configPath = path.join(tmpDir, "postcss.config.ts")
        await fs.writeFile(configPath, `export default defineConfig({ plugins: {} })`)
        await addToConfig(configPath)
        const content = await fs.readFile(configPath, "utf-8")
        expect(content).toContain("@mochi-css/postcss")
    })

    it("adds plugin to JSON config", async () => {
        const configPath = path.join(tmpDir, ".postcssrc.json")
        await fs.writeFile(configPath, JSON.stringify({ plugins: {} }))
        await addToConfig(configPath)
        const content = await fs.readFile(configPath, "utf-8")
        const parsed = JSON.parse(content) as { plugins: Record<string, unknown> }
        expect(parsed.plugins["@mochi-css/postcss"]).toBeDefined()
    })

    it("throws for YAML config", async () => {
        const configPath = path.join(tmpDir, ".postcssrc.yml")
        await fs.writeFile(configPath, "plugins:\n  tailwindcss: {}")
        await expect(addToConfig(configPath)).rejects.toThrow("YAML PostCSS config is not supported yet")
    })

    it("throws when identifier export has no matching variable declaration", async () => {
        const configPath = path.join(tmpDir, "postcss.config.mjs")
        await fs.writeFile(configPath, `export default config`)
        await expect(addToConfig(configPath)).rejects.toThrow()
    })

    it("adds plugin to indirect export with multiple declarators", async () => {
        const configPath = path.join(tmpDir, "postcss.config.mjs")
        await fs.writeFile(
            configPath,
            `const other = {}, config = { plugins: { tailwindcss: {} } };\nexport default config\n`,
        )
        await addToConfig(configPath)
        const content = await fs.readFile(configPath, "utf-8")
        expect(content).toContain("@mochi-css/postcss")
        expect(content).toContain("tailwindcss")
    })

    it("adds plugin to indirect export skipping numeric-keyed properties", async () => {
        const configPath = path.join(tmpDir, "postcss.config.mjs")
        await fs.writeFile(
            configPath,
            `const config = { 0: {}, plugins: { tailwindcss: {} } };\nexport default config\n`,
        )
        await addToConfig(configPath)
        const content = await fs.readFile(configPath, "utf-8")
        expect(content).toContain("@mochi-css/postcss")
    })

    it("throws when indirect export object has no plugins property", async () => {
        const configPath = path.join(tmpDir, "postcss.config.mjs")
        await fs.writeFile(configPath, `const config = {};\nexport default config\n`)
        await expect(addToConfig(configPath)).rejects.toThrow()
    })

    it("throws when indirect export variable has no initializer", async () => {
        const configPath = path.join(tmpDir, "postcss.config.mjs")
        await fs.writeFile(configPath, `let config;\nexport default config\n`)
        await expect(addToConfig(configPath)).rejects.toThrow("Failed to add postcss plugin")
    })

    it("adds plugin to indirect export with quoted string key for plugins", async () => {
        const configPath = path.join(tmpDir, "postcss.config.mjs")
        await fs.writeFile(configPath, `const config = { "plugins": {} };\nexport default config\n`)
        await addToConfig(configPath)
        const content = await fs.readFile(configPath, "utf-8")
        expect(content).toContain("@mochi-css/postcss")
    })

    it("throws when default export is not an object", async () => {
        const configPath = path.join(tmpDir, "postcss.config.js")
        await fs.writeFile(configPath, `export default "not-an-object"`)
        await expect(addToConfig(configPath)).rejects.toThrow("Failed to add postcss plugin")
    })

    it("throws when plugins value is not an object", async () => {
        const configPath = path.join(tmpDir, "postcss.config.js")
        await fs.writeFile(configPath, `export default { plugins: "tailwindcss" }`)
        await expect(addToConfig(configPath)).rejects.toThrow("Unrecognized plugins config type")
    })

    it("adds plugin to JSON config that has no existing plugins key", async () => {
        const configPath = path.join(tmpDir, ".postcssrc.json")
        await fs.writeFile(configPath, JSON.stringify({}))
        await addToConfig(configPath)
        const parsed = JSON.parse(await fs.readFile(configPath, "utf-8")) as { plugins: Record<string, unknown> }
        expect(parsed.plugins["@mochi-css/postcss"]).toBeDefined()
    })

    it("throws when JSON config root is not an object", async () => {
        const configPath = path.join(tmpDir, ".postcssrc.json")
        await fs.writeFile(configPath, "42")
        await expect(addToConfig(configPath)).rejects.toThrow()
    })

    it("throws when JSON plugins value is not an object", async () => {
        const configPath = path.join(tmpDir, ".postcssrc.json")
        await fs.writeFile(configPath, JSON.stringify({ plugins: "tailwindcss" }))
        await expect(addToConfig(configPath)).rejects.toThrow()
    })
})

describe("postcssModule.run", () => {
    const noop = () => {
        // no-op
    }
    const ctx = { requirePackage: noop, requirePackages: noop }

    it("returns early when user declines PostCSS", async () => {
        vi.mocked(p.confirm).mockResolvedValue(false)
        await postcssModule.run(ctx)
        expect(p.text).not.toHaveBeenCalled()
    })

    it("returns early when user cancels path prompt", async () => {
        vi.mocked(p.confirm).mockResolvedValue(true)
        vi.mocked(p.isCancel).mockReturnValueOnce(false).mockReturnValueOnce(true)
        vi.mocked(p.text).mockResolvedValue("postcss.config.js")
        await postcssModule.run(ctx)
        expect(p.log.step).not.toHaveBeenCalled()
    })
})
