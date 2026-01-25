import {describe, it, expect} from "vitest"
import {RolldownBundler} from "./Bundler"
import path from "path"
import fs from "fs/promises";

describe("RolldownBundler", () => {
    it("bundles a single file from memory", async () => {
        const bundler = new RolldownBundler()

        const index = path.resolve(process.cwd(), "index.js")

        const result = await bundler.bundle(index, {
            [index]: "export const foo = 42;"
        })

        expect(result).toContain("42")
    })

    it("bundles multiple files with imports from memory", async () => {
        const bundler = new RolldownBundler()

        const index = path.resolve(process.cwd(), "index.js")
        const utils = path.resolve(process.cwd(), "utils.js")

        const result = await bundler.bundle(index, {
            [index]: `import { bar } from "./utils.js"; export const foo = bar + 1;`,
            [utils]: "export const bar = 10;"
        })

        expect(result).toContain("10")
        expect(result).toContain("bar")
    })

    it("resolves relative imports correctly", async () => {
        const bundler = new RolldownBundler()

        const index = path.resolve(process.cwd(), "src", "index.js")
        const helper = path.resolve(process.cwd(), "lib", "helper.js")

        const result = await bundler.bundle(index, {
            [index]: `import { helper } from "../lib/helper.js"; export const value = helper();`,
            [helper]: "export const helper = () => 'hello';"
        })

        expect(result).toContain("hello")
    })

    it("falls back to disk for files not in memory", async () => {
        const bundler = new RolldownBundler()

        const index = path.resolve(process.cwd(), "index.js")
        const helper = path.resolve(process.cwd(), "helper.js")

        await fs.writeFile(helper, "export const a = 5")

        const result = await bundler.bundle(index, {
            [index]: `export * from "./helper.js"`
        })

        await fs.rm(helper)

        expect(result).toBeDefined()
    })

    it("skips undefined files when not referenced", async () => {
        const bundler = new RolldownBundler()

        const index = path.resolve(process.cwd(), "index.js")
        const helper = path.resolve(process.cwd(), "helper.js")

        const result = await bundler.bundle(index, {
            [index]: `console.log("test")`,
            [helper]: undefined
        })

        expect(result).toBeDefined()
    })

    it("correctly resolves absolute imports", async () => {
        const bundler = new RolldownBundler()

        const index = path.resolve(process.cwd(), "index.js")
        const helper = path.resolve(process.cwd(), "helper.js")

        const result = await bundler.bundle(index, {
            [index]: `export * from "${helper.replaceAll(path.win32.sep, path.posix.sep)}"`,
            [helper]: `export const foo = "test"`,
        })

        expect(result).toBeDefined()
    })
})
