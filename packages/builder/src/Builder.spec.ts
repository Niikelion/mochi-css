import { describe, it, expect } from "vitest"
import path from "path"
import fs from "fs/promises"
import os from "os"
import { parseSource } from "@/parse"
import dedent from "dedent"
import { Builder } from "@/Builder"
import { RolldownBundler } from "@/Bundler"
import { VmRunner } from "@/Runner"
import { mochiCssFunctionExtractor } from "@/extractors/VanillaCssExtractor"
import { mochiKeyframesFunctionExtractor } from "@/extractors/VanillaKeyframesExtractor"
import { mochiGlobalCssFunctionExtractor } from "@/extractors/VanillaGlobalCssExtractor"
import { StyleExtractor } from "@/extractors/StyleExtractor"
import { StyleGenerator } from "@/generators/StyleGenerator"
import { VanillaCssGenerator } from "@/generators/VanillaCssGenerator"
import { CallExpression, Expression } from "@swc/core"
import { AstPostProcessor, AnalysisContext, BuilderOptions, EmitHook } from "@/Builder"
import { Module, ProjectIndex } from "@/ProjectIndex"
import { defineStage } from "@/analysis/Stage"
import type { CacheRegistry } from "@/analysis/CacheEngine"
import { Evaluator } from "@/Evaluator"
import { createExtractorsPlugin } from "@/ExtractorsPlugin"

async function runWithPlugin(
    extractors: StyleExtractor[],
    modules: Module[],
    extraOptions: Partial<BuilderOptions> = {},
): Promise<Map<string, StyleGenerator>> {
    const plugin = createExtractorsPlugin(extractors, { onDiagnostic: extraOptions.onDiagnostic })
    let capturedBeforeCleanup = new Map<string, StyleGenerator>()
    await new Builder({
        roots: ["./"],
        bundler: new RolldownBundler(),
        runner: new VmRunner(),
        ...extraOptions,
        extractors: plugin.extractors,
        sourceTransforms: [...plugin.sourceTransforms, ...(extraOptions.sourceTransforms ?? [])],
        emitHooks: [...(extraOptions.emitHooks ?? []), ...plugin.emitHooks],
        cleanup: async () => {
            capturedBeforeCleanup = plugin.getGenerators()
            plugin.cleanup()
            await extraOptions.cleanup?.()
        },
    }).collectStylesFromModules(modules)
    return capturedBeforeCleanup
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
                return new VanillaCssGenerator()
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

            return {
                collectArgs(_source: string, _args: unknown[]): Record<string, StyleGenerator> {
                    return Object.fromEntries(subGenerators)
                },
                async generateStyles() {
                    const allFiles: Record<string, string> = {}
                    for (const gen of subGenerators.values()) {
                        const result = await gen.generateStyles()
                        if (result.files) {
                            for (const [source, css] of Object.entries(result.files)) {
                                allFiles[source] = allFiles[source] ? `${allFiles[source]}\n\n${css}` : css
                            }
                        }
                    }
                    return { files: Object.keys(allFiles).length > 0 ? allFiles : undefined }
                },
            }
        },
    }
}

