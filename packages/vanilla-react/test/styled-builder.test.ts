import { describe, it, expect } from "vitest"
import { parseSource } from "@mochi-css/builder"
import { Builder, RolldownBundler, VmRunner } from "@mochi-css/builder"
import { PluginContextCollector } from "@mochi-css/plugins"
import { styledIdPlugin } from "@mochi-css/plugins"
import { createExtractorsPlugin } from "@mochi-css/plugins"
import dedent from "dedent"
import path from "path"
import { defineConfig } from "../src/config"

async function runDefineConfig(sourceCode: string, filePath: string) {
    const config = defineConfig({})

    const module = await parseSource(sourceCode, filePath)

    // Build the plugin context from defineConfig's plugins
    const ctx = new PluginContextCollector()
    for (const plugin of config.plugins ?? []) {
        plugin.onLoad?.(ctx)
    }

    const result = await new Builder({
        roots: ["./"],
        bundler: new RolldownBundler(),
        runner: new VmRunner(),
        stages: [...ctx.getStages()],
        sourceTransforms: [...ctx.getSourceTransforms()],
        postEvalTransforms: [...ctx.getPostEvalTransforms()],
        emitHooks: [...ctx.getEmitHooks()],
        filePreProcess: config.filePreProcess,
        cleanup: () => ctx.runCleanup(),
        initializeStages: ctx.getInitializeStages(),
        prepareAnalysis: ctx.getPrepareAnalysis(),
        getFileData: ctx.getGetFileData(),
        invalidateFiles: ctx.getInvalidateFiles(),
        resetCrossFileState: ctx.getResetCrossFileState(),
        getFilesToBundle: ctx.getGetFilesToBundle(),
    }).collectStylesFromModules([module])

    return result
}

describe("styled builder pipeline", () => {
    it("generates sourcemod with _mochiPrebuilt including variant class names", async () => {
        const filePath = path.resolve("src/page.tsx")
        const source = dedent`
            import { styled } from "@mochi-css/vanilla-react"

            export const Title = styled("div", {
                height: 20,
                variants: {
                    color: {
                        red: { color: "red" },
                        green: { color: "green" }
                    }
                },
                defaultVariants: { color: "red" }
            })
        `

        const { chunks, modifiedSources } = await runDefineConfig(source, filePath)

        // Should have a sourcemod for this file
        expect(modifiedSources.has(filePath)).toBe(true)
        const sourcemod = modifiedSources.get(filePath)!

        // Sourcemod should contain _mochiPrebuilt
        expect(sourcemod).toContain("_mochiPrebuilt")

        // Sourcemod should NOT still contain the inline style object (it's been replaced)
        expect(sourcemod).not.toContain('"height"')

        // Sourcemod should have the variant class names in _mochiPrebuilt (non-empty)
        // Extract the _mochiPrebuilt call
        console.log("Sourcemod:\n", sourcemod)

        // Check CSS output has variant selectors
        const cssChunks = [...chunks.entries()].flatMap(([, v]) => [...v])
        const css = cssChunks.join("\n")
        console.log("CSS:\n", css)

        // CSS should have variant rules
        expect(css).toMatch(/\.s-[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/)
    })

    it("_mochiPrebuilt call has non-empty variantClassNames", async () => {
        const filePath = path.resolve("src/page.tsx")
        const source = dedent`
            import { styled } from "@mochi-css/vanilla-react"

            export const Title = styled("div", {
                variants: {
                    color: {
                        red: { color: "red" },
                        green: { color: "green" }
                    }
                }
            })
        `

        const { modifiedSources } = await runDefineConfig(source, filePath)

        expect(modifiedSources.has(filePath)).toBe(true)
        const sourcemod = modifiedSources.get(filePath)!

        console.log("Sourcemod:\n", sourcemod)

        // The _mochiPrebuilt call should have a non-empty second arg (variantClassNames)
        // Parse out the call: _mochiPrebuilt([...], {...}, {...})
        // The second arg should NOT be {} (empty)
        expect(sourcemod).toContain('"red"')
        expect(sourcemod).toContain('"green"')
    })

    it("merges css() result with additional styled variants in _mochiPrebuilt", async () => {
        const filePath = path.resolve("src/Text.tsx")
        const source = dedent`
            import { styled } from "@mochi-css/vanilla-react"
            import { css } from "@mochi-css/vanilla"

            const textStyles = css({
                color: "white",
                variants: {
                    color: {
                        dim: { color: "gray" },
                        bright: { color: "yellow" }
                    }
                }
            })

            export const EN = styled("p", textStyles)

            export const JP = styled("p", textStyles, {
                fontWeight: 300,
                variants: {
                    vertical: {
                        true: {
                            writingMode: "vertical-rl"
                        }
                    }
                }
            })
        `

        const { modifiedSources } = await runDefineConfig(source, filePath)

        expect(modifiedSources.has(filePath)).toBe(true)
        const sourcemod = modifiedSources.get(filePath)!

        console.log("Sourcemod:\n", sourcemod)

        // EN should be substituted with _mochiPrebuilt containing color variants
        expect(sourcemod).toContain('"dim"')
        expect(sourcemod).toContain('"bright"')

        // JP should be substituted with _mochiPrebuilt containing BOTH color AND vertical variants
        expect(sourcemod).toContain('"vertical"')
        expect(sourcemod).toContain('"true"')

        // JP's _mochiPrebuilt should have BOTH color and vertical variants
        // (textStyles color variants merged with styled's vertical variant)
        const jpMatch = sourcemod.match(/JP = styled\("p", _mochiPrebuilt\(([\s\S]*?)\)\)/)
        expect(jpMatch).toBeTruthy()
        expect(jpMatch![0]).toContain('"color"')
        expect(jpMatch![0]).toContain('"vertical"')
    })
})
