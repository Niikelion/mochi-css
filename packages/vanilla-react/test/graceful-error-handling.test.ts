import { describe, expect, it } from "vitest"
import { Builder, parseSource, RolldownBundler, VmRunner } from "@mochi-css/builder"
import { PluginContextCollector } from "@mochi-css/plugins"
import dedent from "dedent"
import path from "path"
import { defineConfig } from "@/config"
import type { Module } from "@mochi-css/builder"

/**
 * Reproducer for #44 — a runtime error in one file's module-level code must not take down CSS
 * extraction for the rest of the project. All extracted files execute together in one shared
 * script (required for cross-file imports/re-exports to resolve), so without per-file isolation
 * a single throw would abort extraction for every file in the run.
 */

async function runPipeline(modules: Module[]) {
    const config = defineConfig({})
    const diagnostics: {
        code: string
        message: string
        file?: string
        severity: string
        line?: number
        column?: number
    }[] = []

    const ctx = new PluginContextCollector()
    for (const plugin of config.plugins ?? []) {
        plugin.onLoad?.(ctx)
    }

    const result = await new Builder({
        onDiagnostic: (d) => diagnostics.push(d),
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
    }).collectStylesFromModules(modules)

    return { ...result, diagnostics }
}

function cssFromChunks(chunks: Map<string, Set<string>>): string {
    return [...chunks.entries()].flatMap(([, v]) => [...v]).join("\n")
}

describe("graceful error handling during extraction (#44)", () => {
    it("still extracts styles from other files when one file throws at module scope", async () => {
        const brokenPath = path.resolve("src/broken.ts")
        const okPath = path.resolve("src/ok.tsx")

        const broken = await parseSource(
            dedent`
                import { styled } from "@mochi-css/vanilla-react"

                function boom() {
                    throw new Error("intentional failure")
                }

                export const Broken = styled("div", { color: boom() })
            `,
            brokenPath,
        )

        const ok = await parseSource(
            dedent`
                import { styled } from "@mochi-css/vanilla-react"

                export const Ok = styled("div", { color: "seagreen" })
            `,
            okPath,
        )

        const { chunks, diagnostics } = await runPipeline([broken, ok])

        const css = cssFromChunks(chunks)
        expect(css).toContain("seagreen")

        const fileExecDiagnostics = diagnostics.filter((d) => d.code === "MOCHI_FILE_EXEC")
        expect(fileExecDiagnostics).toHaveLength(1)
        expect(fileExecDiagnostics[0]).toMatchObject({ severity: "warning" })
        expect(fileExecDiagnostics[0]?.message).toContain("intentional failure")
    })

    it("a file whose export throws degrades to no styles, not a crashed build", async () => {
        const brokenPath = path.resolve("src/broken.ts")

        const broken = await parseSource(
            dedent`
                import { css } from "@mochi-css/vanilla"

                function boom() {
                    throw new Error("boom")
                }

                export const styles = css({ color: boom() })
            `,
            brokenPath,
        )

        // Should resolve, not throw/reject.
        const { chunks, diagnostics } = await runPipeline([broken])

        expect(cssFromChunks(chunks)).toBe("")
        expect(diagnostics.some((d) => d.code === "MOCHI_FILE_EXEC")).toBe(true)
    })

    it("a file consuming a broken cross-file import degrades gracefully instead of crashing", async () => {
        const brokenPath = path.resolve("src/broken.ts")
        const consumerPath = path.resolve("src/consumer.tsx")

        const broken = await parseSource(
            dedent`
                import { styled } from "@mochi-css/vanilla-react"

                function boom() {
                    throw new Error("broken export")
                }

                export const Button = styled("button", { color: boom() })
            `,
            brokenPath,
        )

        const consumer = await parseSource(
            dedent`
                import { styled } from "@mochi-css/vanilla-react"
                import { Button } from "./broken"

                export const Wrapper = styled("div", { padding: "8px" })
            `,
            consumerPath,
        )

        const { chunks, diagnostics } = await runPipeline([broken, consumer])

        // The consumer's own (unrelated) styles still extract, even though its import is broken.
        expect(cssFromChunks(chunks)).toContain("8px")
        expect(diagnostics.some((d) => d.code === "MOCHI_FILE_EXEC")).toBe(true)
    })

    it("a MOCHI_FILE_EXEC diagnostic carries a real source position (sourcemap remapping)", async () => {
        const brokenPath = path.resolve("src/broken.ts")

        const broken = await parseSource(
            dedent`
                import { styled } from "@mochi-css/vanilla-react"

                function boom() {
                    throw new Error("mapped failure")
                }

                export const Broken = styled("div", { color: boom() })
            `,
            brokenPath,
        )

        const { diagnostics } = await runPipeline([broken])

        const fileExecDiagnostics = diagnostics.filter((d) => d.code === "MOCHI_FILE_EXEC")
        expect(fileExecDiagnostics).toHaveLength(1)
        // A real position within the extracted/minimized source, not left undefined.
        expect(fileExecDiagnostics[0]?.line).toEqual(expect.any(Number))
        expect(fileExecDiagnostics[0]?.column).toEqual(expect.any(Number))
        expect(fileExecDiagnostics[0]?.line).toBeGreaterThan(0)
    })
})
