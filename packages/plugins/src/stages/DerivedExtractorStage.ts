import * as SWC from "@swc/core"
import type { StyleExtractor, DerivedExtractorBinding } from "../types"
import type { Diagnostic } from "@mochi-css/core"
import { defineStage } from "@mochi-css/builder"
import type { FileCache, StageContext } from "@mochi-css/builder"
import { RefMap } from "@mochi-css/builder"
import { idToRef } from "@mochi-css/builder"
import { importStageDef, type ImportSpecStageOut } from "./ImportSpecStage"

type DerivedStageResult = {
    /** Refs of identifiers bound to a derived extractor (e.g. `css` in `const { css } = createStitches(...)`). */
    derivedBindings: RefMap<DerivedExtractorBinding>
    /** Call expressions whose return value was destructured into derived extractors. */
    parentCalls: Set<SWC.CallExpression>
    /** Union of import-spec extractors and all discovered derived extractors in this file. */
    mergedExtractorIds: RefMap<StyleExtractor>
}

/**
 * Output of {@link derivedStageDef}.
 *
 * - `derived` — per-file cache with derived extractor bindings and the merged extractor map
 */
export type DerivedExtractorStageOut = {
    derived: FileCache<DerivedStageResult>
}

function discoverDerivedFromDeclarator(
    declarator: SWC.VariableDeclarator,
    styleExtractorIdentifiers: RefMap<StyleExtractor>,
    derivedExtractorBindings: RefMap<DerivedExtractorBinding>,
    parentCallsWithDerived: Set<SWC.CallExpression>,
    filePath: string,
    onDiagnostic: (d: Diagnostic) => void,
): void {
    if (declarator.init?.type !== "CallExpression") return
    if (declarator.init.callee.type !== "Identifier") return

    const calleeRef = idToRef(declarator.init.callee)
    const parentExtractor = styleExtractorIdentifiers.get(calleeRef)
    if (!parentExtractor?.derivedExtractors) return

    const extractorName = `${parentExtractor.importPath}:${parentExtractor.symbolName}`

    if (declarator.id.type !== "ObjectPattern") {
        onDiagnostic({
            code: "MOCHI_INVALID_EXTRACTOR_USAGE",
            message:
                `Return value of "${extractorName}" must be destructured with an object pattern ` +
                `(e.g. \`const { css } = ${parentExtractor.symbolName}(...)\`), ` +
                `but was assigned to a ${declarator.id.type === "Identifier" ? "variable" : "non-object pattern"}. ` +
                `Sub-extractors will not be discovered.`,
            severity: "warning",
            file: filePath,
            line: declarator.init.span.start,
        })
        return
    }

    const hasRestSpread = declarator.id.properties.some((p) => p.type === "RestElement")
    if (hasRestSpread) {
        onDiagnostic({
            code: "MOCHI_INVALID_EXTRACTOR_USAGE",
            message:
                `Destructuring of "${extractorName}" must not use rest spread (\`...\`). ` +
                `Each sub-extractor must be explicitly named so it can be statically analyzed.`,
            severity: "warning",
            file: filePath,
            line: declarator.init.span.start,
        })
        return
    }

    parentCallsWithDerived.add(declarator.init)

    for (const prop of declarator.id.properties) {
        let keyName: string | null = null
        let localId: SWC.Identifier | null = null

        if (prop.type === "AssignmentPatternProperty") {
            keyName = prop.key.value
            localId = prop.key
        } else if (prop.type === "KeyValuePatternProperty") {
            if (prop.key.type === "Identifier") keyName = prop.key.value
            if (prop.value.type === "Identifier") localId = prop.value
        }

        if (!keyName || !localId) continue

        const derivedExtractor = parentExtractor.derivedExtractors.get(keyName)
        if (!derivedExtractor) continue

        const ref = idToRef(localId)
        derivedExtractorBindings.set(ref, {
            extractor: derivedExtractor,
            parentExtractor,
            parentCallExpression: declarator.init,
            propertyName: keyName,
            localIdentifier: localId,
        })
        styleExtractorIdentifiers.set(ref, derivedExtractor)
    }
}

/**
 * Derived extractor discovery.
 *
 * Scans top-level variable declarations for calls whose callee is a known parent extractor
 * (one with `derivedExtractors` defined). When found, the destructured bindings are mapped
 * to their child {@link StyleExtractor}s and merged into the extractor identifier map.
 *
 * Emits diagnostics when the return value is not destructured or uses rest spread.
 *
 * Depends on {@link importStageDef}.
 */
export const derivedStageDef = defineStage({
    dependsOn: [importStageDef] as const,
    init(context: StageContext, importInst: ImportSpecStageOut): DerivedExtractorStageOut {
        const { registry, log: onDiagnostic } = context
        const derived = registry.fileCache(
            (file) => [importInst.importSpecs.for(file), registry.fileData.for(file)],
            (file): DerivedStageResult => {
                const { ast } = registry.fileData.for(file).get()

                // Seed styleExtractorIds from ImportSpecStage output
                const importSpecsResult = importInst.importSpecs.for(file).get()
                const styleExtractorIds = new RefMap<StyleExtractor>()
                for (const [ref, extractor] of importSpecsResult.entries()) {
                    styleExtractorIds.set(ref, extractor)
                }

                const derivedExtractorBindings = new RefMap<DerivedExtractorBinding>()
                const parentCallsWithDerived = new Set<SWC.CallExpression>()

                // Pass 1.5: discover derived extractors from destructuring
                for (const item of ast.body) {
                    let varDecl: SWC.VariableDeclaration | null = null
                    if (item.type === "VariableDeclaration") {
                        varDecl = item
                    } else if (item.type === "ExportDeclaration" && item.declaration.type === "VariableDeclaration") {
                        varDecl = item.declaration
                    }
                    if (!varDecl) continue

                    for (const declarator of varDecl.declarations) {
                        discoverDerivedFromDeclarator(
                            declarator,
                            styleExtractorIds,
                            derivedExtractorBindings,
                            parentCallsWithDerived,
                            file,
                            onDiagnostic,
                        )
                    }
                }

                // Pass 1.75: warn about ignored return values from parent extractors
                for (const item of ast.body) {
                    let expr: SWC.Expression | undefined
                    if (item.type === "ExpressionStatement") {
                        expr = item.expression
                    }
                    if (expr?.type !== "CallExpression") continue
                    if (expr.callee.type !== "Identifier") continue

                    const calleeRef = idToRef(expr.callee)
                    const extractor = styleExtractorIds.get(calleeRef)
                    if (!extractor?.derivedExtractors) continue

                    const extractorName = `${extractor.importPath}:${extractor.symbolName}`
                    onDiagnostic({
                        code: "MOCHI_INVALID_EXTRACTOR_USAGE",
                        message:
                            `Return value of "${extractorName}" is not used. ` +
                            `"${extractor.symbolName}" produces sub-extractors that must be destructured ` +
                            `(e.g. \`const { css } = ${extractor.symbolName}(...)\`).`,
                        severity: "warning",
                        file,
                        line: expr.span.start,
                    })
                }

                return {
                    derivedBindings: derivedExtractorBindings,
                    parentCalls: parentCallsWithDerived,
                    mergedExtractorIds: styleExtractorIds,
                }
            },
        )

        return { derived }
    },
})
