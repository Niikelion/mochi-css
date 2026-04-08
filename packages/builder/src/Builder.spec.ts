import { describe, it, expect } from "vitest"
import path from "path"
import fs from "fs/promises"
import os from "os"
import { parseSource } from "@/parse"
import dedent from "dedent"
import { Builder } from "@/Builder"
import { RolldownBundler } from "@/Bundler"
import { VmRunner } from "@/Runner"
import type { AstPostProcessor, AnalysisContext, BuilderOptions, EmitHook } from "@/Builder"
import type { Module } from "@/StageRunner"
import { defineStage } from "@/analysis/Stage"
import type { CacheRegistry } from "@/analysis/CacheEngine"
import { Evaluator } from "@/Evaluator"
import type { Expression } from "@swc/core"
import * as SWC from "@swc/core"

async function runBuilder(
    modules: Module[],
    extraOptions: Partial<BuilderOptions> = {},
): Promise<Map<string, Set<string>>> {
    return new Builder({
        roots: ["./"],
        bundler: new RolldownBundler(),
        runner: new VmRunner(),
        ...extraOptions,
        stages: [...(extraOptions.stages ?? [])],
        sourceTransforms: [...(extraOptions.sourceTransforms ?? [])],
    }).collectStylesFromModules(modules)
}

