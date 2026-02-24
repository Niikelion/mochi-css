import { describe, it, expect } from "vitest"
import path from "path"
import dedent from "dedent"
import * as SWC from "@swc/core"
import { parseSource } from "@/parse"
import { ProjectIndex, ResolveImport, RefMap, FileInfo, DerivedExtractorBinding, BindingInfo } from "@/ProjectIndex"
import { extractRelevantSymbols } from "@/extractRelevantSymbols"
import { mochiCssFunctionExtractor, mochiStyledFunctionExtractor } from "@/extractors/VanillaCssExtractor"
import { StyleExtractor } from "@/extractors/StyleExtractor"
import { StyleGenerator } from "@/generators/StyleGenerator"
import { VanillaCssGenerator } from "@/generators/VanillaCssGenerator"
import { CallExpression, Expression } from "@swc/core"

function buildIndex(
    modules: { ast: SWC.Module; filePath: string }[],
    extractors: StyleExtractor[]
): ProjectIndex {
    const knownFiles = new Set(modules.map(m => m.filePath))

    const resolveImport: ResolveImport = (fromFile, importSource) => {
        const dir = path.dirname(fromFile)
        const extensions = ["", ".ts", ".tsx", ".js", ".jsx"]
        for (const ext of extensions) {
            const resolved = path.resolve(dir, importSource + ext)
            if (knownFiles.has(resolved)) return resolved
        }
        return null
    }

    const index = new ProjectIndex(modules, extractors, resolveImport)
    index.discoverCrossFileDerivedExtractors()
    index.propagateUsages()
    return index
}

function createMockParentExtractor(
    importPath: string,
    symbolName: string,
    derivedNames: string[]
): StyleExtractor {
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
            },
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
                    return {}
                },
            }
        },
    }
}

