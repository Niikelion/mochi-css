import { describe, it, expect, vi } from "vitest"
import {
    TransformationPipeline,
    FilteredTransformationPipeline,
    makePipeline,
    makeFilteredPipeline,
} from "./TransformationPipeline"

describe("TransformationPipeline", () => {
    it("returns value unchanged when no transformations registered", async () => {
        const pipeline = new TransformationPipeline<string>()
        expect(await pipeline.transform("hello")).toBe("hello")
    })

    it("applies a single sync transformation", async () => {
        const pipeline = new TransformationPipeline<string>()
        pipeline.registerTransformation((s) => s.toUpperCase())
        expect(await pipeline.transform("hello")).toBe("HELLO")
    })

    it("applies a single async transformation", async () => {
        const pipeline = new TransformationPipeline<string>()
        pipeline.registerTransformation(async (s) => s + "!")
        expect(await pipeline.transform("hello")).toBe("hello!")
    })

    it("chains multiple transformations in registration order", async () => {
        const pipeline = new TransformationPipeline<string>()
        pipeline.registerTransformation((s) => s + "A")
        pipeline.registerTransformation((s) => s + "B")
        pipeline.registerTransformation((s) => s + "C")
        expect(await pipeline.transform("x")).toBe("xABC")
    })

    it("passes extra args to each transformation", async () => {
        const pipeline = new TransformationPipeline<string, [number]>()
        pipeline.registerTransformation((s, n) => `${s}${n}`)
        expect(await pipeline.transform("x", 42)).toBe("x42")
    })

    it("getTransformations returns a copy of the registered transformations", () => {
        const pipeline = new TransformationPipeline<string>()
        const fn1 = vi.fn((s: string) => s)
        const fn2 = vi.fn((s: string) => s)
        pipeline.registerTransformation(fn1)
        pipeline.registerTransformation(fn2)
        const copy = pipeline.getTransformations()
        expect(copy).toEqual([fn1, fn2])
        copy.pop()
        expect(pipeline.getTransformations()).toHaveLength(2)
    })
})

describe("makePipeline", () => {
    it("creates a pipeline that applies all given transformations", async () => {
        const pipeline = makePipeline<string>([(s) => s + "A", (s) => s + "B"])
        expect(await pipeline.transform("x")).toBe("xAB")
    })

    it("creates an empty pipeline when given an empty array", async () => {
        const pipeline = makePipeline<string>([])
        expect(await pipeline.transform("hello")).toBe("hello")
    })
})

describe("FilteredTransformationPipeline", () => {
    it("returns value unchanged when no transformations registered", async () => {
        const pipeline = new FilteredTransformationPipeline<string, { active: boolean }>(({ active }) => active)
        expect(await pipeline.transform("hello")).toBe("hello")
    })

    it("applies transformation when filter passes", async () => {
        const pipeline = new FilteredTransformationPipeline<string, { active: boolean }>(({ active }) => active)
        pipeline.registerTransformation((s) => s.toUpperCase(), { active: true })
        expect(await pipeline.transform("hello")).toBe("HELLO")
    })

    it("skips transformation when filter fails", async () => {
        const pipeline = new FilteredTransformationPipeline<string, { active: boolean }>(({ active }) => active)
        pipeline.registerTransformation((s) => s.toUpperCase(), { active: false })
        expect(await pipeline.transform("hello")).toBe("hello")
    })

    it("applies only the transformations whose filter passes", async () => {
        const pipeline = new FilteredTransformationPipeline<string, { active: boolean }>(({ active }) => active)
        pipeline.registerTransformation((s) => s + "A", { active: true })
        pipeline.registerTransformation((s) => s + "B", { active: false })
        pipeline.registerTransformation((s) => s + "C", { active: true })
        expect(await pipeline.transform("x")).toBe("xAC")
    })

    it("chains passing transformations in registration order", async () => {
        const pipeline = new FilteredTransformationPipeline<string, { active: boolean }>(({ active }) => active)
        pipeline.registerTransformation((s) => s + "1", { active: true })
        pipeline.registerTransformation((s) => s + "2", { active: true })
        expect(await pipeline.transform("x")).toBe("x12")
    })

    it("passes extra args to the filter", async () => {
        const filter = vi.fn((_data: object, flag: boolean) => flag)
        const pipeline = new FilteredTransformationPipeline<string, object, [boolean]>(filter)
        pipeline.registerTransformation((s) => s + "!", {})
        await pipeline.transform("hello", true)
        expect(filter).toHaveBeenCalledWith({}, true)
    })

    it("getTransformations returns a copy of registered entries", () => {
        const pipeline = new FilteredTransformationPipeline<string, { n: number }>(({ n }) => n > 0)
        const fn = vi.fn((s: string) => s)
        pipeline.registerTransformation(fn, { n: 1 })
        const copy = pipeline.getTransformations()
        expect(copy).toHaveLength(1)
        const first = copy[0]
        expect.assert(first !== undefined)
        expect(first.fn).toBe(fn)
        expect(first.ctx).toEqual({ n: 1 })
        copy.pop()
        expect(pipeline.getTransformations()).toHaveLength(1)
    })
})

describe("makeFilteredPipeline", () => {
    it("creates a pipeline with given transformations", async () => {
        const fn = vi.fn((s: string) => s + "!")
        const pipeline = makeFilteredPipeline<string, { active: boolean }>(
            ({ active }) => active,
            [{ fn, ctx: { active: true } }],
        )
        expect(await pipeline.transform("hello")).toBe("hello!")
    })

    it("respects the filter for pre-loaded transformations", async () => {
        const fn = vi.fn((s: string) => s + "!")
        const pipeline = makeFilteredPipeline<string, { active: boolean }>(
            ({ active }) => active,
            [{ fn, ctx: { active: false } }],
        )
        expect(await pipeline.transform("hello")).toBe("hello")
        expect(fn).not.toHaveBeenCalled()
    })
})
