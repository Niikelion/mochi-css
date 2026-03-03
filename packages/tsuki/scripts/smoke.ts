/**
 * Smoke test script — runs addToConfig against each fixture directory.
 * Usage: yarn workspace @mochi-css/tsuki smoke
 */
import * as fs from "fs/promises"
import * as fsExtra from "fs-extra"
import * as path from "path"
import * as os from "os"
import { addToConfig, findPostcssConfig } from "../src/modules/postcss"

const fixturesDir = path.resolve(__dirname, "../fixtures")

async function runFixture(name: string): Promise<void> {
    const fixtureDir = path.join(fixturesDir, name)
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), `mochi-smoke-${name}-`))
    const origCwd = process.cwd()

    try {
        process.chdir(fixtureDir)
        const configFile = findPostcssConfig()
        process.chdir(origCwd)

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
            // No postcss config found — triggers new-file creation
            process.chdir(tmpDir)
            console.log(`\n=== ${name}/ (empty) — creating new file ===`)
            await addToConfig("nonexistent.config.ts")
            const created = path.join(tmpDir, "postcss.config.mts")
            const content = await fs.readFile(created, "utf-8")
            console.log(`Created postcss.config.mts:\n${content}`)
        }
    } finally {
        process.chdir(origCwd)
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
