import { describe, it, beforeAll, afterAll, expect } from "vitest"
import * as fs from "fs/promises"
import fsSync from "fs"
import * as path from "path"
import * as os from "os"
import { spawn, type ChildProcess } from "child_process"
import { fileURLToPath } from "url"
import { fileHash } from "@mochi-css/builder"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const mochiRoot = path.resolve(__dirname, "../../..")
const fixturesDir = path.resolve(__dirname, "../fixtures")
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm"

const INSTALL_TIMEOUT = 120_000
const BUILD_TIMEOUT = 60_000
const HMR_TIMEOUT = 60_000

let tmpDir: string

beforeAll(async () => {
    const builderDist = path.join(mochiRoot, "packages/builder/dist/index.js")
    const viteDist = path.join(mochiRoot, "packages/vite/dist/index.js")
    if (!fsSync.existsSync(builderDist))
        throw new Error("@mochi-css/builder not built — run `yarn workspace @mochi-css/builder build` first")
    if (!fsSync.existsSync(viteDist))
        throw new Error("@mochi-css/vite not built — run `yarn workspace @mochi-css/vite build` first")

    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "mochi-vite-smoke-"))
    await fs.cp(path.join(fixturesDir, "simple"), tmpDir, { recursive: true })

    const pkgPath = path.join(tmpDir, "package.json")
    const pkg = await fs.readFile(pkgPath, "utf-8")
    const mochiRootNorm = mochiRoot.replace(/\\/g, "/")
    await fs.writeFile(pkgPath, pkg.replaceAll("__MOCHI_ROOT__", mochiRootNorm))

    await runProcess(npmCmd, ["install"], tmpDir)
}, INSTALL_TIMEOUT)

afterAll(async () => {
    // Give spawned processes time to release file handles (Windows EBUSY)
    await sleep(1_500)
    if (tmpDir) {
        try {
            await fs.rm(tmpDir, { recursive: true, force: true })
        } catch {
            // Ignore cleanup failures — temp dir will be collected by the OS
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

type DevHandle = {
    proc: ChildProcess
    waitFor(pattern: RegExp, timeout?: number): Promise<RegExpMatchArray>
}

function spawnDev(cwd: string): DevHandle {
    let out = ""
    const waiters: Array<{
        pattern: RegExp
        resolve: (m: RegExpMatchArray) => void
        reject: (e: Error) => void
        timer: ReturnType<typeof setTimeout>
    }> = []

    const proc = spawn(npmCmd, ["run", "dev"], { cwd, stdio: "pipe", shell: isWin })

    const onData = (chunk: Buffer) => {
        out += chunk.toString()
        for (let i = waiters.length - 1; i >= 0; i--) {
            const m = out.match(waiters[i].pattern)
            if (m) {
                clearTimeout(waiters[i].timer)
                waiters[i].resolve(m)
                waiters.splice(i, 1)
            }
        }
    }
    proc.stdout?.on("data", onData)
    proc.stderr?.on("data", onData)

    return {
        proc,
        waitFor(pattern, timeout = 30_000) {
            return new Promise((resolve, reject) => {
                const m = out.match(pattern)
                if (m) { resolve(m); return }
                const timer = setTimeout(
                    () => reject(new Error(`Timeout (${timeout}ms) waiting for ${pattern}\nOutput so far:\n${out}`)),
                    timeout,
                )
                const onClose = () => reject(new Error(`Process closed before matching ${pattern}`))
                proc.on("close", onClose)
                waiters.push({
                    pattern,
                    resolve: m => { proc.off("close", onClose); resolve(m) },
                    reject,
                    timer,
                })
            })
        },
    }
}

async function sleep(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms))
}

describe("vite smoke", () => {
    it(
        "build: produces CSS in dist",
        async () => {
            await runProcess(npmCmd, ["run", "build"], tmpDir)

            const assetsDir = path.join(tmpDir, "dist", "assets")
            const files = await fs.readdir(assetsDir)
            const cssFiles = files.filter(f => f.endsWith(".css"))
            expect(cssFiles.length).toBeGreaterThan(0)

            let allCss = ""
            for (const f of cssFiles) {
                allCss += await fs.readFile(path.join(assetsDir, f), "utf-8")
            }

            expect(allCss).toContain("background-color")
            expect(allCss).toContain("100px")
        },
        BUILD_TIMEOUT,
    )

    it(
        "HMR: updates CSS when source file changes",
        async () => {
            const dev = spawnDev(tmpDir)

            try {
                // Vite wraps the port in ANSI bold codes, so strip them before matching
                const match = await dev.waitFor(/localhost:(?:\x1b\[[0-9;]*m)*(\d+)/, 30_000)
                const port = match[1]

                await dev.waitFor(/ready in/i, 15_000)

                const stylesPath = path.join(tmpDir, "src", "styles.ts")
                const hash = fileHash(stylesPath)
                const cssUrl = `http://localhost:${port}/@id/__x00__virtual:mochi-css/${hash}.css`

                // Fetch initial CSS
                const initialRes = await fetch(cssUrl)
                expect(initialRes.ok, `Failed to fetch ${cssUrl}`).toBe(true)
                const initialCss = await initialRes.text()
                expect(initialCss).toContain("red")

                // Modify source file
                await fs.writeFile(
                    stylesPath,
                    `import { css } from "@mochi-css/vanilla"\nexport const box = css({ backgroundColor: "blue", width: "200px" })\n`,
                )

                // Poll for CSS change (max 15s)
                let updatedCss = initialCss
                const deadline = Date.now() + 15_000
                while (Date.now() < deadline && updatedCss === initialCss) {
                    await sleep(300)
                    try {
                        const res = await fetch(cssUrl)
                        if (res.ok) updatedCss = await res.text()
                    } catch {
                        // server may briefly restart
                    }
                }

                expect(updatedCss).not.toBe(initialCss)
                expect(updatedCss).toContain("blue")
            } finally {
                dev.proc.kill()
                await sleep(500)
            }
        },
        HMR_TIMEOUT,
    )
})
