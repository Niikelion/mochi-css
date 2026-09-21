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

/** Request a source module through the dev server so Vite transforms it and registers its imports. */
async function fetchModule(port: string, urlPath: string): Promise<string> {
    const res = await fetch(`http://localhost:${port}${urlPath}`)
    return res.ok ? await res.text() : ""
}

/** Poll a source module until the transformed output references `marker`, or the deadline passes. */
async function pollModule(port: string, urlPath: string, marker: string, timeout: number): Promise<string> {
    let body = ""
    const deadline = Date.now() + timeout
    while (Date.now() < deadline && !body.includes(marker)) {
        await sleep(300)
        try {
            body = await fetchModule(port, urlPath)
        } catch {
            // server may briefly restart while it re-collects
        }
    }
    return body
}

/** Poll an arbitrary URL until its body contains `marker`, or the deadline passes. */
async function pollModuleUrl(url: string, marker: string, timeout: number): Promise<string> {
    let body = ""
    const deadline = Date.now() + timeout
    while (Date.now() < deadline && !body.includes(marker)) {
        await sleep(300)
        try {
            const res = await fetch(url)
            if (res.ok) body = await res.text()
        } catch {
            // server may briefly restart while it re-collects
        }
    }
    return body
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
                const stylesPathNorm = stylesPath.replaceAll("\\", "/")
                const hash = fileHash(stylesPathNorm)
                const cssUrl = `http://localhost:${port}/@id/__x00__virtual:mochi-css/${hash}.css`

                // Fetch initial CSS module
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

    it(
        "HMR: picks up a newly added component while the server is running",
        async () => {
            const dev = spawnDev(tmpDir)

            try {
                const match = await dev.waitFor(/localhost:(?:\x1b\[[0-9;]*m)*(\d+)/, 30_000)
                const port = match[1]
                await dev.waitFor(/ready in/i, 15_000)

                // Prime the graph: load the entry so its module (and imports) are known.
                await fetchModule(port, "/src/main.ts")

                // Add a component that did not exist when the server started, and import it
                // from the entry — the realistic "I added a new component" flow.
                const extraPath = path.join(tmpDir, "src", "extra.ts")
                const extraHash = fileHash(extraPath.replaceAll("\\", "/"))
                await fs.writeFile(
                    extraPath,
                    `import { css } from "@mochi-css/vanilla"\nexport const extra = css({ color: "chartreuse", height: "333px" })\n`,
                )
                await fs.writeFile(
                    path.join(tmpDir, "src", "main.ts"),
                    `import { box } from "./styles"\nimport "./extra"\nconst el = document.getElementById("app")\nif (el) {\n    el.className = box.variant({})\n}\n`,
                )

                // The new component's source is served, transformed, with its CSS import wired in —
                // i.e. the dev server picked up the added file instead of erroring.
                const extraSrc = await pollModule(port, "/src/extra.ts", extraHash, 20_000)
                expect(extraSrc).toContain(extraHash)

                // And its extracted CSS is now served.
                const extraCssUrl = `http://localhost:${port}/@id/__x00__virtual:mochi-css/${extraHash}.css`
                let extraCss = ""
                const deadline = Date.now() + 15_000
                while (Date.now() < deadline && !extraCss.includes("333px")) {
                    await sleep(300)
                    try {
                        const res = await fetch(extraCssUrl)
                        if (res.ok) extraCss = await res.text()
                    } catch {
                        // server may briefly restart
                    }
                }
                expect(extraCss).toContain("333px")
                expect(extraCss).toContain("chartreuse")

                // Server is still healthy: the entry still serves.
                const mainRes = await fetch(`http://localhost:${port}/src/main.ts`)
                expect(mainRes.ok).toBe(true)
            } finally {
                dev.proc.kill()
                await sleep(500)
            }
        },
        HMR_TIMEOUT,
    )

    it(
        "HMR: handles a moved/renamed component while the server is running",
        async () => {
            const dev = spawnDev(tmpDir)

            try {
                const match = await dev.waitFor(/localhost:(?:\x1b\[[0-9;]*m)*(\d+)/, 30_000)
                const port = match[1]
                await dev.waitFor(/ready in/i, 15_000)

                // Establish a known component at the original location and prime the graph.
                const oldPath = path.join(tmpDir, "src", "styles.ts")
                await fs.writeFile(
                    oldPath,
                    `import { css } from "@mochi-css/vanilla"\nexport const box = css({ backgroundColor: "indigo", width: "175px" })\n`,
                )
                await fs.writeFile(
                    path.join(tmpDir, "src", "main.ts"),
                    `import { box } from "./styles"\nconst el = document.getElementById("app")\nif (el) {\n    el.className = box.variant({})\n}\n`,
                )
                await fetchModule(port, "/src/main.ts")

                // Move the component into a new folder and update the importer.
                const newDir = path.join(tmpDir, "src", "widgets")
                await fs.mkdir(newDir, { recursive: true })
                const newPath = path.join(newDir, "moved.ts")
                await fs.rename(oldPath, newPath)
                await fs.writeFile(
                    path.join(tmpDir, "src", "main.ts"),
                    `import { box } from "./widgets/moved"\nconst el = document.getElementById("app")\nif (el) {\n    el.className = box.variant({})\n}\n`,
                )

                // The moved component is served from its new location with CSS wired in —
                // the rename (delete + add) did not break the server.
                const newHash = fileHash(newPath.replaceAll("\\", "/"))
                const movedSrc = await pollModule(port, "/src/widgets/moved.ts", newHash, 20_000)
                expect(movedSrc).toContain(newHash)

                // Its CSS is served from the new hash.
                const newCssUrl = `http://localhost:${port}/@id/__x00__virtual:mochi-css/${newHash}.css`
                let movedCss = ""
                const deadline = Date.now() + 15_000
                while (Date.now() < deadline && !movedCss.includes("175px")) {
                    await sleep(300)
                    try {
                        const res = await fetch(newCssUrl)
                        if (res.ok) movedCss = await res.text()
                    } catch {
                        // server may briefly restart (full-reload on the delete event)
                    }
                }
                expect(movedCss).toContain("175px")
                expect(movedCss).toContain("indigo")

                // Server is still healthy after the move.
                const mainRes = await fetch(`http://localhost:${port}/src/main.ts`)
                expect(mainRes.ok).toBe(true)
            } finally {
                dev.proc.kill()
                await sleep(500)
            }
        },
        HMR_TIMEOUT,
    )

    it(
        "HMR: recovers after a fatal extraction error without restarting the dev server",
        async () => {
            const dev = spawnDev(tmpDir)

            try {
                const match = await dev.waitFor(/localhost:(?:\x1b\[[0-9;]*m)*(\d+)/, 30_000)
                const port = match[1]
                await dev.waitFor(/ready in/i, 15_000)

                const stylesPath = path.join(tmpDir, "src", "styles.ts")
                const stylesHash = fileHash(stylesPath.replaceAll("\\", "/"))
                const cssUrl = `http://localhost:${port}/@id/__x00__virtual:mochi-css/${stylesHash}.css`

                // Establish a known-good baseline. Earlier tests in this file may have left
                // main.ts importing from elsewhere — point it back at ./styles explicitly.
                await fs.writeFile(
                    stylesPath,
                    `import { css } from "@mochi-css/vanilla"\nexport const box = css({ backgroundColor: "gold", width: "111px" })\n`,
                )
                await fs.writeFile(
                    path.join(tmpDir, "src", "main.ts"),
                    `import { box } from "./styles"\nconst el = document.getElementById("app")\nif (el) {\n    el.className = box.variant({})\n}\n`,
                )
                await fetchModule(port, "/src/main.ts")
                const baselineCss = await pollModuleUrl(cssUrl, "111px", 15_000)
                expect(baselineCss).toContain("gold")

                // Introduce a fatal error — a syntax error fails at parse time, before per-file
                // try/catch isolation can apply, so this is a genuine "whole extraction fails"
                // case (unlike a runtime throw inside a component, which #44 now isolates).
                await fs.writeFile(stylesPath, `import { css } from "@mochi-css/vanilla"\nexport const box = css({\n`)

                // The dev server must not crash or hang: give the broken save a moment to be
                // picked up, then confirm the process is still alive and still serving.
                await sleep(1_500)
                expect(dev.proc.exitCode).toBeNull()
                const duringBreakRes = await fetch(`http://localhost:${port}/src/main.ts`)
                expect(duringBreakRes.ok).toBe(true)

                // Fix the file — recovery must happen from this same still-running dev server,
                // with no restart.
                await fs.writeFile(
                    stylesPath,
                    `import { css } from "@mochi-css/vanilla"\nexport const box = css({ backgroundColor: "teal", width: "222px" })\n`,
                )
                const recoveredCss = await pollModuleUrl(cssUrl, "222px", 20_000)
                expect(recoveredCss).toContain("teal")
            } finally {
                dev.proc.kill()
                await sleep(500)
            }
        },
        HMR_TIMEOUT,
    )
})