describe("Builder", () => {
    it("extracts style expressions from css calls", async () => {
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

        const generators = await runWithPlugin([mochiCssFunctionExtractor], [module])
        const generator = generators.get("@mochi-css/vanilla:css")
        const result = await generator?.generateStyles()
        expect.assert(result !== undefined)

        const fileCss = Object.values(result.files ?? {}).join("\n\n")
        expect(fileCss).toContain("background-color: gray")
        expect(fileCss).toContain("background-color: white")
    })

    it("strips unused module-level symbols", async () => {
        const module = await parseSource(
            /* language=typescript */ dedent`
            import { css } from "@mochi-css/vanilla"

            // @ts-ignore
            const { color, name = fib(1000).toString() } = { color: "blue" }

            console.log(name)

            export const linkStyles = css({
                textDecoration: "none",
                color
            })
        `,
            "linkStyles.ts",
        )

        let generatedCode = ""

        await runWithPlugin([mochiCssFunctionExtractor], [module], {
            bundler: {
                async bundle(rootFilePath, files) {
                    const bundler = new RolldownBundler()

                    for (const path in files) {
                        if (!path.endsWith("linkStyles.ts")) continue

                        const source = files[path]
                        if (source === undefined) continue
                        generatedCode = source
                    }

                    return bundler.bundle(rootFilePath, files)
                },
            },
        })

        // noinspection TypeScriptUnresolvedReference
        expect(generatedCode).toEqual(/* language=typescript */ dedent`
            #!
            const { color } = {
                color: "blue"
            };
            extractors["@mochi-css/vanilla:css"]("linkStyles.ts", {
                textDecoration: "none",
                color
            });\n
        `)
    })

    it("VanillaCssGenerator returns per-file CSS keyed by source", async () => {
        const moduleA = await parseSource(
            /* language=typescript */ dedent`
            import { css } from "@mochi-css/vanilla"
            export const a = css({ color: "red" })
        `,
            "a.ts",
        )

        const moduleB = await parseSource(
            /* language=typescript */ dedent`
            import { css } from "@mochi-css/vanilla"
            export const b = css({ color: "blue" })
        `,
            "b.ts",
        )

        const generators = await runWithPlugin([mochiCssFunctionExtractor], [moduleA, moduleB])
        const generator = generators.get("@mochi-css/vanilla:css")
        const result = await generator?.generateStyles()
        expect.assert(result !== undefined)

        expect(result.files).toBeDefined()
        expect(result.files?.["a.ts"]).toContain("color: red")
        expect(result.files?.["b.ts"]).toContain("color: blue")
        expect(result.files?.["a.ts"]).not.toContain("color: blue")
    })

    it("VanillaGlobalCssGenerator returns global CSS", async () => {
        const module = await parseSource(
            /* language=typescript */ dedent`
            import { globalCss } from "@mochi-css/vanilla"
            globalCss({ body: { margin: 0 }, h1: { color: "red" } })
        `,
            "globals.ts",
        )

        const generators = await runWithPlugin([mochiGlobalCssFunctionExtractor], [module])
        const generator = generators.get("@mochi-css/vanilla:globalCss")
        const result = await generator?.generateStyles()
        expect.assert(result !== undefined)

        expect(result.global).toContain("body {")
        expect(result.global).toContain("margin: 0;")
        expect(result.global).toContain("h1 {")
        expect(result.global).toContain("color: red;")
        expect(result.files).toBeUndefined()
    })

    it("VanillaKeyframesGenerator returns per-file CSS", async () => {
        const module = await parseSource(
            /* language=typescript */ dedent`
            import { keyframes } from "@mochi-css/vanilla"
            export const fade = keyframes({ from: { opacity: "0" }, to: { opacity: "1" } })
        `,
            "anim.ts",
        )

        const generators = await runWithPlugin([mochiKeyframesFunctionExtractor], [module])
        const generator = generators.get("@mochi-css/vanilla:keyframes")
        const result = await generator?.generateStyles()
        expect.assert(result !== undefined)

        expect(result.files).toBeDefined()
        expect(result.files?.["anim.ts"]).toContain("@keyframes")
        expect(result.global).toBeUndefined()
    })

    it("dependent css call args are not evaluated twice (issue #12)", async () => {
        // When a css call result is stored in a variable and used as arg in another css call,
        // the first call's args should be deduplicated via __mochi_args_N variable.
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
        const generators = await runWithPlugin([mochiCssFunctionExtractor], [module], {
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
        const generator = generators.get("@mochi-css/vanilla:css")
        const result = await generator?.generateStyles()
        expect.assert(result !== undefined)

        // Both styles are collected correctly
        expect(result.files).toBeDefined()
        expect(result.files?.["dep.ts"]).toContain("font-size")
        expect(result.files?.["dep.ts"]).toContain("color")

        // The arg literal should appear only once in the generated code (no double evaluation)
        const fontSizeMatches = generatedCode.match(/fontSize/g)
        expect(fontSizeMatches).toHaveLength(1)
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

            const builder = new Builder({
                roots: [dirA, dirB],
                extractors: [mochiCssFunctionExtractor],
                bundler: new RolldownBundler(),
                runner: new VmRunner(),
                splitCss: true,
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

            const builder = new Builder({
                roots: [{ path: dir, package: "@test/pkg" }],
                extractors: [mochiCssFunctionExtractor],
                bundler: new RolldownBundler(),
                runner: new VmRunner(),
                splitCss: true,
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

            const builder = new Builder({
                roots: [dir],
                extractors: [mochiCssFunctionExtractor],
                bundler: new RolldownBundler(),
                runner: new VmRunner(),
                splitCss: true,
                filePreProcess: ({ content }) =>
                    content.replace("// REPLACE_ME", `export const x = css({ color: "purple" })`),
            })

            const result = await builder.collectMochiCss()
            const allCss = Object.values(result.files ?? {}).join("\n")
            expect(allCss).toContain("color: purple")
        } finally {
            await fs.rm(dir, { recursive: true, force: true })
        }
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

            const generators = await runWithPlugin([mockParent], [module])
            const generator = generators.get("@mock/lib:createMock")
            const result = await generator?.generateStyles()
            expect.assert(result !== undefined)

            expect(result.files).toBeDefined()
            expect(result.files?.["single.ts"]).toContain("color: red")
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

            const generators = await runWithPlugin([mockParent], [configModule, buttonModule])
            const generator = generators.get("@mock/lib:createMock")
            const result = await generator?.generateStyles()
            expect.assert(result !== undefined)

            expect(result.files).toBeDefined()
            expect(result.files?.[buttonPath]).toContain("color: blue")
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

            const generators = await runWithPlugin(
                [mochiCssFunctionExtractor, mockParent],
                [configModule, styledModule],
            )

            const regularGen = generators.get("@mochi-css/vanilla:css")
            const regularResult = await regularGen?.generateStyles()
            expect.assert(regularResult !== undefined)
            expect(regularResult.files?.[styledPath]).toContain("color: red")

            const derivedGen = generators.get("@mock/lib:createMock")
            const derivedResult = await derivedGen?.generateStyles()
            expect.assert(derivedResult !== undefined)
            expect(derivedResult.files?.[styledPath]).toContain("color: blue")
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

            const generators = await runWithPlugin([mockParent], [module])
            const generator = generators.get("@mock/lib:createMock")
            const result = await generator?.generateStyles()
            expect.assert(result !== undefined)

            expect(result.files).toBeDefined()
            expect(result.files?.["renamed.ts"]).toContain("color: green")
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
            await runWithPlugin([multiDerived], [module], {
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

            await runWithPlugin([mockParent], [module], {
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

            await runWithPlugin([mockParent], [module], {
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

            await runWithPlugin([mockParent], [module], {
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

    describe("sourceTransforms", () => {
        it("calls the handler with the ProjectIndex", async () => {
            const module = await parseSource(
                dedent`
                import { css } from "@mochi-css/vanilla"
                export const s = css({ color: "red" })
            `,
                "test.ts",
            )

            let receivedIndex: ProjectIndex | undefined
            const handler: AstPostProcessor = (index) => {
                receivedIndex = index
            }

            await runWithPlugin([mochiCssFunctionExtractor], [module], { sourceTransforms: [handler] })

            expect(receivedIndex).toBeDefined()
            expect(receivedIndex?.files.length).toBe(1)
        })

        it("pipeline is unaffected when sourceTransforms array is empty", async () => {
            const module = await parseSource(
                dedent`
                import { css } from "@mochi-css/vanilla"
                export const s = css({ color: "red" })
            `,
                "test.ts",
            )

            const generators = await runWithPlugin([mochiCssFunctionExtractor], [module])
            const result = await generators.get("@mochi-css/vanilla:css")?.generateStyles()
            const css = Object.values(result?.files ?? {}).join("")
            expect(css).toContain("color: red")
        })

        it("handler mutations to the AST are reflected in CSS output", async () => {
            const module = await parseSource(
                dedent`
                import { css } from "@mochi-css/vanilla"
                export const s = css({ color: "red" })
            `,
                "test.ts",
            )

            const handler: AstPostProcessor = (index) => {
                for (const [, fileInfo] of index.files) {
                    for (const item of fileInfo.ast.body) {
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
            }

            const generators = await runWithPlugin([mochiCssFunctionExtractor], [module], {
                sourceTransforms: [handler],
            })
            const result = await generators.get("@mochi-css/vanilla:css")?.generateStyles()
            const css = Object.values(result?.files ?? {}).join("")
            expect(css).toContain("color: blue")
            expect(css).not.toContain("color: red")
        })
    })

    describe("preEvalTransforms", () => {
        it("mutations to eval copy do not affect the canonical index seen by postEvalTransforms", async () => {
            const module = await parseSource(
                dedent`
                import { css } from "@mochi-css/vanilla"
                export const s = css({ color: "red" })
            `,
                "test.ts",
            )

            let canonicalColorValue: string | undefined

            const preEvalHandler: AstPostProcessor = (index) => {
                for (const [, fileInfo] of index.files) {
                    for (const item of fileInfo.ast.body) {
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
            }

            const postHandler: AstPostProcessor = (index) => {
                for (const [, fileInfo] of index.files) {
                    for (const item of fileInfo.ast.body) {
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
                            canonicalColorValue = val.value
                        }
                    }
                }
            }

            await runWithPlugin([mochiCssFunctionExtractor], [module], {
                preEvalTransforms: [preEvalHandler],
                postEvalTransforms: [postHandler],
            })

            expect(canonicalColorValue).toBe("red")
        })

        it("mutations in preEvalTransforms affect CSS output via the eval copy", async () => {
            const module = await parseSource(
                dedent`
                import { css } from "@mochi-css/vanilla"
                export const s = css({ color: "red" })
            `,
                "test.ts",
            )

            const preEvalHandler: AstPostProcessor = (index) => {
                for (const [, fileInfo] of index.files) {
                    for (const item of fileInfo.ast.body) {
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
            }

            const generators = await runWithPlugin([mochiCssFunctionExtractor], [module], {
                preEvalTransforms: [preEvalHandler],
            })

            const result = await generators.get("@mochi-css/vanilla:css")?.generateStyles()
            const css = Object.values(result?.files ?? {}).join("")
            expect(css).toContain("color: blue")
            expect(css).not.toContain("color: red")
        })

        it("pipeline is unaffected when preEvalTransforms array is empty", async () => {
            const module = await parseSource(
                dedent`
                import { css } from "@mochi-css/vanilla"
                export const s = css({ color: "red" })
            `,
                "test.ts",
            )

            const generators = await runWithPlugin([mochiCssFunctionExtractor], [module], {
                preEvalTransforms: [],
            })

            const result = await generators.get("@mochi-css/vanilla:css")?.generateStyles()
            const css = Object.values(result?.files ?? {}).join("")
            expect(css).toContain("color: red")
        })
    })

    describe("postEvalTransforms", () => {
        it("is called after execution with evaluator populated", async () => {
            const module = await parseSource(
                dedent`
                import { css } from "@mochi-css/vanilla"
                export const s = css({ color: "red" })
            `,
                "test.ts",
            )

            let capturedContext: AnalysisContext | undefined
            const postHandler: AstPostProcessor = (_index, context) => {
                capturedContext = context
            }

            await runWithPlugin([mochiCssFunctionExtractor], [module], {
                postEvalTransforms: [postHandler],
            })

            expect(capturedContext).toBeDefined()
            expect(capturedContext?.evaluator).toBeInstanceOf(Evaluator)
        })
    })

    describe("cleanup", () => {
        it("is called once at the end of the pipeline", async () => {
            const module = await parseSource(
                dedent`
                import { css } from "@mochi-css/vanilla"
                export const s = css({ color: "red" })
            `,
                "test.ts",
            )

            let cleanupCallCount = 0

            await runWithPlugin([mochiCssFunctionExtractor], [module], {
                cleanup: () => {
                    cleanupCallCount++
                },
            })

            expect(cleanupCallCount).toBe(1)
        })

        it("cleanup is called after postEvalTransforms", async () => {
            const module = await parseSource(
                dedent`
                import { css } from "@mochi-css/vanilla"
                export const s = css({ color: "red" })
            `,
                "test.ts",
            )

            const order: string[] = []

            await runWithPlugin([mochiCssFunctionExtractor], [module], {
                postEvalTransforms: [
                    () => {
                        order.push("post")
                    },
                ],
                cleanup: () => {
                    order.push("cleanup")
                },
            })

            expect(order).toEqual(["post", "cleanup"])
        })
    })

    describe("emitHooks", () => {
        it("writes files to emitDir and cleans up removed files on second run", async () => {
            const emitDir = await fs.mkdtemp(path.join(os.tmpdir(), "mochi-emit-"))
            try {
                const module = await parseSource(
                    dedent`
                    import { css } from "@mochi-css/vanilla"
                    export const s = css({ color: "red" })
                `,
                    "test.ts",
                )

                const emitHook: EmitHook = (_index, context) => {
                    context.emitChunk("output.css", ".foo { color: red }")
                }

                await runWithPlugin([mochiCssFunctionExtractor], [module], {
                    emitHooks: [emitHook],
                    emitDir,
                })
                const written = await fs.readFile(path.join(emitDir, "output.css"), "utf8")
                expect(written).toBe(".foo { color: red }")

                // Second run without that file → should be deleted
                const module2 = await parseSource(
                    dedent`
                    import { css } from "@mochi-css/vanilla"
                    export const s = css({ color: "red" })
                `,
                    "test.ts",
                )
                const emitHook2: EmitHook = () => undefined
                await runWithPlugin([mochiCssFunctionExtractor], [module2], {
                    emitHooks: [emitHook2],
                    emitDir,
                })
                await expect(fs.readFile(path.join(emitDir, "output.css"), "utf8")).rejects.toThrow()
            } finally {
                await fs.rm(emitDir, { recursive: true, force: true })
            }
        })
    })

    describe("markForEval", () => {
        it("expression marked for eval appears as statement in bundle and its runtime value is capturable", async () => {
            // config is NOT referenced by any css() call — it would normally be stripped
            const module = await parseSource(
                dedent`
                import { css } from "@mochi-css/vanilla"
                const config = { color: "red" }
                export const s = css({ color: "blue" })
            `,
                "test.ts",
            )

            let trackedValue: unknown
            let bundledConfigCode = ""

            const sourceTransform: AstPostProcessor = (index, context) => {
                for (const [, fileInfo] of index.files) {
                    for (const item of fileInfo.ast.body) {
                        if (item.type !== "VariableDeclaration") continue
                        const decl = item.declarations[0]
                        if (decl?.id.type !== "Identifier" || decl.id.value !== "config") continue
                        const init = decl.init
                        if (!init) continue
                        const wrapper = context.evaluator.valueWithTracking(init)
                        decl.init = wrapper
                        context.markForEval(fileInfo.filePath, wrapper)
                    }
                }
            }

            const postHandler: AstPostProcessor = (_index, { evaluator }) => {
                // evaluator.valueWithTracking node is the tracked node
                // We need to find it via the module AST — just scan for any tracked value
                for (const [, fileInfo] of _index.files) {
                    for (const item of fileInfo.ast.body) {
                        if (item.type !== "VariableDeclaration") continue
                        const decl = item.declarations[0]
                        if (decl?.id.type !== "Identifier" || decl.id.value !== "config") continue
                        const init = decl.init
                        if (!init) continue
                        trackedValue = evaluator.getTrackedValue(init)
                    }
                }
            }

            await runWithPlugin([mochiCssFunctionExtractor], [module], {
                bundler: {
                    async bundle(rootFilePath, files) {
                        for (const [p, src] of Object.entries(files)) {
                            if (p.endsWith("test.ts") && src) bundledConfigCode = src
                        }
                        return new RolldownBundler().bundle(rootFilePath, files)
                    },
                },
                sourceTransforms: [sourceTransform],
                postEvalTransforms: [postHandler],
            })

            // The wrapped expression should appear as a statement in the bundle even though css() doesn't use it
            expect(bundledConfigCode).toContain("color")
            expect(bundledConfigCode).toContain("red")
            // The runtime value should be captured via getTrackedValue
            expect(trackedValue).toEqual({ color: "red" })
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

                const plugin = createExtractorsPlugin([mochiCssFunctionExtractor])

                const builder = new Builder({
                    roots: ["./"],
                    extractors: plugin.extractors,
                    bundler: new RolldownBundler(),
                    runner: new VmRunner(),
                    sourceTransforms: plugin.sourceTransforms,
                    emitHooks: plugin.emitHooks,
                    emitDir,
                    cleanup: plugin.cleanup,
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

    describe("emitChunk", () => {
        async function withEmitDir(fn: (emitDir: string) => Promise<void>) {
            const emitDir = await fs.mkdtemp(path.join(os.tmpdir(), "mochi-chunk-"))
            try {
                await fn(emitDir)
            } finally {
                await fs.rm(emitDir, { recursive: true, force: true })
            }
        }

        it("chunk emitted from sourceTransform is written to emitDir", async () => {
            await withEmitDir(async (emitDir) => {
                const sourceTransform: AstPostProcessor = (_index, context) => {
                    context.emitChunk("out.css", "body {}")
                }

                await new Builder({
                    roots: ["./"],
                    extractors: [],
                    bundler: new RolldownBundler(),
                    runner: new VmRunner(),
                    sourceTransforms: [sourceTransform],
                    emitDir,
                }).collectStylesFromModules([])

                const content = await fs.readFile(path.join(emitDir, "out.css"), "utf8")
                expect(content).toBe("body {}")
            })
        })

        it("chunk emitted from postEvalTransform is written to emitDir", async () => {
            await withEmitDir(async (emitDir) => {
                const postEvalTransform: AstPostProcessor = (_index, context) => {
                    context.emitChunk("post.css", "h1 {}")
                }

                await new Builder({
                    roots: ["./"],
                    extractors: [],
                    bundler: new RolldownBundler(),
                    runner: new VmRunner(),
                    postEvalTransforms: [postEvalTransform],
                    emitDir,
                }).collectStylesFromModules([])

                const content = await fs.readFile(path.join(emitDir, "post.css"), "utf8")
                expect(content).toBe("h1 {}")
            })
        })

        it("chunk emitted from emitHook is written to emitDir", async () => {
            await withEmitDir(async (emitDir) => {
                const emitHook: EmitHook = (_index, context) => {
                    context.emitChunk("hook.css", "a {}")
                }

                await new Builder({
                    roots: ["./"],
                    extractors: [],
                    bundler: new RolldownBundler(),
                    runner: new VmRunner(),
                    emitHooks: [emitHook],
                    emitDir,
                }).collectStylesFromModules([])

                const content = await fs.readFile(path.join(emitDir, "hook.css"), "utf8")
                expect(content).toBe("a {}")
            })
        })

        it("duplicate chunk content for same path is deduplicated", async () => {
            await withEmitDir(async (emitDir) => {
                const sourceTransform: AstPostProcessor = (_index, context) => {
                    context.emitChunk("out.css", "body {}")
                    context.emitChunk("out.css", "body {}")
                }

                await new Builder({
                    roots: ["./"],
                    extractors: [],
                    bundler: new RolldownBundler(),
                    runner: new VmRunner(),
                    sourceTransforms: [sourceTransform],
                    emitDir,
                }).collectStylesFromModules([])

                const content = await fs.readFile(path.join(emitDir, "out.css"), "utf8")
                expect(content).toBe("body {}")
            })
        })

        it("multiple distinct chunks for same path are joined with newlines", async () => {
            await withEmitDir(async (emitDir) => {
                const sourceTransform: AstPostProcessor = (_index, context) => {
                    context.emitChunk("out.css", "body {}")
                    context.emitChunk("out.css", "h1 {}")
                }

                await new Builder({
                    roots: ["./"],
                    extractors: [],
                    bundler: new RolldownBundler(),
                    runner: new VmRunner(),
                    sourceTransforms: [sourceTransform],
                    emitDir,
                }).collectStylesFromModules([])

                const content = await fs.readFile(path.join(emitDir, "out.css"), "utf8")
                expect(content).toBe("body {}\n\nh1 {}")
            })
        })

        it("chunk path is registered in manifest", async () => {
            await withEmitDir(async (emitDir) => {
                const sourceTransform: AstPostProcessor = (_index, context) => {
                    context.emitChunk("styles.css", "p {}")
                }

                await new Builder({
                    roots: ["./"],
                    extractors: [],
                    bundler: new RolldownBundler(),
                    runner: new VmRunner(),
                    sourceTransforms: [sourceTransform],
                    emitDir,
                }).collectStylesFromModules([])

                const manifest = JSON.parse(
                    await fs.readFile(path.join(emitDir, ".mochi-emit.json"), "utf8"),
                ) as string[]
                expect(manifest).toContain("styles.css")
            })
        })
    })

    describe("evaluator lifecycle", () => {
        it("valueWithTracking in preEval, getTrackedValue in postEval returns runtime value", async () => {
            // config is referenced by css(config), so it appears in usedBindings and the bundled code
            const module = await parseSource(
                dedent`
                import { css } from "@mochi-css/vanilla"
                const config = { color: "red" }
                export const s = css(config)
            `,
                "test.ts",
            )

            let trackedNode: Expression | undefined
            let trackedValue: unknown

            const preHandler: AstPostProcessor = (index, { evaluator }) => {
                for (const [, fileInfo] of index.files) {
                    for (const item of fileInfo.ast.body) {
                        if (item.type !== "VariableDeclaration") continue
                        const decl = item.declarations[0]
                        if (decl?.id.type !== "Identifier" || decl.id.value !== "config") continue
                        const init = decl.init
                        if (!init) continue
                        // Wrap the config initializer so we can read its runtime value
                        const wrapper = evaluator.valueWithTracking(init)
                        trackedNode = wrapper
                        decl.init = wrapper
                    }
                }
            }

            const postHandler: AstPostProcessor = (_index, { evaluator }) => {
                if (trackedNode) {
                    trackedValue = evaluator.getTrackedValue(trackedNode)
                }
            }

            await runWithPlugin([mochiCssFunctionExtractor], [module], {
                sourceTransforms: [preHandler],
                postEvalTransforms: [postHandler],
            })

            // The tracked value should be the runtime value of the config object
            expect(trackedValue).toEqual({ color: "red" })
        })

        it("setGlobal makes a value available in the execution context", async () => {
            // The module references `__myGlobal`, which is only defined via setGlobal
            const module = await parseSource(
                dedent`
                import { css } from "@mochi-css/vanilla"
                const config = __myGlobal
                export const s = css(config)
            `,
                "test.ts",
            )

            const sourceTransform: AstPostProcessor = (_index, { evaluator }) => {
                evaluator.setGlobal("__myGlobal", { color: "blue" })
            }

            const generators = await runWithPlugin([mochiCssFunctionExtractor], [module], {
                sourceTransforms: [sourceTransform],
            })

            const result = await generators.get("@mochi-css/vanilla:css")?.generateStyles()
            const css = Object.values(result?.files ?? {}).join("")
            expect(css).toContain("color: blue")
        })
    })

    describe("stages", () => {
        it("custom stage output is accessible via index.getInstance in a hook", async () => {
            const collectedPaths: string[] = []

            const FilePathStage = defineStage({
                dependsOn: [],
                init(registry: CacheRegistry) {
                    const paths = registry.fileCache(
                        () => [],
                        (file) => file,
                    )
                    return { paths }
                },
            })

            const module = await parseSource(
                dedent`
                import { css } from "@mochi-css/vanilla"
                export const s = css({ color: "red" })
            `,
                "test.ts",
            )

            const handler: AstPostProcessor = (index) => {
                const { paths } = index.getInstance(FilePathStage)
                for (const [filePath] of index.files) {
                    collectedPaths.push(paths.for(filePath).get())
                }
            }

            await runWithPlugin([mochiCssFunctionExtractor], [module], {
                stages: [FilePathStage],
                sourceTransforms: [handler],
            })

            expect(collectedPaths).toEqual(["test.ts"])
        })
    })
})
