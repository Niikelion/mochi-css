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
const mochiRoot = path.resolve(__dirname, "../../..")

const TIMEOUT = 30_000
const BUILD_TIMEOUT = 120_000

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

function runCommand(cmd: string, args: string[], cwd: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = []
        const proc = spawn(cmd, args, { cwd, stdio: ["pipe", "pipe", "pipe"], shell: true })
        proc.stdout.on("data", (d: Buffer) => chunks.push(d))
        proc.stderr.on("data", (d: Buffer) => chunks.push(d))
        proc.on("close", (code) => {
            if (code === 0) resolve()
            else reject(new Error(`${cmd} ${args.join(" ")} exited ${code}\n${Buffer.concat(chunks).toString()}`))
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

async function applyOverlay(name: string, dest: string): Promise<void> {
    const overlayDir = path.join(fixturesDir, name + "-overlay")
    if (!fsExtra.existsSync(overlayDir)) return
    const entries = await fs.readdir(overlayDir)
    for (const entry of entries) {
        let content = await fs.readFile(path.join(overlayDir, entry), "utf-8")
        content = content.replaceAll("__MOCHI_ROOT__", mochiRoot.replaceAll("\\", "/"))
        await fs.writeFile(path.join(dest, entry), content)
    }
}

let tmpDir: string

beforeEach(async () => {
    // On Windows, create temp dirs on the same drive as the monorepo so that npm's
    // directory junctions for file: packages stay on the same volume (junctions are
    // same-volume only on Windows; cross-volume junctions silently break)
    const baseDir = process.platform === "win32" ? path.resolve(mochiRoot, ".smoke-tmp") : os.tmpdir()
    await fs.mkdir(baseDir, { recursive: true })
    tmpDir = await fs.mkdtemp(path.join(baseDir, "mochi-smoke-"))
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
            expect(mochi).toContain("@mochi-css/vanilla/config")

            const vite = await fs.readFile(path.join(tmpDir, "vite.config.ts"), "utf-8")
            expect(vite).toContain("mochiCss()")

            await applyOverlay("plain", tmpDir)
            await runCommand("npm", ["install"], tmpDir)
            await runCommand("npm", ["run", "build"], tmpDir)
        },
        BUILD_TIMEOUT,
    )

    it(
        "nextjs fixture (nextjs preset)",
        async () => {
            await copyFixture("nextjs", tmpDir)
            await runTsuki(tmpDir, ["--no-interactive", "--preset", "nextjs", "--next", "next.config.mjs"])

            const mochi = await fs.readFile(path.join(tmpDir, "mochi.config.ts"), "utf-8")
            expect(mochi).toContain(".mochi")
            expect(mochi).toContain("@mochi-css/vanilla-react/config")

            const next = await fs.readFile(path.join(tmpDir, "next.config.mjs"), "utf-8")
            expect(next).toContain("withMochi")

            // postcss plugin must NOT be added to existing postcss config — withMochi() handles all CSS
            const postcss = await fs.readFile(path.join(tmpDir, "postcss.config.mjs"), "utf-8")
            expect(postcss).not.toContain("@mochi-css/postcss")

            await applyOverlay("nextjs", tmpDir)
            await runCommand("npm", ["install"], tmpDir)
            await runCommand("npm", ["run", "build"], tmpDir)
        },
        BUILD_TIMEOUT,
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
