import { describe, expect, it } from "vitest"
import { Builder, parseSource, RolldownBundler, VmRunner } from "@mochi-css/builder"
import { PluginContextCollector } from "@mochi-css/plugins"
import dedent from "dedent"
import path from "path"
import { defineConfig } from "@/config"
import { noop } from "@mochi-css/core"

async function runDefineConfig(sourceCode: string, filePath: string) {
    const config = defineConfig({})

    const module = await parseSource(sourceCode, filePath)

    // Build the plugin context from defineConfig's plugins
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
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const sourcemod = modifiedSources.get(filePath)!

        // Sourcemod should contain _mochiPrebuilt
        expect(sourcemod).toContain("_mochiPrebuilt")

        // Sourcemod should NOT still contain the inline style object (it's been replaced)
        expect(sourcemod).not.toContain('"height"')

        // Sourcemod should have the variant class names in _mochiPrebuilt (non-empty)
        // Check CSS output has variant selectors
        const cssChunks = [...chunks.entries()].flatMap(([, v]) => [...v])
        const css = cssChunks.join("\n")

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
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const sourcemod = modifiedSources.get(filePath)!

        // The _mochiPrebuilt call should have a non-empty second arg (variantClassNames)
        // Parse out the call: _mochiPrebuilt([...], {...}, {...})
        // The second arg should NOT be {} (empty)
        expect(sourcemod).toContain('"red"')
        expect(sourcemod).toContain('"green"')
    })

    it("preserves :: double colon for pseudo-element selectors in generated CSS", async () => {
        const filePath = path.resolve("src/page.tsx")
        const source = dedent`
            import { styled } from "@mochi-css/vanilla-react"

            export const Box = styled("div", {
                "&::after": { content: '""' },
                "&::before": { content: '""' },
                "& > li:not(:last-child)::after": { content: '""' },
            })
        `

        const { chunks } = await runDefineConfig(source, filePath)

        const cssChunks = [...chunks.entries()].flatMap(([, v]) => [...v])
        const css = cssChunks.join("\n")

        expect(css).toContain("::after")
        expect(css).toContain("::before")
        expect(css).not.toMatch(/(?<!:):after/)
        expect(css).not.toMatch(/(?<!:):before/)
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
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const sourcemod = modifiedSources.get(filePath)!

        // EN should be substituted with _mochiPrebuilt containing color variants
        expect(sourcemod).toContain('"dim"')
        expect(sourcemod).toContain('"bright"')

        // JP should be substituted with _mochiPrebuilt containing BOTH color AND vertical variants
        expect(sourcemod).toContain('"vertical"')
        expect(sourcemod).toContain('"true"')

        // JP's _mochiPrebuilt should have BOTH color and vertical variants
        // (textStyles color variants merged with styled's vertical variant)
        const jpMatch = /JP = styled\("p", _mochiPrebuilt\(([\s\S]*?)\)\)/.exec(sourcemod)
        expect(jpMatch).toBeTruthy()
        expect(jpMatch?.[0]).toContain('"color"')
        expect(jpMatch?.[0]).toContain('"vertical"')
    })
})
