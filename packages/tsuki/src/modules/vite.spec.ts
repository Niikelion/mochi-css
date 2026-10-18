import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import fs from "fs/promises"
import path from "path"
import os from "os"
import { addMochiToViteSource, viteModule } from "./vite"
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
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "mochi-tsuki-vite-"))
    origCwd = process.cwd()
    process.chdir(tmpDir)
})

afterEach(async () => {
    process.chdir(origCwd)
    await fs.rm(tmpDir, { recursive: true })
    vi.clearAllMocks()
})

const ctx = { requirePackage: noop, requirePackages: noop, nonInteractive: false as const, moduleOptions: {} }

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

describe("addMochiToViteSource", () => {
    it("keeps the rest of a multi-line config untouched", () => {
        const source = [
            "import react from '@vitejs/plugin-react';",
            "import { defineConfig } from 'vite';",
            "",
            "export default defineConfig({",
            "  plugins: [",
            "    react(),",
            "    pwa({",
            "      registerType: 'prompt',",
            "    }),",
            "  ],",
            "  server: { port: 5173 },",
            "});",
            "",
        ].join("\n")
        expect(addMochiToViteSource(source, "vite.config.ts")).toBe(
            [
                "import { mochiCss } from '@mochi-css/vite';",
                "import react from '@vitejs/plugin-react';",
                "import { defineConfig } from 'vite';",
                "",
                "export default defineConfig({",
                "  plugins: [",
                "    react(),",
                "    pwa({",
                "      registerType: 'prompt',",
                "    }),",
                "    mochiCss(),",
                "  ],",
                "  server: { port: 5173 },",
                "});",
                "",
            ].join("\n"),
        )
    })

    it("adds a comma when the last plugin has none", () => {
        const source =
            'import { defineConfig } from "vite"\nexport default defineConfig({\n    plugins: [\n        react()\n    ]\n})\n'
        expect(addMochiToViteSource(source, "vite.config.ts")).toBe(
            'import { mochiCss } from "@mochi-css/vite"\nimport { defineConfig } from "vite"\nexport default defineConfig({\n    plugins: [\n        react(),\n        mochiCss()\n    ]\n})\n',
        )
    })

    it("extends a single-line plugins array on the same line", () => {
        const source = "export default { plugins: [react()] }\n"
        expect(addMochiToViteSource(source, "vite.config.ts")).toBe(
            'import { mochiCss } from "@mochi-css/vite"\nexport default { plugins: [react(), mochiCss()] }\n',
        )
    })

    it("fills an empty plugins array", () => {
        expect(addMochiToViteSource("export default { plugins: [] }", "vite.config.ts")).toBe(
            'import { mochiCss } from "@mochi-css/vite"\nexport default { plugins: [mochiCss()] }',
        )
    })

    it("keeps Windows line endings", () => {
        const source = "export default {\r\n  plugins: [\r\n    react(),\r\n  ],\r\n}\r\n"
        expect(addMochiToViteSource(source, "vite.config.ts")).toBe(
            'import { mochiCss } from "@mochi-css/vite"\r\nexport default {\r\n  plugins: [\r\n    react(),\r\n    mochiCss(),\r\n  ],\r\n}\r\n',
        )
    })

    it("changes nothing when mochiCss() is already set up", () => {
        const source = 'import { mochiCss } from "@mochi-css/vite"\nexport default { plugins: [mochiCss()] }\n'
        expect(addMochiToViteSource(source, "vite.config.ts")).toBe(source)
    })

    it("leaves configs without a plugins array to the AST fallback", () => {
        expect(addMochiToViteSource("export default defineConfig({})", "vite.config.ts")).toBeUndefined()
    })
})
