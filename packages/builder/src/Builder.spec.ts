import {describe, it, expect} from "vitest"
import path from "path"
import {parseSource} from "@/parse";
import dedent from "dedent";
import {Builder} from "@/Builder";
import {RolldownBundler} from "@/Bundler";
import {VmRunner} from "@/Runner";
import { mochiCssFunctionExtractor } from "@/extractors/VanillaCssExtractor"
import { mochiKeyframesFunctionExtractor } from "@/extractors/VanillaKeyframesExtractor"
import { StyleExtractor } from "@/extractors/StyleExtractor"
import { StyleGenerator } from "@/generators/StyleGenerator"
import { VanillaCssGenerator } from "@/generators/VanillaCssGenerator"
import { CallExpression, Expression } from "@swc/core"

function createMockParentExtractor(importPath: string, symbolName: string, derivedNames: string[]): StyleExtractor {
    const derivedExtractors = new Map<string, StyleExtractor>()
    for (const name of derivedNames) {
        derivedExtractors.set(name, {
            importPath,
            symbolName: name,
            extractStaticArgs(call: CallExpression): Expression[] {
                return call.arguments.map(a => a.expression)
            },
            startGeneration(): StyleGenerator {
                return new VanillaCssGenerator()
            }
        })
    }

    return {
        importPath,
        symbolName,
        derivedExtractors,
        extractStaticArgs(call: CallExpression): Expression[] {
            return call.arguments.map(a => a.expression)
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
                }
            }
        }
    }
}

