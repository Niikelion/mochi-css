import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest"
import * as fs from "fs/promises"
import * as fsExtra from "fs-extra"
import * as path from "path"
import * as os from "os"
import { spawn } from "child_process"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const distPath = path.resolve(__dirname, "../dist/index.js")
const fixturesDir = path.resolve(__dirname, "../fixtures")

const TIMEOUT = 30_000

beforeAll(() => {
    if (!fsExtra.existsSync(distPath))
        throw new Error("dist/index.js not found — run `yarn workspace @mochi-css/tsuki build` first")
})

function runTsuki(cwd: string, args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
        const proc = spawn(process.execPath, [distPath, ...args], {
            cwd,
            stdio: ["pipe", "pipe", "pipe"],
        })
        // Close stdin immediately so clack prompts receive EOF and cancel cleanly
        proc.stdin.end()
        proc.on("close", (code) => {
            if (code === 0) resolve()
            else reject(new Error(`tsuki exited ${code}`))
        })
        proc.on("error", reject)
    })
}

async function copyFixture(name: string, dest: string): Promise<void> {
    const fixtureDir = path.join(fixturesDir, name)
    const entries = await fs.readdir(fixtureDir)
    for (const entry of entries) {
        if (entry !== ".gitkeep") {
            await fsExtra.copy(path.join(fixtureDir, entry), path.join(dest, entry))
        }
    }
}

let tmpDir: string

beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "mochi-smoke-"))
})

afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true })
})

describe("smoke", () => {
    it(
        "plain fixture (vite preset)",
        async () => {
            await copyFixture("plain", tmpDir)
            await runTsuki(tmpDir, [
                "--no-interactive",
                "--preset",
                "vite",
                "--postcss",
                "postcss.config.js",
                "--vite",
                "vite.config.ts",
            ])

            const postcss = await fs.readFile(path.join(tmpDir, "postcss.config.js"), "utf-8")
            expect(postcss).toContain("@mochi-css/postcss")

            const mochi = await fs.readFile(path.join(tmpDir, "mochi.config.ts"), "utf-8")
            expect(mochi).toContain(".mochi")

            const vite = await fs.readFile(path.join(tmpDir, "vite.config.ts"), "utf-8")
            expect(vite).toContain("mochiCss()")
        },
        TIMEOUT,
    )

    it(
        "nextjs fixture (nextjs preset)",
        async () => {
            await copyFixture("nextjs", tmpDir)
            await runTsuki(tmpDir, ["--no-interactive", "--preset", "nextjs", "--next", "next.config.mjs"])

            const postcss = await fs.readFile(path.join(tmpDir, "postcss.config.mjs"), "utf-8")
            expect(postcss).toContain("@mochi-css/postcss")

            const mochi = await fs.readFile(path.join(tmpDir, "mochi.config.ts"), "utf-8")
            expect(mochi).toContain(".mochi")

            const next = await fs.readFile(path.join(tmpDir, "next.config.mjs"), "utf-8")
            expect(next).toContain("withMochi")
        },
        TIMEOUT,
    )

    it(
        "wrapped fixture (lib preset)",
        async () => {
            await copyFixture("wrapped", tmpDir)
            await runTsuki(tmpDir, ["--no-interactive", "--preset", "lib", "--postcss", "postcss.config.ts"])

            const postcss = await fs.readFile(path.join(tmpDir, "postcss.config.ts"), "utf-8")
            expect(postcss).toContain("@mochi-css/postcss")
        },
        TIMEOUT,
    )

    it(
        "json fixture (lib preset)",
        async () => {
            await copyFixture("json", tmpDir)
            await runTsuki(tmpDir, ["--no-interactive", "--preset", "lib", "--postcss", ".postcssrc.json"])

            const raw = await fs.readFile(path.join(tmpDir, ".postcssrc.json"), "utf-8")
            const data = JSON.parse(raw) as { plugins: Record<string, unknown> }
            expect(data.plugins["@mochi-css/postcss"]).toBeDefined()
        },
        TIMEOUT,
    )

    it(
        "empty fixture (lib preset, no existing postcss config)",
        async () => {
            await copyFixture("empty", tmpDir)
            await runTsuki(tmpDir, ["--no-interactive", "--preset", "lib", "--postcss"])

            const postcss = await fs.readFile(path.join(tmpDir, "postcss.config.mjs"), "utf-8")
            expect(postcss).toContain("@mochi-css/postcss")
        },
        TIMEOUT,
    )
})
