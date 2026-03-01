/**
 * Manual testing script — builds tsuki, sets up a fixture in a temp dir, and runs it interactively.
 * Usage: yarn workspace @mochi-css/tsuki manual [fixture-name]
 *        yarn workspace @mochi-css/tsuki manual -a
 */
import * as fs from "fs/promises"
import * as fsExtra from "fs-extra"
import * as path from "path"
import * as os from "os"
import * as p from "@clack/prompts"
import * as pc from "picocolors"
import { spawn } from "child_process"

const fixturesDir = path.resolve(__dirname, "../fixtures")
const distPath = path.resolve(__dirname, "../dist/index.js")

function runTsuki(cwd: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const proc = spawn(process.execPath, [distPath], {
            cwd,
            stdio: "inherit",
        })
        proc.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`tsuki exited with code ${code}`))))
        proc.on("error", reject)
    })
}

async function rootFileContents(dir: string): Promise<Record<string, string>> {
    const result: Record<string, string> = {}
    for (const entry of await fs.readdir(dir)) {
        const stat = await fs.stat(path.join(dir, entry))
        if (stat.isFile()) {
            result[entry] = await fs.readFile(path.join(dir, entry), "utf-8")
        }
    }
    return result
}

async function runFixture(fixtureName: string): Promise<void> {
    const fixtureDir = path.join(fixturesDir, fixtureName)
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), `mochi-manual-${fixtureName}-`))

    try {
        const entries = await fs.readdir(fixtureDir)
        for (const entry of entries) {
            if (entry !== ".gitkeep") {
                await fsExtra.copy(path.join(fixtureDir, entry), path.join(tmpDir, entry))
            }
        }

        console.log(pc.dim(`\nFixture: ${fixtureName}  |  Working directory: ${tmpDir}\n`))

        const before = await rootFileContents(tmpDir)

        await runTsuki(tmpDir)

        // Show files that were added or modified at the root level
        // const after = await rootFileContents(tmpDir)
        // for (const [file, content] of Object.entries(after)) {
        //     if (before[file] !== content) {
        //         console.log(pc.dim(`\n=== ${file} ===\n`) + content)
        //     }
        // }
    } finally {
        await fs.rm(tmpDir, { recursive: true })
    }
}

async function main(): Promise<void> {
    const fixtures = await fs.readdir(fixturesDir)
    const args = process.argv.slice(2)

    if (args[0] === "-a") {
        for (const fixtureName of fixtures) {
            try {
                await runFixture(fixtureName)
            } catch (err) {
                console.error(pc.red(`\nFAILED [${fixtureName}]:`), err)
            }
        }
        return
    }

    let fixtureName = args[0]

    if (!fixtureName) {
        const selected = await p.select({
            message: "Which fixture do you want to test against?",
            options: fixtures.map((f) => ({ value: f, label: f })),
        })
        if (p.isCancel(selected)) process.exit(0)
        fixtureName = selected as string
    }

    if (!fixtures.includes(fixtureName)) {
        console.error(`Unknown fixture "${fixtureName}". Available: ${fixtures.join(", ")}`)
        process.exit(1)
    }

    await runFixture(fixtureName)
}

void main()
