import { describe, it, expect } from "vitest"
import { path } from "@mochi-css/builder"
import fs from "fs/promises"
import os from "os"
import { parseSource } from "@mochi-css/builder"
import dedent from "dedent"
import { Builder, RolldownBundler, VmRunner } from "@mochi-css/builder"
import type { BuilderOptions, AstPostProcessor, Module } from "@mochi-css/builder"
import { type StyleExtractor, StyleGenerator } from "./types"
import { createExtractorsPlugin } from "./ExtractorsPlugin"
import { PluginContextCollector } from "./PluginContextCollector"
import type { CallExpression, Expression } from "@swc/types"

function toKebab(s: string): string {
    return s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)
}

function flattenProps(obj: Record<string, unknown>): string {
    const lines: string[] = []
    for (const [k, v] of Object.entries(obj)) {
        if (typeof v === "object" && v !== null) {
            lines.push(`${k} {`)
            for (const [ik, iv] of Object.entries(v as Record<string, unknown>)) {
                lines.push(`  ${toKebab(ik)}: ${iv};`)
            }
            lines.push(`}`)
        } else {
            lines.push(`${toKebab(k)}: ${v};`)
        }
    }
    return lines.join("\n")
}

class SimpleCssGenerator extends StyleGenerator {
    private entries: { source: string; css: string }[] = []

    override mockFunction(): void {
        /* empty */
    }

    collectArgs(source: string, args: unknown[]): void {
        const obj = args[0] as Record<string, unknown>
        this.entries.push({ source, css: flattenProps(obj) })
    }

    async generateStyles() {
        const files: Record<string, string> = {}
        for (const { source, css } of this.entries) {
            files[source] = files[source] ? `${files[source]}\n${css}` : css
        }
        return { files: Object.keys(files).length > 0 ? files : undefined }
    }
}

class SimpleGlobalCssGenerator extends StyleGenerator {
    private blocks: string[] = []

    override mockFunction(): void {
        /* empty */
    }

    collectArgs(_source: string, args: unknown[]): void {
        const obj = args[0] as Record<string, unknown>
        for (const [selector, props] of Object.entries(obj)) {
            const propsStr = Object.entries(props as Record<string, unknown>)
                .map(([k, v]) => `  ${toKebab(k)}: ${v};`)
                .join("\n")
            this.blocks.push(`${selector} {\n${propsStr}\n}`)
        }
    }

    async generateStyles() {
        return this.blocks.length > 0 ? { global: this.blocks.join("\n\n") } : {}
    }
}

class SimpleKeyframesGenerator extends StyleGenerator {
    private entries: { source: string; css: string }[] = []

    override mockFunction(): void {
        /* empty */
    }

    collectArgs(source: string, args: unknown[]): void {
        const obj = args[0] as Record<string, unknown>
        const stops = Object.entries(obj)
            .map(([stop, props]) => {
                const propsStr = Object.entries(props as Record<string, unknown>)
                    .map(([k, v]) => `    ${toKebab(k)}: ${v};`)
                    .join("\n")
                return `  ${stop} {\n${propsStr}\n  }`
            })
            .join("\n")
        this.entries.push({ source, css: `@keyframes {\n${stops}\n}` })
    }

    async generateStyles() {
        const files: Record<string, string> = {}
        for (const { source, css } of this.entries) {
            files[source] = files[source] ? `${files[source]}\n${css}` : css
        }
        return { files: Object.keys(files).length > 0 ? files : undefined }
    }
}

const simpleCssExtractor: StyleExtractor = {
    importPath: "@mochi-css/vanilla",
    symbolName: "css",
    extractStaticArgs(call: CallExpression): Expression[] {
        return call.arguments.slice(0, 1).map((a) => a.expression)
    },
    startGeneration(): StyleGenerator {
        return new SimpleCssGenerator()
    },
}

const simpleGlobalCssExtractor: StyleExtractor = {
    importPath: "@mochi-css/vanilla",
    symbolName: "globalCss",
    extractStaticArgs(call: CallExpression): Expression[] {
        return call.arguments.slice(0, 1).map((a) => a.expression)
    },
    startGeneration(): StyleGenerator {
        return new SimpleGlobalCssGenerator()
    },
}