describe("Builder", () => {
    it("extracts style expressions from css calls", async () => {
        const module = await parseSource(/* language=typescript */ dedent`
            import { css } from "@mochi-css/vanilla"

            export const buttonStyles = css({
                backgroundColor: "gray",

                "&:hover": {
                    backgroundColor: "white"
                }
            })
        `,"buttonStyles.ts")

        const builder = new Builder({
            rootDir: "./",
            extractors: [mochiCssFunctionExtractor],
            bundler: new RolldownBundler(),
            runner: new VmRunner()
        })

        const generators = await builder.collectStylesFromModules([module])
        const generator = generators.get("@mochi-css/vanilla:css")!
        const result = await generator.generateStyles()

        const fileCss = Object.values(result.files!).join("\n\n")
        expect(fileCss).toContain("background-color: gray")
        expect(fileCss).toContain("background-color: white")
    })

    it("strips unused module-level symbols", async () => {
        const module = await parseSource(/* language=typescript */ dedent`
            import { css } from "@mochi-css/vanilla"

            // @ts-ignore
            const { color, name = fib(1000).toString() } = { color: "blue" }

            console.log(name)

            export const linkStyles = css({
                textDecoration: "none",
                color
            })
        `, "linkStyles.ts")

        let generatedCode = ""

        const builder = new Builder({
            rootDir: "./",
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
                }
            },
            runner: new VmRunner()
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
        const moduleA = await parseSource(/* language=typescript */ dedent`
            import { css } from "@mochi-css/vanilla"
            export const a = css({ color: "red" })
        `, "a.ts")

        const moduleB = await parseSource(/* language=typescript */ dedent`
            import { css } from "@mochi-css/vanilla"
            export const b = css({ color: "blue" })
        `, "b.ts")

        const builder = new Builder({
            rootDir: "./",
            extractors: [mochiCssFunctionExtractor],
            bundler: new RolldownBundler(),
            runner: new VmRunner()
        })

        const generators = await builder.collectStylesFromModules([moduleA, moduleB])
        const generator = generators.get("@mochi-css/vanilla:css")!
        const result = await generator.generateStyles()

        expect(result.files).toBeDefined()
        expect(result.files!["a.ts"]).toContain("color: red")
        expect(result.files!["b.ts"]).toContain("color: blue")
        expect(result.files!["a.ts"]).not.toContain("color: blue")
    })

    it("VanillaKeyframesGenerator returns per-file CSS", async () => {
        const module = await parseSource(/* language=typescript */ dedent`
            import { keyframes } from "@mochi-css/vanilla"
            export const fade = keyframes({ from: { opacity: "0" }, to: { opacity: "1" } })
        `, "anim.ts")

        const builder = new Builder({
            rootDir: "./",
            extractors: [mochiKeyframesFunctionExtractor],
            bundler: new RolldownBundler(),
            runner: new VmRunner()
        })

        const generators = await builder.collectStylesFromModules([module])
        const generator = generators.get("@mochi-css/vanilla:keyframes")!
        const result = await generator.generateStyles()

        expect(result.files).toBeDefined()
        expect(result.files!["anim.ts"]).toContain("@keyframes")
        expect(result.global).toBeUndefined()
    })

    describe("derived extractors", () => {
        const mockParent = createMockParentExtractor("@mock/lib", "createMock", ["css"])

        it("single-file derived extractor produces CSS", async () => {
            // noinspection TypeScriptCheckImport
            const module = await parseSource(/* language=typescript */ dedent`
                import { createMock } from "@mock/lib"
                const { css } = createMock({})
                css({ color: "red" })
            `, "single.ts")

            const builder = new Builder({
                rootDir: "./",
                extractors: [mockParent],
                bundler: new RolldownBundler(),
                runner: new VmRunner()
            })

            const generators = await builder.collectStylesFromModules([module])
            const generator = generators.get("@mock/lib:createMock")!
            const result = await generator.generateStyles()

            expect(result.files).toBeDefined()
            expect(result.files!["single.ts"]).toContain("color: red")
        })

        it("cross-file derived extractor propagation", async () => {
            const configPath = path.resolve("config.ts")
            const buttonPath = path.resolve("button.ts")

            // noinspection TypeScriptCheckImport
            const configModule = await parseSource(/* language=typescript */ dedent`
                import { createMock } from "@mock/lib"
                const { css } = createMock({})
                export { css }
            `, configPath)

            // noinspection TypeScriptCheckImport
            const buttonModule = await parseSource(/* language=typescript */ dedent`
                import { css } from "./config"
                css({ color: "blue" })
            `, buttonPath)

            const builder = new Builder({
                rootDir: "./",
                extractors: [mockParent],
                bundler: new RolldownBundler(),
                runner: new VmRunner()
            })

            const generators = await builder.collectStylesFromModules([configModule, buttonModule])
            const generator = generators.get("@mock/lib:createMock")!
            const result = await generator.generateStyles()

            expect(result.files).toBeDefined()
            expect(result.files![buttonPath]).toContain("color: blue")
        })

        it("mixed regular and derived extractors", async () => {
            const configPath = path.resolve("config.ts")
            const styledPath = path.resolve("styled.ts")

            // noinspection TypeScriptCheckImport
            const configModule = await parseSource(/* language=typescript */ dedent`
                import { createMock } from "@mock/lib"
                const { css } = createMock({})
                export { css }
            `, configPath)

            // noinspection TypeScriptCheckImport
            const styledModule = await parseSource(/* language=typescript */ dedent`
                import { css } from "@mochi-css/vanilla"
                import { css as themeCss } from "./config"
                css({ color: "red" })
                themeCss({ color: "blue" })
            `, styledPath)

            const builder = new Builder({
                rootDir: "./",
                extractors: [mochiCssFunctionExtractor, mockParent],
                bundler: new RolldownBundler(),
                runner: new VmRunner()
            })

            const generators = await builder.collectStylesFromModules([configModule, styledModule])

            const regularGen = generators.get("@mochi-css/vanilla:css")!
            const regularResult = await regularGen.generateStyles()
            expect(regularResult.files![styledPath]).toContain("color: red")

            const derivedGen = generators.get("@mock/lib:createMock")!
            const derivedResult = await derivedGen.generateStyles()
            expect(derivedResult.files![styledPath]).toContain("color: blue")
        })

        it("renamed destructuring", async () => {
            // noinspection TypeScriptCheckImport
            const module = await parseSource(/* language=typescript */ dedent`
                import { createMock } from "@mock/lib"
                const { css: myCss } = createMock({})
                myCss({ color: "green" })
            `, "renamed.ts")

            const builder = new Builder({
                rootDir: "./",
                extractors: [mockParent],
                bundler: new RolldownBundler(),
                runner: new VmRunner()
            })

            const generators = await builder.collectStylesFromModules([module])
            const generator = generators.get("@mock/lib:createMock")!
            const result = await generator.generateStyles()

            expect(result.files).toBeDefined()
            expect(result.files!["renamed.ts"]).toContain("color: green")
        })

        it("code minimization only includes used derived bindings", async () => {
            const multiDerived = createMockParentExtractor("@mock/lib", "createMock", ["css", "styled"])

            // noinspection TypeScriptCheckImport, JSUnusedLocalSymbols
            const module = await parseSource(/* language=typescript */ dedent`
                import { createMock } from "@mock/lib"
                const { css, styled } = createMock({})
                css({ color: "red" })
            `, "minimal.ts")

            let generatedCode = ""
            const builder = new Builder({
                rootDir: "./",
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
                    }
                },
                runner: new VmRunner()
            })

            await builder.collectStylesFromModules([module])

            expect(generatedCode).toContain("css")
            expect(generatedCode).not.toContain("styled")
        })

        it("warns when parent extractor return value is assigned to a variable", async () => {
            const diagnostics: { code: string, message: string }[] = []

            // noinspection TypeScriptCheckImport, JSUnusedLocalSymbols
            const module = await parseSource(/* language=typescript */ dedent`
                import { createMock } from "@mock/lib"
                const styles = createMock({})
            `, "assign.ts")

            const builder = new Builder({
                rootDir: "./",
                extractors: [mockParent],
                bundler: new RolldownBundler(),
                runner: new VmRunner(),
                onDiagnostic: d => diagnostics.push(d)
            })

            await builder.collectStylesFromModules([module])

            expect(diagnostics).toContainEqual(expect.objectContaining({
                code: 'MOCHI_INVALID_EXTRACTOR_USAGE',
                message: expect.stringContaining('must be destructured with an object pattern')
            }))
        })

        it("warns when parent extractor return value is ignored", async () => {
            const diagnostics: { code: string, message: string }[] = []

            // noinspection TypeScriptCheckImport
            const module = await parseSource(/* language=typescript */ dedent`
                import { createMock } from "@mock/lib"
                createMock({})
            `, "ignored.ts")

            const builder = new Builder({
                rootDir: "./",
                extractors: [mockParent],
                bundler: new RolldownBundler(),
                runner: new VmRunner(),
                onDiagnostic: d => diagnostics.push(d)
            })

            await builder.collectStylesFromModules([module])

            expect(diagnostics).toContainEqual(expect.objectContaining({
                code: 'MOCHI_INVALID_EXTRACTOR_USAGE',
                message: expect.stringContaining('is not used')
            }))
        })

        it("warns when parent extractor destructuring uses rest spread", async () => {
            const diagnostics: { code: string, message: string }[] = []

            // noinspection TypeScriptCheckImport, JSUnusedLocalSymbols
            const module = await parseSource(/* language=typescript */ dedent`
                import { createMock } from "@mock/lib"
                const { css, ...rest } = createMock({})
            `, "rest.ts")

            const builder = new Builder({
                rootDir: "./",
                extractors: [mockParent],
                bundler: new RolldownBundler(),
                runner: new VmRunner(),
                onDiagnostic: d => diagnostics.push(d)
            })

            await builder.collectStylesFromModules([module])

            expect(diagnostics).toContainEqual(expect.objectContaining({
                code: 'MOCHI_INVALID_EXTRACTOR_USAGE',
                message: expect.stringContaining('must not use rest spread')
            }))
        })
    })
})
