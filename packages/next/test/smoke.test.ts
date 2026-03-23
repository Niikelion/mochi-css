import { describe, it, beforeAll, afterAll, expect } from "vitest"
import * as fs from "fs/promises"
import fsSync from "fs"
import * as path from "path"
import * as os from "os"
import { spawn, type ChildProcess } from "child_process"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const mochiRoot = path.resolve(__dirname, "../../..")
const fixturesDir = path.resolve(__dirname, "../fixtures")
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm"

const SETUP_TIMEOUT = 180_000
const TEST_TIMEOUT = 30_000
const WATCHER_TIMEOUT = 120_000

let tmpDir: string
let devProc: ChildProcess | undefined
let manifestPath: string
let mochiDir: string
let devLogPath: string

beforeAll(async () => {
    const builderDist = path.join(mochiRoot, "packages/builder/dist/index.js")
    const nextDist = path.join(mochiRoot, "packages/next/dist/index.js")
    if (!fsSync.existsSync(builderDist))
        throw new Error("@mochi-css/builder not built — run `yarn workspace @mochi-css/builder build` first")
    if (!fsSync.existsSync(nextDist))
        throw new Error("@mochi-css/next not built — run `yarn workspace @mochi-css/next build` first")

    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "mochi-next-smoke-"))
    mochiDir = path.join(tmpDir, ".mochi")
    manifestPath = path.join(mochiDir, "manifest.json")
    devLogPath = path.join(tmpDir, "dev.log")

    await fs.cp(path.join(fixturesDir, "simple"), tmpDir, { recursive: true })

    const pkgPath = path.join(tmpDir, "package.json")
    const pkg = await fs.readFile(pkgPath, "utf-8")
    const mochiRootNorm = mochiRoot.replace(/\\/g, "/")
    await fs.writeFile(pkgPath, pkg.replaceAll("__MOCHI_ROOT__", mochiRootNorm))

    await runProcess(npmCmd, ["install"], tmpDir)

    // Redirect subprocess output to a log file so its stdout writes never block
    // its event loop (pipe saturation on Windows blocks fs.watch IOCP callbacks)
    devProc = spawnDev(tmpDir)
    await waitForFile(manifestPath, 60_000)
}, SETUP_TIMEOUT)

afterAll(async () => {
    devProc?.kill()
    await sleep(1_500)
    if (tmpDir) {
        try {
            await fs.rm(tmpDir, { recursive: true, force: true })
        } catch {
            // Ignore cleanup failures on Windows (EBUSY)
        }
    }
})

const isWin = process.platform === "win32"

function runProcess(cmd: string, args: string[], cwd: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const proc = spawn(cmd, args, { cwd, stdio: "pipe", shell: isWin })
        proc.on("close", code => (code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(" ")} exited ${code}`))))
        proc.on("error", reject)
    })
}

function spawnDev(cwd: string): ChildProcess {
    // Write stdout+stderr to a log file rather than a pipe. This ensures the
    // subprocess can always write without blocking, keeping its event loop free
    // to deliver fs.watch and setInterval callbacks (critical for the watcher).
    // Using an fd (not a WriteStream) because spawn requires a fully-opened descriptor.
    const logFd = fsSync.openSync(devLogPath, "w")
    const proc = spawn(npmCmd, ["run", "dev"], { cwd, stdio: ["ignore", logFd, logFd], shell: isWin })
    fsSync.closeSync(logFd) // parent closes its copy; child has already inherited it
    return proc
}

async function waitForFile(filePath: string, timeout = 15_000): Promise<void> {
    const deadline = Date.now() + timeout
    while (Date.now() < deadline) {
        if (fsSync.existsSync(filePath)) return
        await sleep(100)
    }
    const devLog = fsSync.existsSync(devLogPath)
        ? fsSync.readFileSync(devLogPath, "utf-8").slice(-3000)
        : "(no log)"
    throw new Error(`Timeout waiting for ${filePath} to exist\ndev server output (last 3000 chars):\n${devLog}`)
}

async function sleep(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms))
}

async function readAllCss(): Promise<string> {
    const manifestRaw = await fs.readFile(manifestPath, "utf-8")
    const manifest = JSON.parse(manifestRaw) as { global?: string; files: Record<string, string> }
    let allCss = ""
    if (manifest.global) allCss += await fs.readFile(manifest.global, "utf-8")
    for (const cssPath of Object.values(manifest.files)) {
        allCss += await fs.readFile(cssPath, "utf-8")
    }
    return allCss
}

describe("next watcher smoke", () => {
    it(
        "creates initial CSS files on dev start",
        async () => {
            const allCss = await readAllCss()
            expect(allCss.length).toBeGreaterThan(0)
            expect(allCss).toContain("background-color")
            expect(allCss).toContain("100px")
        },
        TEST_TIMEOUT,
    )

    it(
        "rebuilds CSS when source file changes",
        async () => {
            // Let the dev server settle before triggering a change
            await sleep(1_000)

            const stylesPath = path.join(tmpDir, "src", "styles.ts")
            await fs.writeFile(
                stylesPath,
                `import { css } from "@mochi-css/vanilla"\nexport const box = css({ backgroundColor: "blue", width: "200px" })\n`,
            )

            // Poll until the CSS output contains the updated values (max 60s)
            const deadline = Date.now() + 60_000
            let allCss = ""
            while (Date.now() < deadline) {
                await sleep(500)
                try {
                    allCss = await readAllCss()
                    if (allCss.includes("blue")) break
                } catch {
                    // CSS files may be momentarily absent during rebuild
                }
            }

            if (!allCss.includes("blue")) {
                const devLog = fsSync.existsSync(devLogPath)
                    ? fsSync.readFileSync(devLogPath, "utf-8").slice(-3000)
                    : "(no log)"
                throw new Error(
                    `CSS was not updated after 60s.\ndev server output (last 3000 chars):\n${devLog}\nCSS content:\n${allCss}`,
                )
            }
            expect(allCss).toContain("200px")
        },
        WATCHER_TIMEOUT,
    )
})
