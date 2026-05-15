import { execa } from "execa"
import { gzipSync } from "zlib"
import { readFileSync, readdirSync, rmSync, existsSync, mkdirSync } from "fs"
import path from "path"
import { fileURLToPath } from "url"
import os from "os"
import { createServer } from "http"
import { readFile } from "fs/promises"
import { generateReport } from "./report.ts"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, "..")

interface ImplConfig {
    name: string
    preSteps?: string[][]
    preStepCwd?: string
    preStepCwds?: (string | undefined)[]
}

const implementations: ImplConfig[] = [
    { name: "mochi-vanilla-react" },
    { name: "mochi-stitches", preStepCwd: root, preSteps: [["npx", "tsx", "codegen/index.ts", "mochi-stitches"]] },
    { name: "stitches", preStepCwd: root, preSteps: [["npx", "tsx", "codegen/index.ts", "stitches"]] },
    { name: "vanilla-extract", preStepCwd: root, preSteps: [["npx", "tsx", "codegen/index.ts", "vanilla-extract"]] },
    {
        name: "panda",
        preStepCwds: [root, undefined, undefined],
        preSteps: [["npx", "tsx", "codegen/index.ts", "panda"], ["yarn", "panda", "codegen"], ["yarn", "panda", "cssgen"]],
    },
    { name: "css-modules", preStepCwd: root, preSteps: [["npx", "tsx", "codegen/index.ts", "css-modules"]] },
]

interface BenchmarkResult {
    name: string
    coldBuildMs: number | null
    jsBundleGzip: number
    cssBundleGzip: number
    fcp: number | null
    tbt: number | null
    cls: number | null
    error?: string
}

function gzipSize(filePath: string): number {
    const buf = readFileSync(filePath)
    return gzipSync(buf).byteLength
}

function sumAssets(distDir: string, ext: string): number {
    const assetsDir = path.join(distDir, "assets")
    if (!existsSync(assetsDir)) return 0
    return readdirSync(assetsDir)
        .filter((f) => f.endsWith(ext))
        .reduce((sum, f) => sum + gzipSize(path.join(assetsDir, f)), 0)
}

async function runPlaywrightBenchmark(port: number): Promise<{ fcp: number | null; tbt: number | null; cls: number | null }> {
    const { chromium } = await import("@playwright/test")
    const browser = await chromium.launch({ args: ["--no-sandbox"] })
    try {
        const context = await browser.newContext()
        const page = await context.newPage()

        // CDP throttling applies to localhost (unlike Lighthouse devtools mode on Windows)
        const cdp = await context.newCDPSession(page)
        await cdp.send("Network.enable")
        await cdp.send("Network.emulateNetworkConditions", {
            offline: false,
            // Slow 4G: ~1.6 Mbps down, 150 ms RTT, 8× CPU
            downloadThroughput: Math.round((1474.56 * 1024) / 8),
            uploadThroughput: Math.round((675 * 1024) / 8),
            latency: 150,
        })
        await cdp.send("Emulation.setCPUThrottlingRate", { rate: 8 })

        await page.addInitScript(() => {
            const perf: { longTasks: { start: number; duration: number }[]; cls: number; fcp: number | null } = {
                longTasks: [],
                cls: 0,
                fcp: null,
            }
            ;(window as unknown as Record<string, unknown>)["__perf"] = perf
            new PerformanceObserver((list) => {
                for (const e of list.getEntries()) perf.longTasks.push({ start: e.startTime, duration: e.duration })
            }).observe({ entryTypes: ["longtask"] })
            new PerformanceObserver((list) => {
                for (const e of list.getEntries()) {
                    const shift = e as PerformanceEntry & { hadRecentInput: boolean; value: number }
                    if (!shift.hadRecentInput) perf.cls += shift.value
                }
            }).observe({ entryTypes: ["layout-shift"] })
            new PerformanceObserver((list) => {
                const entry = list.getEntriesByName("first-contentful-paint")[0]
                if (entry) perf.fcp = entry.startTime
            }).observe({ entryTypes: ["paint"] })
        })

        await page.goto(`http://localhost:${port}/`, { waitUntil: "networkidle" })
        // At high CPU throttle the paint can lag behind networkidle — wait for it explicitly
        await page.waitForFunction(
            () => (window as unknown as { __perf: { fcp: number | null } }).__perf.fcp !== null,
            { timeout: 60_000 }
        )

        return await page.evaluate(() => {
            const perf = (window as unknown as { __perf: { longTasks: { start: number; duration: number }[]; cls: number; fcp: number | null } }).__perf
            const fcp = perf.fcp !== null ? Math.round(perf.fcp) : null
            const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined
            const loadEnd = nav?.loadEventEnd ?? performance.now()
            const tbt = Math.round(
                perf.longTasks
                    .filter((t) => fcp !== null && t.start >= fcp && t.start <= loadEnd)
                    .reduce((sum, t) => sum + Math.max(0, t.duration - 50), 0)
            )
            return { fcp, tbt, cls: Number(perf.cls.toFixed(3)) }
        })
    } finally {
        await browser.close()
    }
}