describe("extractRelevantSymbols", () => {
    it("returns null for a file with no style calls or used bindings", async () => {
        const module = await parseSource(
            dedent`
                const x = 1
                const y = x + 2
            `,
            "unrelated.ts"
        )

        const index = buildIndex([module], [mochiCssFunctionExtractor])
        const result = extractRelevantSymbols(index)

        expect(result["unrelated.ts"]).toBeNull()
    })

    it("generates extractor call statement for a regular css call", async () => {
        const module = await parseSource(
            /* language=typescript */ dedent`
                import { css } from "@mochi-css/vanilla"
                css({ color: "red" })
            `,
            "styles.ts"
        )

        const index = buildIndex([module], [mochiCssFunctionExtractor])
        const result = extractRelevantSymbols(index)

        expect(result["styles.ts"]).toContain(`extractors["@mochi-css/vanilla:css"]`)
        expect(result["styles.ts"]).toContain(`"styles.ts"`)
        expect(result["styles.ts"]).toContain(`color: "red"`)
    })

    it("includes used import binding in module body", async () => {
        const module = await parseSource(
            /* language=typescript */ dedent`
                import { css } from "@mochi-css/vanilla"
                css({ color: "red" })
            `,
            "styles.ts"
        )

        const index = buildIndex([module], [mochiCssFunctionExtractor])
        const result = extractRelevantSymbols(index)

        // The import of css should appear in the module body
        expect(result["styles.ts"]).toContain(`@mochi-css/vanilla`)
    })

    it("returns only module body (no extractor call) for a shared utility file", async () => {
        // This covers the !hasExpressions && derivedStatements.length === 0 && moduleBody > 0 branch:
        // shared.ts exports a variable used in another file's css() call, but has no css calls itself.
        const sharedPath = path.resolve("shared.ts")
        const stylesPath = path.resolve("styles.ts")

        const sharedModule = await parseSource(
            /* language=typescript */ dedent`
                export const red = "red"
                export const unused = "blue"
            `,
            sharedPath
        )

        // noinspection TypeScriptCheckImport
        const stylesModule = await parseSource(
            /* language=typescript */ dedent`
                import { red } from "./shared"
                import { css } from "@mochi-css/vanilla"
                css({ color: red })
            `,
            stylesPath
        )

        const index = buildIndex([sharedModule, stylesModule], [mochiCssFunctionExtractor])
        const result = extractRelevantSymbols(index)

        // shared.ts has usedBindings (red) but no style expressions
        // → takes !hasExpressions path, moduleBody > 0, returns just the module body
        expect(result[sharedPath]).not.toBeNull()
        expect(result[sharedPath]).toContain("red")
        expect(result[sharedPath]).not.toContain("unused")
        // No extractor call generated for the shared file
        expect(result[sharedPath]).not.toContain("extractors")

        // styles.ts should have the extractor call
        expect(result[stylesPath]).toContain(`extractors["@mochi-css/vanilla:css"]`)
    })

    it("returns null for shared utility file when all used bindings produce no module items", async () => {
        // shared.ts is in the index but none of its content is referenced in style expressions
        const sharedPath = path.resolve("shared2.ts")
        const module = await parseSource(
            dedent`
                export const x = 1
            `,
            sharedPath
        )

        const index = buildIndex([module], [mochiCssFunctionExtractor])
        const result = extractRelevantSymbols(index)

        // No style expressions, no usedBindings, no derived → null
        expect(result[sharedPath]).toBeNull()
    })

    it("handles multiple files returning a mix of null and code", async () => {
        const relevantPath = path.resolve("relevant.ts")
        const irrelevantPath = path.resolve("irrelevant.ts")

        const relevantModule = await parseSource(
            /* language=typescript */ dedent`
                import { css } from "@mochi-css/vanilla"
                css({ color: "green" })
            `,
            relevantPath
        )

        const irrelevantModule = await parseSource(
            dedent`
                const x = 42
            `,
            irrelevantPath
        )

        const index = buildIndex([relevantModule, irrelevantModule], [mochiCssFunctionExtractor])
        const result = extractRelevantSymbols(index)

        expect(result[relevantPath]).not.toBeNull()
        expect(result[irrelevantPath]).toBeNull()
        expect(Object.keys(result)).toHaveLength(2)
    })

    it("generates ExportDeclaration for exported derived extractor binding", async () => {
        // Config file: creates derived extractor and exports it
        // This exercises the isExported path in generateDerivedStatements
        const configPath = path.resolve("config.ts")
        const mockParent = createMockParentExtractor("@mock/lib", "createMock", ["css"])

        // noinspection TypeScriptCheckImport
        const configModule = await parseSource(
            /* language=typescript */ dedent`
                import { createMock } from "@mock/lib"
                const { css } = createMock({})
                export { css }
            `,
            configPath
        )

        const index = buildIndex([configModule], [mockParent])
        const result = extractRelevantSymbols(index)

        const code = result[configPath]
        expect(code).not.toBeNull()
        // The derived var: const __mochi_derived_0 = extractors["@mock/lib:createMock"](...)
        expect(code).toContain(`extractors["@mock/lib:createMock"]`)
        // The exported derived binding: export const css = __mochi_derived_0["css"]
        expect(code).toContain("export")
        expect(code).toContain("css")
        expect(code).toContain(`__mochi_derived_0`)
    })

    it("generates local identifier call for cross-file derived extractor consumer", async () => {
        // Consumer file uses an imported derived extractor
        // This exercises the derivedBinding path in generateCallStatements (local identifier call)
        const configPath = path.resolve("cfg.ts")
        const consumerPath = path.resolve("consumer.ts")
        const mockParent = createMockParentExtractor("@mock/lib", "createMock", ["css"])

        // noinspection TypeScriptCheckImport
        const configModule = await parseSource(
            /* language=typescript */ dedent`
                import { createMock } from "@mock/lib"
                const { css } = createMock({})
                export { css }
            `,
            configPath
        )

        // noinspection TypeScriptCheckImport
        const consumerModule = await parseSource(
            /* language=typescript */ dedent`
                import { css } from "./cfg"
                css({ color: "purple" })
            `,
            consumerPath
        )

        const index = buildIndex([configModule, consumerModule], [mockParent])
        const result = extractRelevantSymbols(index)

        const consumerCode = result[consumerPath]
        expect(consumerCode).not.toBeNull()
        // Local identifier call: css("consumer.ts", { color: "purple" })
        // Not using extractors["..."] directly
        expect(consumerCode).toContain("css")
        expect(consumerCode).toContain(`color: "purple"`)
        expect(consumerCode).not.toContain(`extractors["@mock/lib:createMock"]`)
    })

    it("strips unused variables from the module body", async () => {
        // noinspection JSUnusedLocalSymbols
        const module = await parseSource(
            /* language=typescript */ dedent`
                import { css } from "@mochi-css/vanilla"
                const used = "red"
                const notUsed = "blue"
                css({ color: used })
            `,
            "strip.ts"
        )

        const index = buildIndex([module], [mochiCssFunctionExtractor])
        const result = extractRelevantSymbols(index)

        expect(result["strip.ts"]).toContain("used")
        expect(result["strip.ts"]).not.toContain("notUsed")
    })

    it("skips extractor call when extractStaticArgs returns empty array", async () => {
        // mochiStyledFunctionExtractor skips the first arg; styled(Tag) with no style arg returns []
        // This puts an empty array entry in extractedExpressions and triggers expressions.length === 0
        // css({ color }) is also present so hasExpressions=true and generateCallStatements is reached
        // noinspection JSUnusedLocalSymbols
        const module = await parseSource(
            /* language=typescript */ dedent`
                import { css, styled } from "@mochi-css/vanilla"
                const color = "red"
                css({ color })
                styled("div")
            `,
            "empty-args.ts"
        )

        const index = buildIndex([module], [mochiCssFunctionExtractor, mochiStyledFunctionExtractor])
        const result = extractRelevantSymbols(index)

        expect(result["empty-args.ts"]).toContain(`extractors["@mochi-css/vanilla:css"]`)
        // styled had no style args → no extractor call generated for it
        expect(result["empty-args.ts"]).not.toContain(`extractors["@mochi-css/vanilla:styled"]`)
    })

    it("deduplicates shared moduleItems and sorts by source position", async () => {
        // padding and margin share the same VariableDeclaration moduleItem
        // → second binding triggers processedItems.has(item) → continue (line 206)
        // color comes from a separate declaration → usedItems gets 2 entries → sort comparator called (line 212)
        const module = await parseSource(
            /* language=typescript */ dedent`
                import { css } from "@mochi-css/vanilla"
                const color = "red"
                const { padding, margin } = { padding: "8px", margin: "4px" }
                css({ color, padding, margin })
            `,
            "dedup.ts"
        )

        const index = buildIndex([module], [mochiCssFunctionExtractor])
        const result = extractRelevantSymbols(index)

        const code = result["dedup.ts"]
        expect(code).not.toBeNull()
        expect(code).toContain("color")
        expect(code).toContain("padding")
        expect(code).toContain("margin")
        expect(code).toContain(`extractors["@mochi-css/vanilla:css"]`)
    })

    it("excludes derived extractor's destructuring moduleItem when sibling binding is used in style", async () => {
        // const { css, theme } = createMock({}) — theme is NOT a registered derived extractor
        // css({ color: theme }) — theme appears in the style expression
        // → theme's moduleItem (same VarDecl as css) is in parentCallModuleItems → excluded (line 207)
        const mockParent = createMockParentExtractor("@mock/lib", "createMock", ["css"])

        // noinspection TypeScriptCheckImport
        const module = await parseSource(
            /* language=typescript */ dedent`
                import { createMock } from "@mock/lib"
                const { css, theme } = createMock({})
                css({ color: theme })
            `,
            "sibling.ts"
        )

        const index = buildIndex([module], [mockParent])
        const result = extractRelevantSymbols(index)

        const code = result["sibling.ts"]
        expect(code).not.toBeNull()
        // Generated derived pattern replaces the original destructuring
        expect(code).toContain("__mochi_derived_0")
        // The original const { css, theme } = ... is excluded from module body
        expect(code).not.toContain("theme =")
    })

    describe("defensive null guards (via mock ProjectIndex)", () => {
        const emptySpan: SWC.Span = { start: 0, end: 0, ctxt: 0 }

        function mockId(name: string, ctxt: number): SWC.Identifier {
            return { type: "Identifier", span: emptySpan, ctxt, value: name, optional: false }
        }

        function mockVarDecl(name: string, ctxt: number): SWC.VariableDeclaration & { ctxt: number } {
            return {
                type: "VariableDeclaration",
                span: emptySpan,
                ctxt: 0,
                kind: "const",
                declare: false,
                declarations: [
                    {
                        type: "VariableDeclarator",
                        span: emptySpan,
                        id: mockId(name, ctxt),
                        init: { type: "StringLiteral", span: emptySpan, value: "val" },
                        definite: false,
                    },
                ],
            }
        }

        function mockCallExpr(): SWC.CallExpression & { ctxt: number } {
            return {
                type: "CallExpression",
                span: emptySpan,
                ctxt: 0,
                callee: mockId("create", 0),
                arguments: [],
            }
        }

        function makeFileInfo(extras: Partial<FileInfo>): FileInfo {
            return {
                filePath: "mock.ts",
                ast: { type: "Module", span: emptySpan, body: [], interpreter: "" },
                styleExpressions: new Set(),
                extractedExpressions: new Map(),
                references: new Set(),
                moduleBindings: new RefMap(),
                localImports: new RefMap(),
                usedBindings: new Set(),
                exports: new Map(),
                derivedExtractorBindings: new RefMap(),
                exportedDerivedExtractors: new Map(),
                ...extras,
            }
        }

        function mockIndex(fileInfo: FileInfo): ProjectIndex {
            return { files: [["mock.ts", fileInfo]] } as unknown as ProjectIndex
        }

        // A string expression used as a style argument in extractedExpressions
        const redExpr: SWC.Expression = { type: "StringLiteral", span: emptySpan, value: "red" }

        it("skips derived group when parentExtractor is null (line 78 guard)", () => {
            // parentExtractor is forced to null via cast; the group is skipped
            // extractedExpressions is present so generateCallStatements is still reached
            const localId = mockId("css", 1)
            const derivedExtractorBindings = new RefMap<DerivedExtractorBinding>()
            derivedExtractorBindings.set({ name: "css", id: 1 }, {
                extractor: mochiCssFunctionExtractor,
                parentExtractor: null as unknown as StyleExtractor,
                parentCallExpression: mockCallExpr(),
                propertyName: "css",
                localIdentifier: localId,
            })

            const fileInfo = makeFileInfo({
                derivedExtractorBindings,
                extractedExpressions: new Map([[mochiCssFunctionExtractor, [redExpr]]]),
            })

            const result = extractRelevantSymbols(mockIndex(fileInfo))
            // Group was skipped (derivedStatements empty) but extractor call is generated
            expect(result["mock.ts"]).toContain(`"mock.ts"`)
        })

        it("skips adding to parentCallModuleItems when moduleBinding is not found (line 88 guard)", () => {
            // localIdentifier ctxt=99 has no entry in moduleBindings (empty RefMap)
            // → moduleBindings.get() returns undefined → if(moduleBinding) is false
            const localId = mockId("css", 99)
            const derivedExtractorBindings = new RefMap<DerivedExtractorBinding>()
            derivedExtractorBindings.set({ name: "css", id: 99 }, {
                extractor: mochiCssFunctionExtractor,
                parentExtractor: mochiCssFunctionExtractor,
                parentCallExpression: mockCallExpr(),
                propertyName: "css",
                localIdentifier: localId,
            })

            const fileInfo = makeFileInfo({
                derivedExtractorBindings,
                extractedExpressions: new Map([[mochiCssFunctionExtractor, [redExpr]]]),
            })

            const result = extractRelevantSymbols(mockIndex(fileInfo))
            // Derived statements are generated (parentExtractor is valid)
            expect(result["mock.ts"]).toContain("__mochi_derived_0")
        })

        it("skips module body entry when generateMinimalModuleItem returns null (line 216 guard)", () => {
            // Binding has declarator.type='import' but moduleItem=VariableDeclaration
            // → pruneUnusedPatternParts checks for 'variable'-type bindings → none found → null
            // → generateMinimalModuleItem returns null → if(minimalItem) is false
            const varDecl = mockVarDecl("x", 1)
            const fakeImportDecl = { type: "ImportDeclaration" } as unknown as SWC.ImportDeclaration
            const fakeSpec = { local: mockId("x", 1) } as unknown as SWC.ImportSpecifier

            const usedBindings = new Set<BindingInfo>([
                {
                    identifier: mockId("x", 1),
                    ref: { name: "x", id: 1 },
                    declarator: { type: "import", specifier: fakeSpec, declaration: fakeImportDecl },
                    moduleItem: varDecl,
                },
            ])

            const fileInfo = makeFileInfo({
                usedBindings,
                extractedExpressions: new Map([[mochiCssFunctionExtractor, [redExpr]]]),
            })

            const result = extractRelevantSymbols(mockIndex(fileInfo))
            // Module body is empty (minimalItem was null), but extractor call is generated
            expect(result["mock.ts"]).toContain(`extractors["@mochi-css/vanilla:css"]`)
        })
    })

    it("returns null when file imports derived extractor but never calls it", async () => {
        // unused.ts imports css (a derived extractor) but never calls it
        // hasDerived=true → early return skipped; but generateDerivedStatements skips local imports
        // → derivedStatements=[], hasExpressions=false, moduleBody=[] → returns null (line 223)
        const configPath = path.resolve("cfg2.ts")
        const unusedPath = path.resolve("unused.ts")
        const mockParent = createMockParentExtractor("@mock/lib", "createMock", ["css"])

        // noinspection TypeScriptCheckImport
        const configModule = await parseSource(
            /* language=typescript */ dedent`
                import { createMock } from "@mock/lib"
                const { css } = createMock({})
                export { css }
            `,
            configPath
        )

        // noinspection TypeScriptCheckImport,JSUnusedLocalSymbols
        const unusedModule = await parseSource(
            /* language=typescript */ dedent`
                import { css } from "./cfg2"
            `,
            unusedPath
        )

        const index = buildIndex([configModule, unusedModule], [mockParent])
        const result = extractRelevantSymbols(index)

        expect(result[unusedPath]).toBeNull()
    })
})
