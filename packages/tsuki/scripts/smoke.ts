/**
 * Smoke test script — runs addToConfig against each fixture directory.
 * Usage: yarn workspace @mochi-css/tsuki smoke
 */
import * as fs from "fs/promises"
import * as fsExtra from "fs-extra"
import * as path from "path"
import * as os from "os"
import { addToConfig } from "../src/modules/postcss"

const fixturesDir = path.resolve(__dirname, "../fixtures")

async function runFixture(name: string): Promise<void> {
    const fixtureDir = path.join(fixturesDir, name)
    const entries = await fs.readdir(fixtureDir)
    const configFile = entries.find((e) => e !== ".gitkeep")

    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), `mochi-smoke-${name}-`))

    try {
        if (configFile !== undefined) {
            const src = path.join(fixtureDir, configFile)
            const dst = path.join(tmpDir, configFile)
            await fsExtra.copy(src, dst)

            const before = await fs.readFile(dst, "utf-8")
            console.log(`\n=== ${name}/${configFile} — before ===\n${before}`)

            await addToConfig(dst)

            const after = await fs.readFile(dst, "utf-8")
            console.log(`=== ${name}/${configFile} — after ===\n${after}`)
        } else {
            // Empty fixture — triggers new-file creation
            const origCwd = process.cwd()
            process.chdir(tmpDir)
            console.log(`\n=== ${name}/ (empty) — creating new file ===`)
            await addToConfig("nonexistent.config.ts")
            const created = path.join(tmpDir, "postcss.config.mts")
            const content = await fs.readFile(created, "utf-8")
            console.log(`Created postcss.config.mts:\n${content}`)
            process.chdir(origCwd)
        }
    } finally {
        await fs.rm(tmpDir, { recursive: true })
    }
}

async function main(): Promise<void> {
    const fixtures = await fs.readdir(fixturesDir)
    let failed = false

    for (const name of fixtures) {
        try {
            await runFixture(name)
        } catch (err) {
            const isExpected = name === "empty" && err instanceof Error && err.message.includes("YAML")
            if (!isExpected) {
                console.error(`\nFAILED [${name}]:`, err)
                failed = true
            }
        }
    }

    if (failed) {
        process.exit(1)
    } else {
        console.log("\nAll fixtures passed.")
    }
}

void main()