async function startStaticServer(distDir: string, port: number): Promise<() => void> {
    const mime: Record<string, string> = {
        ".js": "text/javascript",
        ".css": "text/css",
        ".html": "text/html",
        ".svg": "image/svg+xml",
        ".woff2": "font/woff2",
        ".woff": "font/woff",
        ".png": "image/png",
        ".ico": "image/x-icon",
    }
    const server = createServer(async (req, res) => {
        let urlPath = (req.url ?? "/").split("?")[0]
        if (urlPath === "/") urlPath = "/index.html"
        const filePath = path.join(distDir, urlPath)
        try {
            const data = await readFile(filePath)
            const ext = path.extname(filePath)
            res.writeHead(200, { "Content-Type": mime[ext] ?? "application/octet-stream" })
            res.end(data)
        } catch {
            // Serve index.html for SPA fallback
            const data = await readFile(path.join(distDir, "index.html"))
            res.writeHead(200, { "Content-Type": "text/html" })
            res.end(data)
        }
    })
    await new Promise<void>((resolve) => server.listen(port, resolve))
    return () => server.close()
}

async function benchmarkImpl(impl: ImplConfig, port: number): Promise<BenchmarkResult> {
    const implDir = path.join(root, "implementations", impl.name)
    const distDir = path.join(implDir, "dist")
    console.log(`\n[${impl.name}] Starting benchmark...`)

    // Clean
    if (existsSync(distDir)) rmSync(distDir, { recursive: true, force: true })
    const viteCacheDir = path.join(implDir, "node_modules", ".vite")
    if (existsSync(viteCacheDir)) rmSync(viteCacheDir, { recursive: true, force: true })

    // Pre-steps (e.g. codegen, panda codegen + cssgen)
    const defaultCwd = impl.preStepCwd ?? implDir
    for (const [i, step] of (impl.preSteps ?? []).entries()) {
        const cwd = impl.preStepCwds?.[i] ?? defaultCwd
        console.log(`[${impl.name}] Running pre-step: ${step.join(" ")}`)
        await execa(step[0], step.slice(1), { cwd, stdio: "inherit" })
    }

    // Build
    console.log(`[${impl.name}] Building...`)
    const start = performance.now()
    let buildError: string | undefined
    try {
        await execa("yarn", ["vite", "build"], { cwd: implDir, stdio: "inherit" })
    } catch (e) {
        buildError = String(e)
        console.error(`[${impl.name}] Build failed: ${buildError}`)
    }
    const coldBuildMs = Math.round(performance.now() - start)

    if (buildError || !existsSync(distDir)) {
        return { name: impl.name, coldBuildMs, jsBundleGzip: 0, cssBundleGzip: 0, fcp: null, tbt: null, cls: null, error: buildError }
    }

    const jsBundleGzip = sumAssets(distDir, ".js")
    const cssBundleGzip = sumAssets(distDir, ".css")
    console.log(`[${impl.name}] Built in ${coldBuildMs}ms. JS: ${jsBundleGzip}B (gz), CSS: ${cssBundleGzip}B (gz)`)

    // Playwright + CDP
    let fcp: number | null = null
    let tbt: number | null = null
    let cls: number | null = null
    console.log(`[${impl.name}] Running Playwright benchmark...`)
    const stopServer = await startStaticServer(distDir, port)
    try {
        const scores = await runPlaywrightBenchmark(port)
        fcp = scores.fcp
        tbt = scores.tbt
        cls = scores.cls
        console.log(`[${impl.name}] FCP: ${fcp}ms, TBT: ${tbt}ms, CLS: ${cls}`)
    } catch (e) {
        console.error(`[${impl.name}] Playwright benchmark failed: ${e}`)
    } finally {
        stopServer()
    }

    return { name: impl.name, coldBuildMs, jsBundleGzip, cssBundleGzip, fcp, tbt, cls }
}

async function main() {
    const resultsDir = path.join(root, "results")
    mkdirSync(resultsDir, { recursive: true })

    const results: BenchmarkResult[] = []
    const BASE_PORT = 5200

    for (const [i, impl] of implementations.entries()) {
        const result = await benchmarkImpl(impl, BASE_PORT + i)
        results.push(result)
    }

    const output = {
        timestamp: new Date().toISOString().slice(0, 10),
        machine: `${os.cpus()[0]?.model ?? "unknown"} (${os.cpus().length} cores, ${Math.round(os.totalmem() / 1e9)}GB RAM)`,
        fixture: "Mock Mochi homepage — Navbar, Hero, Stats, Features, CodeShowcase, ApiCarousel, ComponentExplorer, Cta, Footer",
        results,
    }

    const latestPath = path.join(resultsDir, "latest.json")
    const datePath = path.join(resultsDir, `${output.timestamp}.json`)
    const json = JSON.stringify(output, null, 2)

    import("fs").then(({ writeFileSync }) => {
        writeFileSync(latestPath, json)
        writeFileSync(datePath, json)
        console.log(`\nResults written to ${latestPath}`)
        generateReport(output)
    })
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})
