import { readFileSync, writeFileSync, existsSync } from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, "..")

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

interface BenchmarkOutput {
    timestamp: string
    machine: string
    fixture: string
    results: BenchmarkResult[]
}

function fmtMs(ms: number | null): string {
    if (ms === null) return "—"
    if (ms >= 1000) return `${(ms / 1000).toFixed(1)} s`
    return `${ms} ms`
}

function fmtBytes(bytes: number): string {
    if (bytes === 0) return "0 kB"
    if (bytes < 1024) return `${bytes} B`
    return `${(bytes / 1024).toFixed(1)} kB`
}

function fmtCls(cls: number | null): string {
    if (cls === null) return "—"
    return cls.toFixed(3)
}

export function generateReport(data: BenchmarkOutput): void {
    const rows = data.results.map((r) => {
        const buildTime = fmtMs(r.coldBuildMs)
        const jsBundle = fmtBytes(r.jsBundleGzip)
        const cssBundle = fmtBytes(r.cssBundleGzip)
        const fcp = fmtMs(r.fcp)
        const tbt = fmtMs(r.tbt)
        const cls = fmtCls(r.cls)
        const note = r.error ? `⚠ build failed` : ""
        return `| \`${r.name}\` | ${buildTime} | ${jsBundle} | ${cssBundle} | ${fcp} | ${tbt} | ${cls} | ${note} |`
    })

    const md = `# CSS-in-JS Benchmark

**Date**: ${data.timestamp}
**Fixture**: ${data.fixture}
**Machine**: ${data.machine}

## Results

| Library | Build Time | JS Bundle (gz) | CSS Output (gz) | FCP | TBT | CLS | Notes |
|---|---|---|---|---|---|---|---|
${rows.join("\n")}

## Notes

- **Build Time**: Cold build (dist/ cleared). Stitches and vanilla-extract include a codegen pre-step; Panda includes \`panda codegen\` + \`panda cssgen\` pre-steps.
- **JS Bundle**: Gzipped sum of all \`.js\` files in \`dist/assets/\`. This is the CSS-in-JS runtime overhead delivered to the browser.
- **CSS Output**: Gzipped sum of all \`.css\` files in \`dist/assets/\`. \`@stitches/react\` injects styles at runtime — no CSS file is produced, so this will be 0.
- **FCP**: First Contentful Paint — time until the browser renders the first text or image.
- **TBT**: Total Blocking Time — sum of blocking time between FCP and TTI; measures main-thread contention.
- **CLS**: Cumulative Layout Shift. All metrics measured via Playwright (Chromium headless) with CDP throttling: Slow 4G (~1.6 Mbps, 150 ms RTT) + 8× CPU slowdown applied to localhost.
- \`tailwindcss\` produces no JS bundle — all styles are utility classes in the CSS file.
`

    const resultsDir = path.join(root, "results")
    const latestMd = path.join(resultsDir, "latest.md")
    const dateMd = path.join(resultsDir, `${data.timestamp}.md`)
    writeFileSync(latestMd, md)
    writeFileSync(dateMd, md)
    console.log(`Report written to ${latestMd}`)
}

// Allow running standalone: `tsx scripts/report.ts`
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
    const latestJson = path.join(root, "results", "latest.json")
    if (!existsSync(latestJson)) {
        console.error("No results/latest.json found. Run `yarn benchmark` first.")
        process.exit(1)
    }
    const data: BenchmarkOutput = JSON.parse(readFileSync(latestJson, "utf8"))
    generateReport(data)
}
