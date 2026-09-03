import { describe, expect, it } from "vitest"
import { Builder, parseSource, RolldownBundler, VmRunner } from "@mochi-css/builder"
import { PluginContextCollector } from "@mochi-css/plugins"
import { GenMapping, addMapping, setSourceContent, toEncodedMap } from "@jridgewell/gen-mapping"
import dedent from "dedent"
import path from "path"
import { defineConfig } from "@/config"
import { noop } from "@mochi-css/core"
import { assertMapsToOriginal, locate } from "./sourcemapHarness"

/**
 * Drive the real vanilla-react extraction pipeline over a single in-memory module and
 * return the builder result (chunks + sourcemods). Mirrors styled-builder.test.ts so the
 * sourcemap harness is graded against the exact pipeline that ships.
 */
async function runPipeline(sourceCode: string, filePath: string) {
    const config = defineConfig({})

    const module = await parseSource(sourceCode, filePath)

    const ctx = new PluginContextCollector()
    for (const plugin of config.plugins ?? []) {
        plugin.onLoad?.(ctx)
    }

    return await new Builder({
        onDiagnostic: noop,
        roots: ["./"],
        bundler: new RolldownBundler(),
        runner: new VmRunner(),
        stages: [...ctx.getStages()],
        sourceTransforms: [...ctx.getSourceTransforms()],
        postEvalTransforms: [...ctx.getPostEvalTransforms()],
        emitHooks: [...ctx.getEmitHooks()],
        cleanup: () => {
            ctx.runCleanup()
        },
        initializeStages: ctx.getInitializeStages(),
        prepareAnalysis: ctx.getPrepareAnalysis(),
        getFileData: ctx.getGetFileData(),
        invalidateFiles: ctx.getInvalidateFiles(),
        resetCrossFileState: ctx.getResetCrossFileState(),
        getFilesToBundle: ctx.getGetFilesToBundle(),
    }).collectStylesFromModules([module])
}

describe("sourcemap harness (grader self-test)", () => {
    // Prove the grading primitive is itself correct before using it to grade the pipeline.
    // Original lines are swapped in the generated output so line mapping is non-trivial.
    const original = "const x = 1\nconst y = 2\n"
    const generated = "const y = 2;\nconst x = 1;\n"

    function buildMap(correct: boolean) {
        const map = new GenMapping({ file: "swap.ts" })
        setSourceContent(map, "swap.ts", original)
        // `y`: generated line 1 -> original line 2
        addMapping(map, {
            generated: locate(generated, "y"),
            source: "swap.ts",
            original: correct ? locate(original, "y") : locate(original, "x"),
        })
        // `x`: generated line 2 -> original line 1
        addMapping(map, {
            generated: locate(generated, "x"),
            source: "swap.ts",
            original: correct ? locate(original, "x") : locate(original, "y"),
        })
        return toEncodedMap(map)
    }

    it("passes a token through a correct map back to its original position", () => {
        const map = buildMap(true)
        expect(() => {
            assertMapsToOriginal({ map, generatedCode: generated, originalCode: original, needle: "x" })
        }).not.toThrow()
        expect(() => {
            assertMapsToOriginal({ map, generatedCode: generated, originalCode: original, needle: "y" })
        }).not.toThrow()
    })

    it("rejects a map that points a token at the wrong original position", () => {
        const map = buildMap(false)
        expect(() => {
            assertMapsToOriginal({ map, generatedCode: generated, originalCode: original, needle: "x" })
        }).toThrow()
    })

    it("locate() reports 1-based line / 0-based column", () => {
        expect(locate(original, "x")).toEqual({ line: 1, column: 6 })
        expect(locate(original, "y")).toEqual({ line: 2, column: 6 })
    })
})

describe("sourcemod reflow is recoverable via the emitted map", () => {
    // The transform reprints the whole file, reflowing positions (the multi-line style object
    // collapses; a synthetic import is injected at the top). This proves the reflow is real —
    // so the map is doing genuine work — and that the builder now emits a map to recover it.
    const filePath = path.resolve("src/page.tsx")
    const source = dedent`
        import { styled } from "@mochi-css/vanilla-react"

        export const Title = styled("div", {
            height: 20,
            variants: {
                color: {
                    red: { color: "red" }
                }
            }
        })

        const AFTER = "trailing"
    `

    it("reflows surviving code and emits a map that traces it back", async () => {
        const result = await runPipeline(source, filePath)

        expect(result.modifiedSources.has(filePath)).toBe(true)
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const sourcemod = result.modifiedSources.get(filePath)!

        // The transform did fire (object replaced with the prebuilt call).
        expect(sourcemod).toContain("_mochiPrebuilt")

        // Code after the edited call genuinely moves to a different line in the output...
        expect(locate(sourcemod, "AFTER").line).not.toBe(locate(source, "AFTER").line)

        // ...and the emitted map traces that moved token back to its original location.
        const map = result.modifiedSourceMaps.get(filePath)
        expect(map).toBeDefined()
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        assertMapsToOriginal({ map: map!, generatedCode: sourcemod, originalCode: source, needle: "AFTER" })
    })
})

describe("sourcemap chain gap (Phase 1 contract)", () => {
    const filePath = path.resolve("src/page.tsx")
    const source = dedent`
        import { styled } from "@mochi-css/vanilla-react"

        export const Title = styled("div", {
            height: 20,
            variants: {
                color: {
                    red: { color: "red" }
                }
            }
        })

        const AFTER = "trailing"
    `

    async function buildMap() {
        const result = await runPipeline(source, filePath)
        const sourcemod = result.modifiedSources.get(filePath)
        const map = result.modifiedSourceMaps.get(filePath)
        if (sourcemod === undefined || map === undefined) {
            throw new Error("expected a sourcemod and a map for the fixture")
        }
        return { sourcemod, map }
    }

    it("maps a top-level identifier after the edited call back to its origin", async () => {
        const { sourcemod, map } = await buildMap()
        assertMapsToOriginal({ map, generatedCode: sourcemod, originalCode: source, needle: "AFTER" })
    })

    it("maps the exported binding name back to its origin", async () => {
        const { sourcemod, map } = await buildMap()
        assertMapsToOriginal({ map, generatedCode: sourcemod, originalCode: source, needle: "Title" })
    })

    it("maps the styled callee at the edited call site back to its origin", async () => {
        const { sourcemod, map } = await buildMap()
        // Occurrence 1 = the call site (occurrence 0 is the import specifier) in both texts.
        assertMapsToOriginal({
            map,
            generatedCode: sourcemod,
            originalCode: source,
            needle: "styled",
            generatedOccurrence: 1,
            originalOccurrence: 1,
        })
    })

    it("maps the render-target string literal back to its origin", async () => {
        const { sourcemod, map } = await buildMap()
        assertMapsToOriginal({ map, generatedCode: sourcemod, originalCode: source, needle: '"div"' })
    })
})
