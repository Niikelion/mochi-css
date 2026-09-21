import { describe, expect, it } from "vitest"
import { Builder, parseSource, RolldownBundler, VmRunner } from "@mochi-css/builder"
import { PluginContextCollector } from "@mochi-css/plugins"
import dedent from "dedent"
import path from "path"
import { defineConfig } from "@/config"
import type { Module } from "@mochi-css/builder"

/**
 * Reproducer for #41 — wildcard re-exports break the extraction pipeline.
 *
 * These tests wire up multi-file scenarios where a barrel file uses `export * from "./x"`
 * to re-expose styled components. The extraction pipeline should trace styled bindings
 * back through the wildcard so downstream consumers (and CSS emission) work correctly.
 */

async function runPipeline(modules: Module[]) {
    const config = defineConfig({})
    const diagnostics: { code: string; message: string }[] = []

    const ctx = new PluginContextCollector()
    for (const plugin of config.plugins ?? []) {
        plugin.onLoad?.(ctx)
    }

    const result = await new Builder({
        onDiagnostic: (d) => diagnostics.push({ code: d.code, message: d.message }),
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

describe("wildcard re-exports (#41)", () => {
    it("resolves `export * from './x.js'` when the actual file is .ts (barrel-side)", async () => {
        // NodeNext / verbatimModuleSyntax projects write `.js` extensions even though sources
        // are `.ts`. The bundler resolves this at runtime, but the ExportsStage's resolveImport
        // must too — otherwise the barrel drops the wildcard silently, breaking any consumer
        // that traces bindings back through the barrel.
        //
        // To force barrel-resolution to matter we add a consumer that extends via
        // `styled(Button, {...})` — the extension fires only if the binding actually resolves.
        const componentPath = path.resolve("src/component.ts")
        const barrelPath = path.resolve("src/index.ts")
        const consumerPath = path.resolve("src/consumer.tsx")

        const component = await parseSource(
            dedent`
                import { styled } from "@mochi-css/vanilla-react"

                export const Button = styled("div", { color: "coral" })
            `,
            componentPath,
        )

        const barrel = await parseSource(`export * from "./component.js"`, barrelPath)

        const consumer = await parseSource(
            dedent`
                import { styled } from "@mochi-css/vanilla-react"
                import { Button } from "./index"

                export const CoralBig = styled(Button, { color: "cornflowerblue" })
            `,
            consumerPath,
        )

        const { chunks, diagnostics } = await runPipeline([component, barrel, consumer])

        const css = cssFromChunks(chunks)
        expect(css).toContain("coral")
        expect(css).toContain("cornflowerblue")
        expect(diagnostics.filter((d) => d.code === "MOCHI_UNRESOLVED_IMPORT")).toEqual([])
    })

    it("resolves `export * from './folder'` via folder/index.ts (barrel-side)", async () => {
        const componentPath = path.resolve("src/widgets/index.ts")
        const barrelPath = path.resolve("src/index.ts")
        const consumerPath = path.resolve("src/consumer.tsx")

        const component = await parseSource(
            dedent`
                import { styled } from "@mochi-css/vanilla-react"

                export const Widget = styled("div", { color: "teal" })
            `,
            componentPath,
        )

        const barrel = await parseSource(`export * from "./widgets"`, barrelPath)

        const consumer = await parseSource(
            dedent`
                import { styled } from "@mochi-css/vanilla-react"
                import { Widget } from "./index"

                export const BigWidget = styled(Widget, { color: "olive" })
            `,
            consumerPath,
        )

        const { chunks, diagnostics } = await runPipeline([component, barrel, consumer])

        const css = cssFromChunks(chunks)
        expect(css).toContain("teal")
        expect(css).toContain("olive")
        expect(diagnostics.filter((d) => d.code === "MOCHI_UNRESOLVED_IMPORT")).toEqual([])
    })

    it("extracts styles from a component re-exported via `export *`", async () => {
        const componentPath = path.resolve("src/component.tsx")
        const barrelPath = path.resolve("src/index.ts")

        const component = await parseSource(
            dedent`
                import { styled } from "@mochi-css/vanilla-react"

                export const Button = styled("div", { color: "red" })
            `,
            componentPath,
        )

        const barrel = await parseSource(`export * from "./component"`, barrelPath)

        const { chunks, diagnostics } = await runPipeline([component, barrel])

        expect(cssFromChunks(chunks)).toContain("red")
        // Sanity: no unresolved-import diagnostic. Path-separator mismatches (module.filePath
        // constructed via node:path on Windows vs the pipeline's posix-normalized path util)
        // would otherwise drop the wildcard here even without any extension in the specifier.
        expect(diagnostics.filter((d) => d.code === "MOCHI_UNRESOLVED_IMPORT")).toEqual([])
    })

    it("extracts styles across a multi-hop barrel chain (`export *` -> `export *`)", async () => {
        const componentPath = path.resolve("src/component.tsx")
        const innerBarrelPath = path.resolve("src/inner/index.ts")
        const outerBarrelPath = path.resolve("src/index.ts")

        const component = await parseSource(
            dedent`
                import { styled } from "@mochi-css/vanilla-react"

                export const Deep = styled("div", { color: "purple" })
            `,
            componentPath,
        )

        const innerBarrel = await parseSource(`export * from "../component"`, innerBarrelPath)
        const outerBarrel = await parseSource(`export * from "./inner"`, outerBarrelPath)

        const consumerPath = path.resolve("src/consumer.tsx")
        const consumer = await parseSource(
            dedent`
                import { styled } from "@mochi-css/vanilla-react"
                import { Deep } from "./index"

                export const DeepBlue = styled(Deep, { color: "blue" })
            `,
            consumerPath,
        )

        const { chunks, diagnostics } = await runPipeline([component, innerBarrel, outerBarrel, consumer])

        const css = cssFromChunks(chunks)
        expect(css).toContain("purple")
        expect(css).toContain("blue")
        expect(diagnostics.filter((d) => d.code === "MOCHI_UNRESOLVED_IMPORT")).toEqual([])
    })

    it("traces a styled binding back through a wildcard barrel for extends", async () => {
        // The classic barrel/extend pattern: consumer imports Button from the barrel and
        // extends it via styled(Button, { ... }). Extension should still work when the
        // parent binding was re-exposed via `export *`.
        const componentPath = path.resolve("src/component.tsx")
        const barrelPath = path.resolve("src/index.ts")
        const consumerPath = path.resolve("src/consumer.tsx")

        const component = await parseSource(
            dedent`
                import { styled } from "@mochi-css/vanilla-react"

                export const Button = styled("div", { color: "red" })
            `,
            componentPath,
        )

        const barrel = await parseSource(`export * from "./component"`, barrelPath)

        const consumer = await parseSource(
            dedent`
                import { styled } from "@mochi-css/vanilla-react"
                import { Button } from "./index"

                export const BlueButton = styled(Button, { color: "blue" })
            `,
            consumerPath,
        )

        const { chunks, diagnostics } = await runPipeline([component, barrel, consumer])

        const css = cssFromChunks(chunks)
        expect(css).toContain("red")
        expect(css).toContain("blue")
        expect(diagnostics.filter((d) => d.code === "MOCHI_UNRESOLVED_IMPORT")).toEqual([])
    })
})