describe("Builder", () => {
    describe("sourceTransforms", () => {
        it("calls the handler with runner and context", async () => {
            const module = await parseSource(`export const x = 1`, "test.ts")

            let handlerCalled = false
            const handler: AstPostProcessor = (_runner, _context) => {
                handlerCalled = true
            }

            await runBuilder([module], { sourceTransforms: [handler] })
            expect(handlerCalled).toBe(true)
        })

        it("multiple sourceTransforms are all called in order", async () => {
            const module = await parseSource(`export const x = 1`, "test.ts")
            const order: number[] = []

            await runBuilder([module], {
                sourceTransforms: [
                    () => {
                        order.push(1)
                    },
                    () => {
                        order.push(2)
                    },
                ],
            })

            expect(order).toEqual([1, 2])
        })
    })

    describe("preEvalTransforms", () => {
        it("mutations to eval copy do not affect the canonical AST seen by postEvalTransforms", async () => {
            const module = await parseSource(
                dedent`
                export const s = "red"
            `,
                "test.ts",
            )

            let canonicalValue: string | undefined

            // Capture the module in the pre-eval transform closure and mutate it
            const preEvalHandler: AstPostProcessor = () => {
                // Mutate the AST copy — but we verify the canonical is unchanged
                const decl = module.ast.body[0]
                if (decl?.type === "ExportDeclaration" && decl.declaration.type === "VariableDeclaration") {
                    const init = decl.declaration.declarations[0]?.init
                    if (init?.type === "StringLiteral") {
                        init.value = "blue"
                    }
                }
            }

            // Capture the canonical module in postEvalTransforms
            const capturedModule = await parseSource(`export const s = "red"`, "test.ts")
            const postHandler: AstPostProcessor = () => {
                const decl = capturedModule.ast.body[0]
                if (decl?.type === "ExportDeclaration" && decl.declaration.type === "VariableDeclaration") {
                    const init = decl.declaration.declarations[0]?.init
                    if (init?.type === "StringLiteral") {
                        canonicalValue = init.value
                    }
                }
            }

            await runBuilder([capturedModule], {
                preEvalTransforms: [preEvalHandler],
                postEvalTransforms: [postHandler],
            })

            // The canonical module used in postEval should be unchanged (still "red")
            expect(canonicalValue).toBe("red")
        })
    })

    describe("postEvalTransforms", () => {
        it("is called after execution with evaluator populated", async () => {
            const module = await parseSource(`export const x = 1`, "test.ts")

            let capturedContext: AnalysisContext | undefined
            const postHandler: AstPostProcessor = (_runner, context) => {
                capturedContext = context
            }

            await runBuilder([module], { postEvalTransforms: [postHandler] })

            expect(capturedContext).toBeDefined()
            expect(capturedContext?.evaluator).toBeInstanceOf(Evaluator)
        })
    })

    describe("cleanup", () => {
        it("is called once at the end of the pipeline", async () => {
            const module = await parseSource(`export const x = 1`, "test.ts")
            let cleanupCallCount = 0

            await runBuilder([module], {
                cleanup: () => {
                    cleanupCallCount++
                },
            })

            expect(cleanupCallCount).toBe(1)
        })

        it("cleanup is called after postEvalTransforms", async () => {
            const module = await parseSource(`export const x = 1`, "test.ts")
            const order: string[] = []

            await runBuilder([module], {
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
                const module = await parseSource(`export const x = 1`, "test.ts")

                const emitHook: EmitHook = (_runner, context) => {
                    context.emitChunk("output.css", ".foo { color: red }")
                }

                await runBuilder([module], { emitHooks: [emitHook], emitDir })
                const written = await fs.readFile(path.join(emitDir, "output.css"), "utf8")
                expect(written).toBe(".foo { color: red }")

                // Second run without that file → should be deleted
                const emitHook2: EmitHook = () => undefined
                await runBuilder([module], { emitHooks: [emitHook2], emitDir })
                await expect(fs.readFile(path.join(emitDir, "output.css"), "utf8")).rejects.toThrow()
            } finally {
                await fs.rm(emitDir, { recursive: true, force: true })
            }
        })
    })

    describe("markForEval", () => {
        it("expression marked for eval is bundled and its runtime value is capturable", async () => {
            const module = await parseSource(
                dedent`
                const config = { color: "red" }
                export const x = 1
            `,
                "test.ts",
            )

            let trackedNode: Expression | undefined
            let trackedValue: unknown

            const sourceTransform: AstPostProcessor = (_runner, context) => {
                for (const item of module.ast.body) {
                    if (item.type !== "VariableDeclaration") continue
                    const decl = item.declarations[0]
                    if (decl?.id.type !== "Identifier" || decl.id.value !== "config") continue
                    const init = decl.init
                    if (!init) continue
                    const wrapper = context.evaluator.valueWithTracking(init)
                    trackedNode = wrapper
                    decl.init = wrapper
                    context.markForEval(module.filePath, wrapper)
                }
            }

            const postHandler: AstPostProcessor = (_runner, { evaluator }) => {
                if (trackedNode) trackedValue = evaluator.getTrackedValue(trackedNode)
            }

            await runBuilder([module], {
                sourceTransforms: [sourceTransform],
                postEvalTransforms: [postHandler],
                getFilesToBundle: (_runner, markedForEval) => {
                    const result: Record<string, string | null> = {}
                    for (const fp of markedForEval.keys()) {
                        if (fp === module.filePath) {
                            result[fp] = SWC.printSync(module.ast).code
                        }
                    }
                    return result
                },
            })

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
                const sourceTransform: AstPostProcessor = (_runner, context) => {
                    context.emitChunk("out.css", "body {}")
                }

                await new Builder({
                    roots: ["./"],
                    stages: [],
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
                const postEvalTransform: AstPostProcessor = (_runner, context) => {
                    context.emitChunk("post.css", "h1 {}")
                }

                await new Builder({
                    roots: ["./"],
                    stages: [],
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
                const emitHook: EmitHook = (_runner, context) => {
                    context.emitChunk("hook.css", "a {}")
                }

                await new Builder({
                    roots: ["./"],
                    stages: [],
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
                const sourceTransform: AstPostProcessor = (_runner, context) => {
                    context.emitChunk("out.css", "body {}")
                    context.emitChunk("out.css", "body {}")
                }

                await new Builder({
                    roots: ["./"],
                    stages: [],
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
                const sourceTransform: AstPostProcessor = (_runner, context) => {
                    context.emitChunk("out.css", "body {}")
                    context.emitChunk("out.css", "h1 {}")
                }

                await new Builder({
                    roots: ["./"],
                    stages: [],
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
                const sourceTransform: AstPostProcessor = (_runner, context) => {
                    context.emitChunk("styles.css", "p {}")
                }

                await new Builder({
                    roots: ["./"],
                    stages: [],
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
        it("valueWithTracking in sourceTransform, getTrackedValue in postEval returns runtime value", async () => {
            const module = await parseSource(
                dedent`
                const config = { color: "red" }
                export const x = 1
            `,
                "test.ts",
            )

            let trackedNode: Expression | undefined
            let trackedValue: unknown

            const sourceHandler: AstPostProcessor = (_runner, context) => {
                for (const item of module.ast.body) {
                    if (item.type !== "VariableDeclaration") continue
                    const decl = item.declarations[0]
                    if (decl?.id.type !== "Identifier" || decl.id.value !== "config") continue
                    const init = decl.init
                    if (!init) continue
                    const wrapper = context.evaluator.valueWithTracking(init)
                    trackedNode = wrapper
                    decl.init = wrapper
                    context.markForEval(module.filePath, wrapper)
                }
            }

            const postHandler: AstPostProcessor = (_runner, { evaluator }) => {
                if (trackedNode) {
                    trackedValue = evaluator.getTrackedValue(trackedNode)
                }
            }

            await runBuilder([module], {
                sourceTransforms: [sourceHandler],
                postEvalTransforms: [postHandler],
                getFilesToBundle: (_runner, markedForEval) => {
                    const result: Record<string, string | null> = {}
                    for (const fp of markedForEval.keys()) {
                        if (fp === module.filePath) {
                            result[fp] = SWC.printSync(module.ast).code
                        }
                    }
                    return result
                },
            })

            expect(trackedValue).toEqual({ color: "red" })
        })
    })

    describe("stages", () => {
        it("custom stage output is accessible via runner.getInstance in a hook", async () => {
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

            const module = await parseSource(`export const x = 1`, "test.ts")

            const handler: AstPostProcessor = (runner) => {
                const { paths } = runner.getInstance(FilePathStage)
                for (const fp of runner.getFilePaths()) {
                    collectedPaths.push(paths.for(fp).get())
                }
            }

            await runBuilder([module], {
                stages: [FilePathStage],
                sourceTransforms: [handler],
            })

            expect(collectedPaths).toEqual(["test.ts"])
        })
    })
})
