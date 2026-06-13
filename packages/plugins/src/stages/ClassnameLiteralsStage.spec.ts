import { describe, it, expect } from "vitest"
import { StageRunner } from "@mochi-css/builder"
import { ClassnameLiteralsStage } from "./ClassnameLiteralsStage"
import { GeneratorsCollectionStage } from "./GeneratorsCollectionStage"
import { StyleGenerator } from "@/types"
import type * as SWC from "@swc/core"
import { noop } from "@mochi-css/core"

class LiteralGenerator extends StyleGenerator {
    constructor(private readonly literalMap: Map<string, SWC.StringLiteral[]> = new Map()) {
        super()
    }
    override mockFunction(): unknown {
        return undefined
    }
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    collectArgs(): void {}
    override async generateStyles() {
        return {}
    }
    override getIdentifierLiterals() {
        return this.literalMap
    }
}

function lit(value: string): SWC.StringLiteral {
    return { type: "StringLiteral", value, span: { start: 0, end: 0, ctxt: 0 } }
}

function buildRunner() {
    return new StageRunner([], [ClassnameLiteralsStage], noop, () => null)
}

describe("ClassnameLiteralsStage — aggregation", () => {
    it("returns empty map when generators produce no literals", () => {
        const runner = buildRunner()
        runner.getInstance(GeneratorsCollectionStage).register(new LiteralGenerator())
        expect(runner.getInstance(ClassnameLiteralsStage).classNameLiterals.get().size).toBe(0)
    })

    it("returns literals from a single generator", () => {
        const runner = buildRunner()
        const node = lit("foo")
        const gen = new LiteralGenerator(new Map([["foo", [node]]]))
        runner.getInstance(GeneratorsCollectionStage).register(gen)
        expect(runner.getInstance(ClassnameLiteralsStage).classNameLiterals.get().get("foo")).toEqual([node])
    })

    it("merges literals from multiple generators with distinct keys", () => {
        const runner = buildRunner()
        const nodeA = lit("a")
        const nodeB = lit("b")
        const gen1 = new LiteralGenerator(new Map([["a", [nodeA]]]))
        const gen2 = new LiteralGenerator(new Map([["b", [nodeB]]]))
        const genColl = runner.getInstance(GeneratorsCollectionStage)
        genColl.register(gen1)
        genColl.register(gen2)
        const result = runner.getInstance(ClassnameLiteralsStage).classNameLiterals.get()
        expect(result.get("a")).toEqual([nodeA])
        expect(result.get("b")).toEqual([nodeB])
    })

    it("merges literal arrays when multiple generators share the same key", () => {
        const runner = buildRunner()
        const n1 = lit("shared")
        const n2 = lit("shared")
        const gen1 = new LiteralGenerator(new Map([["shared", [n1]]]))
        const gen2 = new LiteralGenerator(new Map([["shared", [n2]]]))
        const genColl = runner.getInstance(GeneratorsCollectionStage)
        genColl.register(gen1)
        genColl.register(gen2)
        const result = runner.getInstance(ClassnameLiteralsStage).classNameLiterals.get()
        expect(result.get("shared")).toHaveLength(2)
        expect(result.get("shared")).toContain(n1)
        expect(result.get("shared")).toContain(n2)
    })

    it("preserves literal object identity so downstream mutation works", () => {
        const runner = buildRunner()
        const node = lit("cls")
        const gen = new LiteralGenerator(new Map([["cls", [node]]]))
        runner.getInstance(GeneratorsCollectionStage).register(gen)
        expect(runner.getInstance(ClassnameLiteralsStage).classNameLiterals.get().get("cls")?.[0]).toBe(node)
    })
})

describe("ClassnameLiteralsStage — reactivity", () => {
    it("recomputes when the generators collection is reset and repopulated", () => {
        const runner = buildRunner()
        const genColl = runner.getInstance(GeneratorsCollectionStage)

        const genOld = new LiteralGenerator(new Map([["old", [lit("old")]]]))
        genColl.register(genOld)
        expect(runner.getInstance(ClassnameLiteralsStage).classNameLiterals.get().has("old")).toBe(true)

        genColl.reset()
        const genNew = new LiteralGenerator(new Map([["new", [lit("new")]]]))
        genColl.register(genNew)
        const result = runner.getInstance(ClassnameLiteralsStage).classNameLiterals.get()
        expect(result.has("old")).toBe(false)
        expect(result.has("new")).toBe(true)
    })

    it("recomputes when the evaluation step advances", () => {
        const runner = buildRunner()
        const genColl = runner.getInstance(GeneratorsCollectionStage)
        const node = lit("cls")
        const gen = new LiteralGenerator(new Map([["cls", [node]]]))
        genColl.register(gen)

        runner.markEvaluated()
        expect(runner.getInstance(ClassnameLiteralsStage).classNameLiterals.get().get("cls")).toEqual([node])

        runner.markEvaluated()
        expect(runner.getInstance(ClassnameLiteralsStage).classNameLiterals.get().get("cls")).toEqual([node])
    })
})

describe("ClassnameLiteralsStage — derived extractors", () => {
    it("aggregates literals from parent and all derived generators", () => {
        const runner = buildRunner()
        const genColl = runner.getInstance(GeneratorsCollectionStage)

        const parentLit = lit("parent-class")
        const cssLit = lit("css-class")
        const styledLit = lit("styled-class")

        const parentGen = new LiteralGenerator(new Map([["parent-class", [parentLit]]]))
        const cssGen = new LiteralGenerator(new Map([["css-class", [cssLit]]]))
        const styledGen = new LiteralGenerator(new Map([["styled-class", [styledLit]]]))

        genColl.register(parentGen)
        genColl.register(cssGen)
        genColl.register(styledGen)

        const result = runner.getInstance(ClassnameLiteralsStage).classNameLiterals.get()
        expect(result.get("parent-class")).toEqual([parentLit])
        expect(result.get("css-class")).toEqual([cssLit])
        expect(result.get("styled-class")).toEqual([styledLit])
    })

    it("merges literals when parent and derived generators share a class name", () => {
        const runner = buildRunner()
        const genColl = runner.getInstance(GeneratorsCollectionStage)

        const parentNode = lit("shared-class")
        const derivedNode = lit("shared-class")

        const parentGen = new LiteralGenerator(new Map([["shared-class", [parentNode]]]))
        const derivedGen = new LiteralGenerator(new Map([["shared-class", [derivedNode]]]))

        genColl.register(parentGen)
        genColl.register(derivedGen)

        const result = runner.getInstance(ClassnameLiteralsStage).classNameLiterals.get()
        expect(result.get("shared-class")).toHaveLength(2)
        expect(result.get("shared-class")).toContain(parentNode)
        expect(result.get("shared-class")).toContain(derivedNode)
    })
})
