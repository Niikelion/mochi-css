import { describe, it, expect } from "vitest"
import { findAllFiles } from "@/findAllFiles"
import { MochiError } from "@/diagnostics"
import fs from "fs/promises"
import path from "path"
import os from "os"

describe("findAllFiles", () => {
    async function withTempDir(fn: (dir: string) => Promise<void>) {
        const dir = await fs.mkdtemp(path.join(os.tmpdir(), "mochi-test-"))
        try {
            await fn(dir)
        } finally {
            await fs.rm(dir, { recursive: true })
        }
    }

    it("finds .ts and .tsx files", async () => {
        await withTempDir(async (dir) => {
            await fs.writeFile(path.join(dir, "a.ts"), "")
            await fs.writeFile(path.join(dir, "b.tsx"), "")
            await fs.writeFile(path.join(dir, "c.js"), "")

            const files = await findAllFiles(dir)
            const names = files.map(f => path.basename(f))
            expect(names).toContain("a.ts")
            expect(names).toContain("b.tsx")
            expect(names).not.toContain("c.js")
        })
    })

    it("recurses into subdirectories", async () => {
        await withTempDir(async (dir) => {
            const sub = path.join(dir, "sub")
            await fs.mkdir(sub)
            await fs.writeFile(path.join(sub, "nested.ts"), "")

            const files = await findAllFiles(dir)
            const names = files.map(f => path.basename(f))
            expect(names).toContain("nested.ts")
        })
    })

    it("returns empty array for empty directory", async () => {
        await withTempDir(async (dir) => {
            const files = await findAllFiles(dir)
            expect(files).toEqual([])
        })
    })

    it("throws MochiError for nonexistent directory", async () => {
        await expect(findAllFiles("/nonexistent/path/abc123"))
            .rejects.toThrow(MochiError)
    })
})