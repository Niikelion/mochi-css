import { describe, it, expect } from "vitest"
import path from "path"
import fs from "fs/promises"
import os from "os"
import { parseSource } from "@/parse"
import dedent from "dedent"
import { Builder } from "@/Builder"
import { RolldownBundler } from "@/Bundler"
import { VmRunner } from "@/Runner"
import { StyleExtractor } from "@/extractors/StyleExtractor"
import { AstPostProcessor, AnalysisContext, BuilderOptions, EmitHook } from "@/Builder"
import { Module, ProjectIndex } from "@/ProjectIndex"
import { defineStage } from "@/analysis/Stage"
import type { CacheRegistry } from "@/analysis/CacheEngine"
import { Evaluator } from "@/Evaluator"
import { createDefaultStages } from "@/analysis/stages"
import { CallExpression, Expression } from "@swc/core"

const testCssExtractor: StyleExtractor = {
    importPath: "@mochi-css/vanilla",
    symbolName: "css",
    extractStaticArgs(call: CallExpression): Expression[] {
        return call.arguments.slice(0, 1).map((a) => a.expression)
    },
    startGeneration() {
        return {
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            collectArgs() {},
            async generateStyles() {
                return {}
            },
        }
    },
}

async function runBuilder(
    extractors: StyleExtractor[],
    modules: Module[],
    extraOptions: Partial<BuilderOptions> = {},
): Promise<Map<string, Set<string>>> {
    const stubTransform: AstPostProcessor = (_index, { evaluator }) => {
        const stub: Record<string, () => Record<string, unknown>> = {}
        for (const ext of extractors) {
            stub[`${ext.importPath}:${ext.symbolName}`] = () => ({})
        }
        evaluator.setGlobal("extractors", stub)
    }
    return new Builder({
        roots: ["./"],
        bundler: new RolldownBundler(),
        runner: new VmRunner(),
        ...extraOptions,
        stages: [...createDefaultStages(extractors), ...(extraOptions.stages ?? [])],
        sourceTransforms: [stubTransform, ...(extraOptions.sourceTransforms ?? [])],
    }).collectStylesFromModules(modules)
}

describe("Builder", () => {
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

        await runBuilder([testCssExtractor], [module], {
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

            await runBuilder([testCssExtractor], [module], { sourceTransforms: [handler] })

            expect(receivedIndex).toBeDefined()
            expect(receivedIndex?.files.length).toBe(1)
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

            await runBuilder([testCssExtractor], [module], {
                preEvalTransforms: [preEvalHandler],
                postEvalTransforms: [postHandler],
            })

            expect(canonicalColorValue).toBe("red")
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

            await runBuilder([testCssExtractor], [module], {
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

            await runBuilder([testCssExtractor], [module], {
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

            await runBuilder([testCssExtractor], [module], {
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

                await runBuilder([testCssExtractor], [module], {
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
                await runBuilder([testCssExtractor], [module2], {
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

            await runBuilder([testCssExtractor], [module], {
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
                    stages: createDefaultStages([]),
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
                    stages: createDefaultStages([]),
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
                    stages: createDefaultStages([]),
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
                    stages: createDefaultStages([]),
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
                    stages: createDefaultStages([]),
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
                    stages: createDefaultStages([]),
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

            await runBuilder([testCssExtractor], [module], {
                sourceTransforms: [preHandler],
                postEvalTransforms: [postHandler],
            })

            // The tracked value should be the runtime value of the config object
            expect(trackedValue).toEqual({ color: "red" })
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

            await runBuilder([testCssExtractor], [module], {
                stages: [FilePathStage],
                sourceTransforms: [handler],
            })

            expect(collectedPaths).toEqual(["test.ts"])
        })
    })
})