const simpleKeyframesExtractor: StyleExtractor = {
    importPath: "@mochi-css/vanilla",
    symbolName: "keyframes",
    extractStaticArgs(call: CallExpression): Expression[] {
        return call.arguments.slice(0, 1).map((a) => a.expression)
    },
    startGeneration(): StyleGenerator {
        return new SimpleKeyframesGenerator()
    },
}

async function runPlugin(
    extractors: StyleExtractor[],
    modules: Module[],
    extraOptions: Partial<BuilderOptions> = {},
): Promise<Map<string, Set<string>>> {
    const plugin = createExtractorsPlugin(extractors)
    const ctx = new PluginContextCollector(extraOptions.onDiagnostic)
    plugin.onLoad?.(ctx)
    const { chunks } = await new Builder({
        roots: ["./"],
        bundler: new RolldownBundler(),
        runner: new VmRunner(),
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        onDiagnostic: () => {},
        ...extraOptions,
        stages: [...ctx.getStages(), ...(extraOptions.stages ?? [])],
        sourceTransforms: [...ctx.getSourceTransforms(), ...(extraOptions.sourceTransforms ?? [])],
        postEvalTransforms: [...ctx.getPostEvalTransforms(), ...(extraOptions.postEvalTransforms ?? [])],
        emitHooks: [...(extraOptions.emitHooks ?? []), ...ctx.getEmitHooks()],
        cleanup: async () => {
            ctx.runCleanup()
            await extraOptions.cleanup?.()
        },
        initializeStages: ctx.getInitializeStages(),
        prepareAnalysis: ctx.getPrepareAnalysis(),
        getFileData: ctx.getGetFileData(),
        invalidateFiles: ctx.getInvalidateFiles(),
        resetCrossFileState: ctx.getResetCrossFileState(),
        getFilesToBundle: ctx.getGetFilesToBundle(),
    }).collectStylesFromModules(modules)
    return chunks
}

function getCss(chunks: Map<string, Set<string>>, filePath: string): string {
    return [...(chunks.get(filePath) ?? [])].join("\n\n")
}

function getAllCss(chunks: Map<string, Set<string>>): string {
    return [...chunks.values()].flatMap((s) => [...s]).join("\n\n")
}

class MockGenerator extends StyleGenerator {
    constructor(
        public readonly mockFunction: (...args: unknown[]) => unknown,
        public readonly collectArgs: (path: string, args: unknown[]) => void | Record<string, StyleGenerator>,
        public readonly generateStyles: () => Promise<{
            global?: string
            files?: Record<string, string>
        }>,
    ) {
        super()
    }
}

function createMockParentExtractor(importPath: string, symbolName: string, derivedNames: string[]): StyleExtractor {
    const derivedExtractors = new Map<string, StyleExtractor>()
    for (const name of derivedNames) {
        derivedExtractors.set(name, {
            importPath,
            symbolName: name,
            extractStaticArgs(call: CallExpression): Expression[] {
                return call.arguments.map((a) => a.expression)
            },
            startGeneration(): StyleGenerator {
                return new SimpleCssGenerator()
            },
        })
    }

    return {
        importPath,
        symbolName,
        derivedExtractors,
        extractStaticArgs(call: CallExpression): Expression[] {
            return call.arguments.map((a) => a.expression)
        },
        startGeneration(): StyleGenerator {
            const subGenerators = new Map<string, StyleGenerator>()
            for (const [name, ext] of derivedExtractors) {
                subGenerators.set(name, ext.startGeneration())
            }

            return new MockGenerator(
                () => Object.fromEntries(subGenerators),
                () => {
                    /* empty */
                },
                async () => {
                    const allFiles: Record<string, string> = {}
                    for (const gen of subGenerators.values()) {
                        const result = await gen.generateStyles()
                        if (result.files) {
                            for (const [source, css] of Object.entries(result.files)) {
                                allFiles[source] = allFiles[source] ? `${allFiles[source]}\n\n${css}` : css
                            }
                        }
                    }
                    return {
                        files: Object.keys(allFiles).length > 0 ? allFiles : undefined,
                    }
                },
            )
        },
    }
}

