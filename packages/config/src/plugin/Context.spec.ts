import { describe, it, expect, vi } from "vitest"
import { FullContext } from "./Context"

describe("FullContext", () => {
    it("exposes a sourceTransform pipeline", () => {
        const ctx = new FullContext()
        expect(ctx.sourceTransform).toBeDefined()
        expect(typeof ctx.sourceTransform.registerTransformation).toBe("function")
    })

    it("applies a transformation to a file that has no filter (matches all)", async () => {
        const ctx = new FullContext()
        const transform = vi.fn((src: string) => src + "//transformed")
        ctx.sourceTransform.registerTransformation(transform, {})
        const result = await ctx.sourceTransform.transform("const x = 1", { filePath: "src/foo.ts" })
        expect(transform).toHaveBeenCalledOnce()
        expect(result).toBe("const x = 1//transformed")
    })

    it("applies a transformation when the file matches the glob filter", async () => {
        const ctx = new FullContext()
        const transform = vi.fn((src: string) => src + "//ts")
        ctx.sourceTransform.registerTransformation(transform, { filter: "*.ts" })
        await ctx.sourceTransform.transform("", { filePath: "src/foo.ts" })
        expect(transform).toHaveBeenCalledOnce()
    })

    it("skips a transformation when the file does not match the glob filter", async () => {
        const ctx = new FullContext()
        const transform = vi.fn((src: string) => src + "//ts")
        ctx.sourceTransform.registerTransformation(transform, { filter: "*.ts" })
        const result = await ctx.sourceTransform.transform("original", { filePath: "src/foo.js" })
        expect(transform).not.toHaveBeenCalled()
        expect(result).toBe("original")
    })

    it("applies only matching transformations when multiple are registered", async () => {
        const ctx = new FullContext()
        const tsTransform = vi.fn((src: string) => src + "//ts")
        const jsTransform = vi.fn((src: string) => src + "//js")
        ctx.sourceTransform.registerTransformation(tsTransform, { filter: "*.ts" })
        ctx.sourceTransform.registerTransformation(jsTransform, { filter: "*.js" })
        await ctx.sourceTransform.transform("", { filePath: "src/foo.ts" })
        expect(tsTransform).toHaveBeenCalledOnce()
        expect(jsTransform).not.toHaveBeenCalled()
    })

    it("caches the regex for a repeated filter string", async () => {
        const ctx = new FullContext()
        const t1 = vi.fn((src: string) => src)
        const t2 = vi.fn((src: string) => src)
        ctx.sourceTransform.registerTransformation(t1, { filter: "*.ts" })
        ctx.sourceTransform.registerTransformation(t2, { filter: "*.ts" })
        await ctx.sourceTransform.transform("", { filePath: "src/foo.ts" })
        expect(t1).toHaveBeenCalledOnce()
        expect(t2).toHaveBeenCalledOnce()
    })

    it("creates an independent sourceTransform per FullContext instance", () => {
        const ctx1 = new FullContext()
        const ctx2 = new FullContext()
        expect(ctx1.sourceTransform).not.toBe(ctx2.sourceTransform)
    })
})
