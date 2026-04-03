import { describe, it, expect, vi } from "vitest"
import { FullContext } from "./Context"
import type { AstPostProcessor } from "@mochi-css/builder"

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {}

describe("FullContext", () => {
    it("exposes a filePreProcess pipeline", () => {
        const ctx = new FullContext(noop)
        expect(ctx.filePreProcess).toBeDefined()
        expect(typeof ctx.filePreProcess.registerTransformation).toBe("function")
    })

    it("applies a transformation to a file that has no filter (matches all)", async () => {
        const ctx = new FullContext(noop)
        const transform = vi.fn((src: string) => src + "//transformed")
        ctx.filePreProcess.registerTransformation(transform, {})
        const result = await ctx.filePreProcess.transform("const x = 1", { filePath: "src/foo.ts" })
        expect(transform).toHaveBeenCalledOnce()
        expect(result).toBe("const x = 1//transformed")
    })

    it("applies a transformation when the file matches the glob filter", async () => {
        const ctx = new FullContext(noop)
        const transform = vi.fn((src: string) => src + "//ts")
        ctx.filePreProcess.registerTransformation(transform, { filter: "*.ts" })
        await ctx.filePreProcess.transform("", { filePath: "src/foo.ts" })
        expect(transform).toHaveBeenCalledOnce()
    })

    it("skips a transformation when the file does not match the glob filter", async () => {
        const ctx = new FullContext(noop)
        const transform = vi.fn((src: string) => src + "//ts")
        ctx.filePreProcess.registerTransformation(transform, { filter: "*.ts" })
        const result = await ctx.filePreProcess.transform("original", { filePath: "src/foo.js" })
        expect(transform).not.toHaveBeenCalled()
        expect(result).toBe("original")
    })

    it("applies only matching transformations when multiple are registered", async () => {
        const ctx = new FullContext(noop)
        const tsTransform = vi.fn((src: string) => src + "//ts")
        const jsTransform = vi.fn((src: string) => src + "//js")
        ctx.filePreProcess.registerTransformation(tsTransform, { filter: "*.ts" })
        ctx.filePreProcess.registerTransformation(jsTransform, { filter: "*.js" })
        await ctx.filePreProcess.transform("", { filePath: "src/foo.ts" })
        expect(tsTransform).toHaveBeenCalledOnce()
        expect(jsTransform).not.toHaveBeenCalled()
    })

    it("caches the regex for a repeated filter string", async () => {
        const ctx = new FullContext(noop)
        const t1 = vi.fn((src: string) => src)
        const t2 = vi.fn((src: string) => src)
        ctx.filePreProcess.registerTransformation(t1, { filter: "*.ts" })
        ctx.filePreProcess.registerTransformation(t2, { filter: "*.ts" })
        await ctx.filePreProcess.transform("", { filePath: "src/foo.ts" })
        expect(t1).toHaveBeenCalledOnce()
        expect(t2).toHaveBeenCalledOnce()
    })

    it("creates an independent filePreProcess per FullContext instance", () => {
        const ctx1 = new FullContext(noop)
        const ctx2 = new FullContext(noop)
        expect(ctx1.filePreProcess).not.toBe(ctx2.filePreProcess)
    })

    it("exposes a sourceTransforms hook provider", () => {
        const ctx = new FullContext(noop)
        expect(ctx.sourceTransforms).toBeDefined()
        expect(typeof ctx.sourceTransforms.register).toBe("function")
    })

    it("sourceTransforms.getAll returns registered hooks", () => {
        const ctx = new FullContext(noop)
        const hook = vi.fn()
        ctx.sourceTransforms.register(hook)
        const hooks = ctx.sourceTransforms.getAll()
        expect(hooks).toHaveLength(1)
        expect(typeof hooks[0]).toBe("function")
    })

    it("sourceTransforms.getAll returns each registered hook directly", async () => {
        const ctx = new FullContext(noop)
        const hook = vi.fn<AstPostProcessor>()
        ctx.sourceTransforms.register(hook)
        const hooks = ctx.sourceTransforms.getAll()
        const fakeIndex = {} as Parameters<AstPostProcessor>[0]
        const fakeContext = {} as Parameters<AstPostProcessor>[1]
        await hooks[0]?.(fakeIndex, fakeContext)
        expect(hook).toHaveBeenCalledWith(fakeIndex, fakeContext)
    })

    it("creates an independent sourceTransforms per FullContext instance", () => {
        const ctx1 = new FullContext(noop)
        const ctx2 = new FullContext(noop)
        expect(ctx1.sourceTransforms).not.toBe(ctx2.sourceTransforms)
    })
})