describe("Builder", () => {
    it("extracts style expressions from css calls", async () => {
        // noinspection TypeScriptCheckImport
        const module = await parseSource(
            /* language=typescript */ dedent`
            import { css } from "@mochi-css/vanilla"

            export const buttonStyles = css({
                backgroundColor: "gray",

                "&:hover": {
                    backgroundColor: "white"
                }
            })
        `,
            "buttonStyles.ts",
        )

        const chunks = await runPlugin([simpleCssExtractor], [module])
        const fileCss = getAllCss(chunks)
        expect(fileCss).toContain("background-color: gray")
        expect(fileCss).toContain("background-color: white")
    })

    it("simple generator returns per-file CSS keyed by source", async () => {
        // noinspection TypeScriptCheckImport
        const moduleA = await parseSource(
            /* language=typescript */ dedent`
            import { css } from "@mochi-css/vanilla"
            export const a = css({ color: "red" })
        `,
            "a.ts",
        )

        // noinspection TypeScriptCheckImport
        const moduleB = await parseSource(
            /* language=typescript */ dedent`
            import { css } from "@mochi-css/vanilla"
            export const b = css({ color: "blue" })
        `,
            "b.ts",
        )

        const chunks = await runPlugin([simpleCssExtractor], [moduleA, moduleB])
        expect(chunks.size).toBeGreaterThan(0)
        expect(getCss(chunks, "a.ts")).toContain("color: red")
        expect(getCss(chunks, "b.ts")).toContain("color: blue")
        expect(getCss(chunks, "a.ts")).not.toContain("color: blue")
    })

    it("global CSS generator returns global CSS", async () => {
        // noinspection TypeScriptCheckImport
        const module = await parseSource(
            /* language=typescript */ dedent`
            import { globalCss } from "@mochi-css/vanilla"
            globalCss({ body: { margin: 0 }, h1: { color: "red" } })
        `,
            "globals.ts",
        )

        const chunks = await runPlugin([simpleGlobalCssExtractor], [module])
        const globalCss = getCss(chunks, "global.css")
        expect(globalCss).toContain("body {")
        expect(globalCss).toContain("margin: 0;")
        expect(globalCss).toContain("h1 {")
        expect(globalCss).toContain("color: red;")
        expect(chunks.size).toBe(1)
    })

    it("keyframes generator returns per-file CSS", async () => {
        const module = await parseSource(
            /* language=typescript */ dedent`
            import { keyframes } from "@mochi-css/vanilla"
            export const fade = keyframes({ from: { opacity: "0" }, to: { opacity: "1" } })
        `,
            "anim.ts",
        )

        const chunks = await runPlugin([simpleKeyframesExtractor], [module])
        expect(getCss(chunks, "anim.ts")).toContain("@keyframes")
        expect(chunks.has("global.css")).toBe(false)
    })

    it("local plain-object variable spread into css args is included in bundle", async () => {
        const module = await parseSource(
            /* language=typescript */ dedent`
            import { css } from "@mochi-css/vanilla"
            const base = { fontSize: 16 }
            export const s = css({ ...base, color: "red" })
        `,
            "spread.ts",
        )

        const chunks = await runPlugin([simpleCssExtractor], [module])
        const fileCss = getAllCss(chunks)
        expect(fileCss).toContain("font-size: 16")
        expect(fileCss).toContain("color: red")
    })

    it("local plain-object variable spread into extractor args (styled pattern) is included in bundle", async () => {
        // Simulates: const base = {...}; styled('div', { ...base, width: 100 })
        // extractStaticArgs slices off the first arg ('div'), leaving [{ ...base, width: 100 }]
        const styledLikeExtractor: StyleExtractor = {
            importPath: "@mochi-css/vanilla",
            symbolName: "css",
            extractStaticArgs(call: CallExpression): Expression[] {
                return call.arguments.slice(1).map((a) => a.expression)
            },
            startGeneration(): StyleGenerator {
                return new SimpleCssGenerator()
            },
        }

        const module = await parseSource(
            /* language=typescript */ dedent`
            import { css } from "@mochi-css/vanilla"
            const base = { background: "black" }
            export const s = css("div", { ...base, width: 100 })
        `,
            "styled-spread.ts",
        )

        const chunks = await runPlugin([styledLikeExtractor], [module])
        const fileCss = getAllCss(chunks)
        expect(fileCss).toContain("background: black")
        expect(fileCss).toContain("width: 100")
    })

    it("result-used binding is replaced in-place with extractors call (no double evaluation)", async () => {
        // When css() result is stored in a variable and that variable is later passed as
        // a tracked arg to another css() call, the first binding's init is replaced in-place
        // with an extractors[] call. The arg literal must appear only once.
        // (simpleCssExtractor.extractStaticArgs takes first arg only — passing `base` as the
        //  first arg of the second call makes it a tracked expression, putting `base` into
        //  usedBindings and triggering in-place substitution.)
        // noinspection JSUnusedLocalSymbols
        const module = await parseSource(
            /* language=typescript */ dedent`
            import { css } from "@mochi-css/vanilla"
            const base = css({ fontSize: 20 })
            css(base)
        `,
            "dep.ts",
        )

        let generatedCode = ""
        const chunks = await runPlugin([simpleCssExtractor], [module], {
            bundler: {
                async bundle(rootFilePath, files) {
                    const bundler = new RolldownBundler()
                    for (const p in files) {
                        if (!p.endsWith("dep.ts")) continue
                        const source = files[p]
                        if (source !== undefined) generatedCode = source
                    }
                    return bundler.bundle(rootFilePath, files)
                },
            },
        })

        // Both styles are collected correctly
        const depCss = getCss(chunks, "dep.ts")
        expect(depCss).toContain("font-size")

        // The arg literal must appear only once — the in-place replacement in the binding
        // is the only location, no separate standalone extractor call for `base`'s css call
        const fontSizeMatches = generatedCode.match(/fontSize/g)
        expect(fontSizeMatches).toHaveLength(1)

        // The binding init should use extractors[], not the original css() call
        expect(generatedCode).toMatch(/const base\s*=\s*extractors\[/)
        // No __mochi_args_N variables (old workaround is gone)
        expect(generatedCode).not.toContain("__mochi_args_")
    })

    it("result not used: both css calls emit as standalone extractors statements", async () => {
        // When a css call result is stored in a variable but neither the variable nor its
        // result is a tracked dependency of another style expression, both calls become
        // standalone extractor statements with no binding wrapper.
        // noinspection JSUnusedLocalSymbols
        const module = await parseSource(
            /* language=typescript */ dedent`
            import { css } from "@mochi-css/vanilla"
            const base = css({ fontSize: 20 })
            css({ color: "blue" }, base)
        `,
            "dep.ts",
        )

        let generatedCode = ""
        const chunks = await runPlugin([simpleCssExtractor], [module], {
            bundler: {
                async bundle(rootFilePath, files) {
                    const bundler = new RolldownBundler()
                    for (const p in files) {
                        if (!p.endsWith("dep.ts")) continue
                        const source = files[p]
                        if (source !== undefined) generatedCode = source
                    }
                    return bundler.bundle(rootFilePath, files)
                },
            },
        })

        const depCss = getCss(chunks, "dep.ts")
        expect(depCss).toContain("font-size")
        expect(depCss).toContain("color")

        // Both calls produce standalone extractors[] statements; fontSize appears exactly once
        const fontSizeMatches = generatedCode.match(/fontSize/g)
        expect(fontSizeMatches).toHaveLength(1)
        expect(generatedCode).not.toContain("__mochi_args_")
    })

    it("extractors call result used as CSS selector key via createCallMock toString", async () => {
        // When a styled-like extractor provides createCallMock() with a toString(),
        // using its result as a computed key in another css call works correctly.
        const mockSelector = ".mock-btn-class"

        class StyledMockGenerator extends StyleGenerator {
            override mockFunction(): unknown {
                return {
                    toString: () => mockSelector,
                    selector: mockSelector,
                }
            }
            collectArgs(_source: string, _args: unknown[]): void {
                /* empty */
            }
            async generateStyles() {
                return {}
            }
        }

        class CapturingCssGenerator extends StyleGenerator {
            override mockFunction(): unknown {
                return undefined
            }
            readonly receivedKeys: string[] = []
            collectArgs(_source: string, args: unknown[]): void {
                const obj = args[0] as Record<string, unknown>
                for (const key of Object.keys(obj)) {
                    this.receivedKeys.push(key)
                }
            }
            async generateStyles() {
                return {}
            }
        }

        let capturingGen: CapturingCssGenerator | null = null

        const styledExtractor: StyleExtractor = {
            importPath: "@test/lib",
            symbolName: "styled",
            extractStaticArgs(call: CallExpression): Expression[] {
                return call.arguments.slice(1).map((a) => a.expression)
            },
            startGeneration(): StyleGenerator {
                return new StyledMockGenerator()
            },
        }

        const capturingCssExtractor: StyleExtractor = {
            importPath: "@test/lib",
            symbolName: "css",
            extractStaticArgs(call: CallExpression): Expression[] {
                return call.arguments.slice(0, 1).map((a) => a.expression)
            },
            startGeneration(): StyleGenerator {
                capturingGen = new CapturingCssGenerator()
                return capturingGen
            },
        }

        // noinspection TypeScriptCheckImport
        const module = await parseSource(
            /* language=typescript */ dedent`
            import { styled, css } from "@test/lib"
            const Btn = styled("button", { color: "red" })
            css({ [Btn]: { background: "blue" } })
        `,
            "comp.ts",
        )

        await runPlugin([styledExtractor, capturingCssExtractor], [module])

        // The css generator should receive the selector string as the key
        expect(capturingGen).not.toBeNull()
        expect((capturingGen as unknown as CapturingCssGenerator).receivedKeys).toContain(mockSelector)
    })

    describe("derived extractors", () => {
        const mockParent = createMockParentExtractor("@mock/lib", "createMock", ["css"])

        it("single-file derived extractor produces CSS", async () => {
            // noinspection TypeScriptCheckImport
            const module = await parseSource(
                /* language=typescript */ dedent`
                import { createMock } from "@mock/lib"
                const { css } = createMock({})
                css({ color: "red" })
            `,
                "single.ts",
            )

            const chunks = await runPlugin([mockParent], [module], {
                debug: true,
                onDiagnostic: console.log,
            })
            expect(getCss(chunks, "single.ts")).toContain("color: red")
        })

        it("cross-file derived extractor propagation", async () => {
            const configPath = path.resolve("config.ts")
            const buttonPath = path.resolve("button.ts")

            // noinspection TypeScriptCheckImport
            const configModule = await parseSource(
                /* language=typescript */ dedent`
                import { createMock } from "@mock/lib"
                const { css } = createMock({})
                export { css }
            `,
                configPath,
            )

            // noinspection TypeScriptCheckImport
            const buttonModule = await parseSource(
                /* language=typescript */ dedent`
                import { css } from "./config"
                css({ color: "blue" })
            `,
                buttonPath,
            )

            const chunks = await runPlugin([mockParent], [configModule, buttonModule])
            expect(getCss(chunks, buttonPath)).toContain("color: blue")
        })

        it("mixed regular and derived extractors", async () => {
            const configPath = path.resolve("config.ts")
            const styledPath = path.resolve("styled.ts")

            // noinspection TypeScriptCheckImport
            const configModule = await parseSource(
                /* language=typescript */ dedent`
                import { createMock } from "@mock/lib"
                const { css } = createMock({})
                export { css }
            `,
                configPath,
            )

            // noinspection TypeScriptCheckImport
            const styledModule = await parseSource(
                /* language=typescript */ dedent`
                import { css } from "@mochi-css/vanilla"
                import { css as themeCss } from "./config"
                css({ color: "red" })
                themeCss({ color: "blue" })
            `,
                styledPath,
            )

            const chunks = await runPlugin([simpleCssExtractor, mockParent], [configModule, styledModule])

            const styledCss = getCss(chunks, styledPath)
            expect(styledCss).toContain("color: red")
            expect(styledCss).toContain("color: blue")
        })

        it("renamed destructuring", async () => {
            // noinspection TypeScriptCheckImport
            const module = await parseSource(
                /* language=typescript */ dedent`
                import { createMock } from "@mock/lib"
                const { css: myCss } = createMock({})
                myCss({ color: "green" })
            `,
                "renamed.ts",
            )

            const chunks = await runPlugin([mockParent], [module])
            expect(getCss(chunks, "renamed.ts")).toContain("color: green")
        })

        it("code minimization only includes used derived bindings", async () => {
            const multiDerived = createMockParentExtractor("@mock/lib", "createMock", ["css", "styled"])

            // noinspection TypeScriptCheckImport, JSUnusedLocalSymbols
            const module = await parseSource(
                /* language=typescript */ dedent`
                import { createMock } from "@mock/lib"
                const { css, styled } = createMock({})
                css({ color: "red" })
            `,
                "minimal.ts",
            )

            let generatedCode = ""
            await runPlugin([multiDerived], [module], {
                bundler: {
                    async bundle(rootFilePath, files) {
                        const bundler = new RolldownBundler()
                        for (const path in files) {
                            if (!path.endsWith("minimal.ts")) continue
                            const source = files[path]
                            if (source === undefined) continue
                            generatedCode = source
                        }
                        return bundler.bundle(rootFilePath, files)
                    },
                },
            })

            expect(generatedCode).toContain("css")
            expect(generatedCode).not.toContain("styled")
        })

        it("warns when parent extractor return value is assigned to a variable", async () => {
            const diagnostics: { code: string; message: string }[] = []

            // noinspection TypeScriptCheckImport, JSUnusedLocalSymbols
            const module = await parseSource(
                /* language=typescript */ dedent`
                import { createMock } from "@mock/lib"
                const styles = createMock({})
            `,
                "assign.ts",
            )

            await runPlugin([mockParent], [module], {
                onDiagnostic: (d) => diagnostics.push(d),
            })

            expect(diagnostics).toContainEqual(
                expect.objectContaining({
                    code: "MOCHI_INVALID_EXTRACTOR_USAGE",
                    message: expect.stringContaining("must be destructured with an object pattern") as string,
                }),
            )
        })

        it("warns when parent extractor return value is ignored", async () => {
            const diagnostics: { code: string; message: string }[] = []

            // noinspection TypeScriptCheckImport
            const module = await parseSource(
                /* language=typescript */ dedent`
                import { createMock } from "@mock/lib"
                createMock({})
            `,
                "ignored.ts",
            )

            await runPlugin([mockParent], [module], {
                onDiagnostic: (d) => diagnostics.push(d),
            })

            expect(diagnostics).toContainEqual(
                expect.objectContaining({
                    code: "MOCHI_INVALID_EXTRACTOR_USAGE",
                    message: expect.stringContaining("is not used") as string,
                }),
            )
        })

        it("warns when parent extractor destructuring uses rest spread", async () => {
            const diagnostics: { code: string; message: string }[] = []

            // noinspection TypeScriptCheckImport, JSUnusedLocalSymbols
            const module = await parseSource(
                /* language=typescript */ dedent`
                import { createMock } from "@mock/lib"
                const { css, ...rest } = createMock({})
            `,
                "rest.ts",
            )

            await runPlugin([mockParent], [module], {
                onDiagnostic: (d) => diagnostics.push(d),
            })

            expect(diagnostics).toContainEqual(
                expect.objectContaining({
                    code: "MOCHI_INVALID_EXTRACTOR_USAGE",
                    message: expect.stringContaining("must not use rest spread") as string,
                }),
            )
        })
    })

    describe("createExtractorsPlugin", () => {
        it("produces CSS via emitChunk", async () => {
            const emitDir = await fs.mkdtemp(path.join(os.tmpdir(), "mochi-extplugin-"))
            try {
                const module = await parseSource(
                    dedent`
                    import { css } from "@mochi-css/vanilla"
                    export const s = css({ color: "green" })
                `,
                    "test.ts",
                )

                const plugin = createExtractorsPlugin([simpleCssExtractor])
                const ctx = new PluginContextCollector()
                plugin.onLoad?.(ctx)

                const builder = new Builder({
                    roots: ["./"],
                    stages: ctx.getStages(),
                    bundler: new RolldownBundler(),
                    runner: new VmRunner(),
                    // eslint-disable-next-line @typescript-eslint/no-empty-function
                    onDiagnostic: () => {},
                    sourceTransforms: ctx.getSourceTransforms(),
                    postEvalTransforms: ctx.getPostEvalTransforms(),
                    emitHooks: ctx.getEmitHooks(),
                    emitDir,
                    cleanup: () => {
                        ctx.runCleanup()
                    },
                    initializeStages: ctx.getInitializeStages(),
                    prepareAnalysis: ctx.getPrepareAnalysis(),
                    getFileData: ctx.getGetFileData(),
                    invalidateFiles: ctx.getInvalidateFiles(),
                    resetCrossFileState: ctx.getResetCrossFileState(),
                    getFilesToBundle: ctx.getGetFilesToBundle(),
                })

                await builder.collectStylesFromModules([module])

                const manifestContent = await fs.readFile(path.join(emitDir, ".mochi-emit.json"), "utf8")
                const emittedPaths = JSON.parse(manifestContent) as string[]
                expect(emittedPaths.length).toBeGreaterThan(0)

                // At least one file should contain green CSS
                let foundGreen = false
                for (const relPath of emittedPaths) {
                    const content = await fs.readFile(path.join(emitDir, relPath), "utf8")
                    if (content.includes("green")) foundGreen = true
                }
                expect(foundGreen).toBe(true)
            } finally {
                await fs.rm(emitDir, { recursive: true, force: true })
            }
        })
    })

    describe("sourceTransforms", () => {
        it("pipeline is unaffected when sourceTransforms array is empty", async () => {
            const module = await parseSource(
                dedent`
                import { css } from "@mochi-css/vanilla"
                export const s = css({ color: "red" })
            `,
                "test.ts",
            )

            const chunks = await runPlugin([simpleCssExtractor], [module])
            expect(getAllCss(chunks)).toContain("color: red")
        })

        it("handler mutations to the AST are reflected in CSS output", async () => {
            const module = await parseSource(
                dedent`
                import { css } from "@mochi-css/vanilla"
                export const s = css({ color: "red" })
            `,
                "test.ts",
            )

            const handler: AstPostProcessor = () => {
                for (const item of module.ast.body) {
                    if (item.type !== "ExportDeclaration") continue
                    if (item.declaration.type !== "VariableDeclaration") continue
                    const init = item.declaration.declarations[0]?.init
                    if (init?.type !== "CallExpression") continue
                    const arg = init.arguments[0]?.expression
                    if (arg?.type !== "ObjectExpression") continue
                    const prop = arg.properties[0]
                    if (prop?.type !== "KeyValueProperty") continue
                    const val = prop.value
                    if (val.type === "StringLiteral") {
                        val.value = "blue"
                        val.raw = '"blue"'
                    }
                }
            }

            const chunks = await runPlugin([simpleCssExtractor], [module], {
                sourceTransforms: [handler],
            })
            const css = getAllCss(chunks)
            expect(css).toContain("color: blue")
            expect(css).not.toContain("color: red")
        })
    })

    describe("preEvalTransforms", () => {
        it("setGlobal in preEvalTransform makes value available in execution context", async () => {
            const module = await parseSource(
                dedent`
                import { css } from "@mochi-css/vanilla"
                const config = __preEvalGlobal
                export const s = css(config)
            `,
                "test.ts",
            )

            const preEvalHandler: AstPostProcessor = (_runner, { evaluator }) => {
                evaluator.setGlobal("__preEvalGlobal", { color: "blue" })
            }

            const chunks = await runPlugin([simpleCssExtractor], [module], {
                preEvalTransforms: [preEvalHandler],
            })

            expect(getAllCss(chunks)).toContain("color: blue")
        })

        it("pipeline is unaffected when preEvalTransforms array is empty", async () => {
            const module = await parseSource(
                dedent`
                import { css } from "@mochi-css/vanilla"
                export const s = css({ color: "red" })
            `,
                "test.ts",
            )

            const chunks = await runPlugin([simpleCssExtractor], [module], {
                preEvalTransforms: [],
            })

            expect(getAllCss(chunks)).toContain("color: red")
        })
    })

    it("multiple roots: extracts CSS from files in all roots", async () => {
        const dirA = await fs.mkdtemp(path.join(os.tmpdir(), "mochi-test-a-"))
        const dirB = await fs.mkdtemp(path.join(os.tmpdir(), "mochi-test-b-"))
        try {
            await fs.writeFile(
                path.join(dirA, "a.ts"),
                dedent`
                    import { css } from "@mochi-css/vanilla"
                    export const a = css({ color: "red" })
                `,
            )
            await fs.writeFile(
                path.join(dirB, "b.ts"),
                dedent`
                    import { css } from "@mochi-css/vanilla"
                    export const b = css({ color: "blue" })
                `,
            )

            const plugin = createExtractorsPlugin([simpleCssExtractor])
            const ctx = new PluginContextCollector()
            plugin.onLoad?.(ctx)
            const builder = new Builder({
                roots: [dirA, dirB],
                stages: [...ctx.getStages()],
                sourceTransforms: [...ctx.getSourceTransforms()],
                emitHooks: [...ctx.getEmitHooks()],
                cleanup: async () => {
                    ctx.runCleanup()
                },
                bundler: new RolldownBundler(),
                runner: new VmRunner(),
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                onDiagnostic: () => {},
                splitCss: true,
                initializeStages: ctx.getInitializeStages(),
                prepareAnalysis: ctx.getPrepareAnalysis(),
                getFileData: ctx.getGetFileData(),
                invalidateFiles: ctx.getInvalidateFiles(),
                resetCrossFileState: ctx.getResetCrossFileState(),
                getFilesToBundle: ctx.getGetFilesToBundle(),
            })

            const result = await builder.collectMochiCss()
            const allCss = Object.values(result.files ?? {}).join("\n")
            expect(allCss).toContain("color: red")
            expect(allCss).toContain("color: blue")
        } finally {
            await fs.rm(dirA, { recursive: true, force: true })
            await fs.rm(dirB, { recursive: true, force: true })
        }
    })

    it("named root: same files found as with plain string root", async () => {
        const dir = await fs.mkdtemp(path.join(os.tmpdir(), "mochi-test-named-"))
        try {
            await fs.writeFile(
                path.join(dir, "comp.ts"),
                dedent`
                    import { css } from "@mochi-css/vanilla"
                    export const comp = css({ color: "green" })
                `,
            )

            const plugin = createExtractorsPlugin([simpleCssExtractor])
            const ctx = new PluginContextCollector()
            plugin.onLoad?.(ctx)
            const builder = new Builder({
                roots: [{ path: dir, package: "@test/pkg" }],
                stages: [...ctx.getStages()],
                sourceTransforms: [...ctx.getSourceTransforms()],
                emitHooks: [...ctx.getEmitHooks()],
                cleanup: async () => {
                    ctx.runCleanup()
                },
                bundler: new RolldownBundler(),
                runner: new VmRunner(),
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                onDiagnostic: () => {},
                splitCss: true,
                initializeStages: ctx.getInitializeStages(),
                prepareAnalysis: ctx.getPrepareAnalysis(),
                getFileData: ctx.getGetFileData(),
                invalidateFiles: ctx.getInvalidateFiles(),
                resetCrossFileState: ctx.getResetCrossFileState(),
                getFilesToBundle: ctx.getGetFilesToBundle(),
            })

            const result = await builder.collectMochiCss()
            const allCss = Object.values(result.files ?? {}).join("\n")
            expect(allCss).toContain("color: green")
        } finally {
            await fs.rm(dir, { recursive: true, force: true })
        }
    })

    it("filePreProcess transforms source before parsing", async () => {
        const dir = await fs.mkdtemp(path.join(os.tmpdir(), "mochi-preprocess-"))
        try {
            await fs.writeFile(
                path.join(dir, "comp.ts"),
                dedent`
                    import { css } from "@mochi-css/vanilla"
                    // REPLACE_ME
                `,
            )

            const plugin = createExtractorsPlugin([simpleCssExtractor])
            const ctx = new PluginContextCollector()
            plugin.onLoad?.(ctx)
            const builder = new Builder({
                roots: [dir],
                stages: [...ctx.getStages()],
                sourceTransforms: [...ctx.getSourceTransforms()],
                emitHooks: [...ctx.getEmitHooks()],
                cleanup: async () => {
                    ctx.runCleanup()
                },
                bundler: new RolldownBundler(),
                runner: new VmRunner(),
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                onDiagnostic: () => {},
                splitCss: true,
                filePreProcess: ({ content }) =>
                    content.replace("// REPLACE_ME", `export const x = css({ color: "purple" })`),
                initializeStages: ctx.getInitializeStages(),
                prepareAnalysis: ctx.getPrepareAnalysis(),
                getFileData: ctx.getGetFileData(),
                invalidateFiles: ctx.getInvalidateFiles(),
                resetCrossFileState: ctx.getResetCrossFileState(),
                getFilesToBundle: ctx.getGetFilesToBundle(),
            })

            const result = await builder.collectMochiCss()
            const allCss = Object.values(result.files ?? {}).join("\n")
            expect(allCss).toContain("color: purple")
        } finally {
            await fs.rm(dir, { recursive: true, force: true })
        }
    })

    it("evaluator lifecycle > setGlobal makes a value available in the execution context", async () => {
        // The module references `__myGlobal`, which is only defined via setGlobal
        const module = await parseSource(
            dedent`
            import { css } from "@mochi-css/vanilla"
            const config = __myGlobal
            export const s = css(config)
        `,
            "test.ts",
        )

        const sourceTransform: AstPostProcessor = (_runner, { evaluator }) => {
            evaluator.setGlobal("__myGlobal", { color: "blue" })
        }

        const chunks = await runPlugin([simpleCssExtractor], [module], {
            sourceTransforms: [sourceTransform],
        })

        const css = getAllCss(chunks)
        expect(css).toContain("color: blue")
    })
})
