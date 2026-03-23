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
import { AstPostProcessor } from "@/Builder"
import { ProjectIndex } from "@/ProjectIndex"

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

        const builder = new Builder({
            roots: ["./"],
            extractors: [mochiCssFunctionExtractor],
            bundler: new RolldownBundler(),
            runner: new VmRunner(),
        })

        const generators = await builder.collectStylesFromModules([module])
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

        const builder = new Builder({
            roots: ["./"],
            extractors: [mochiCssFunctionExtractor],
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
            runner: new VmRunner(),
        })

        await builder.collectStylesFromModules([module])

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

        const builder = new Builder({
            roots: ["./"],
            extractors: [mochiCssFunctionExtractor],
            bundler: new RolldownBundler(),
            runner: new VmRunner(),
        })

        const generators = await builder.collectStylesFromModules([moduleA, moduleB])
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

        const builder = new Builder({
            roots: ["./"],
            extractors: [mochiGlobalCssFunctionExtractor],
            bundler: new RolldownBundler(),
            runner: new VmRunner(),
        })

        const generators = await builder.collectStylesFromModules([module])
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

        const builder = new Builder({
            roots: ["./"],
            extractors: [mochiKeyframesFunctionExtractor],
            bundler: new RolldownBundler(),
            runner: new VmRunner(),
        })

        const generators = await builder.collectStylesFromModules([module])
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
        const builder = new Builder({
            roots: ["./"],
            extractors: [mochiCssFunctionExtractor],
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
            runner: new VmRunner(),
        })

        const generators = await builder.collectStylesFromModules([module])
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

            const { generators } = await builder.collectMochiStyles()
            const generator = generators.get("@mochi-css/vanilla:css")
            const result = await generator?.generateStyles()
            expect.assert(result !== undefined)

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

            const { generators } = await builder.collectMochiStyles()
            const generator = generators.get("@mochi-css/vanilla:css")
            const result = await generator?.generateStyles()
            expect.assert(result !== undefined)

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

            const { generators } = await builder.collectMochiStyles()
            const generator = generators.get("@mochi-css/vanilla:css")
            const result = await generator?.generateStyles()
            expect.assert(result !== undefined)

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

            const builder = new Builder({
                roots: ["./"],
                extractors: [mockParent],
                bundler: new RolldownBundler(),
                runner: new VmRunner(),
            })

            const generators = await builder.collectStylesFromModules([module])
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

            const builder = new Builder({
                roots: ["./"],
                extractors: [mockParent],
                bundler: new RolldownBundler(),
                runner: new VmRunner(),
            })

            const generators = await builder.collectStylesFromModules([configModule, buttonModule])
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

            const builder = new Builder({
                roots: ["./"],
                extractors: [mochiCssFunctionExtractor, mockParent],
                bundler: new RolldownBundler(),
                runner: new VmRunner(),
            })

            const generators = await builder.collectStylesFromModules([configModule, styledModule])

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

            const builder = new Builder({
                roots: ["./"],
                extractors: [mockParent],
                bundler: new RolldownBundler(),
                runner: new VmRunner(),
            })

            const generators = await builder.collectStylesFromModules([module])
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
            const builder = new Builder({
                roots: ["./"],
                extractors: [multiDerived],
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
                runner: new VmRunner(),
            })

            await builder.collectStylesFromModules([module])

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

            const builder = new Builder({
                roots: ["./"],
                extractors: [mockParent],
                bundler: new RolldownBundler(),
                runner: new VmRunner(),
                onDiagnostic: (d) => diagnostics.push(d),
            })

            await builder.collectStylesFromModules([module])

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

            const builder = new Builder({
                roots: ["./"],
                extractors: [mockParent],
                bundler: new RolldownBundler(),
                runner: new VmRunner(),
                onDiagnostic: (d) => diagnostics.push(d),
            })

            await builder.collectStylesFromModules([module])

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

            const builder = new Builder({
                roots: ["./"],
                extractors: [mockParent],
                bundler: new RolldownBundler(),
                runner: new VmRunner(),
                onDiagnostic: (d) => diagnostics.push(d),
            })

            await builder.collectStylesFromModules([module])

            expect(diagnostics).toContainEqual(
                expect.objectContaining({
                    code: "MOCHI_INVALID_EXTRACTOR_USAGE",
                    message: expect.stringContaining("must not use rest spread") as string,
                }),
            )
        })
    })

    describe("astPostProcessors", () => {
        function makeBuilder(astPostProcessors: AstPostProcessor[]) {
            return new Builder({
                roots: ["./"],
                extractors: [mochiCssFunctionExtractor],
                bundler: new RolldownBundler(),
                runner: new VmRunner(),
                astPostProcessors,
            })
        }

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

            await makeBuilder([handler]).collectStylesFromModules([module])

            expect(receivedIndex).toBeDefined()
            expect(receivedIndex?.files.length).toBe(1)
        })

        it("pipeline is unaffected when astPostProcessors array is empty", async () => {
            const module = await parseSource(
                dedent`
                import { css } from "@mochi-css/vanilla"
                export const s = css({ color: "red" })
            `,
                "test.ts",
            )

            const generators = await makeBuilder([]).collectStylesFromModules([module])
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

            const generators = await makeBuilder([handler]).collectStylesFromModules([module])
            const result = await generators.get("@mochi-css/vanilla:css")?.generateStyles()
            const css = Object.values(result?.files ?? {}).join("")
            expect(css).toContain("color: blue")
            expect(css).not.toContain("color: red")
        })
    })
})
