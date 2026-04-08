import * as SWC from "@swc/core";
import type { StyleExtractor, DerivedExtractorBinding } from "../types";
import type { Diagnostic } from "@mochi-css/core";
import { defineStage } from "@mochi-css/builder";
import type { CacheRegistry, FileCache } from "@mochi-css/builder";
import { RefMap } from "@mochi-css/builder";
import { idToRef } from "@mochi-css/builder";
import type { StageDefinition } from "@mochi-css/builder";
import {
    makeImportSpecStage,
    type ImportSpecStageOut,
} from "./ImportSpecStage";

type DerivedStageResult = {
    derivedBindings: RefMap<DerivedExtractorBinding>;
    parentCalls: Set<SWC.CallExpression>;
    mergedExtractorIds: RefMap<StyleExtractor>;
};

export type DerivedExtractorStageOut = {
    derived: FileCache<DerivedStageResult>;
    fileData: ImportSpecStageOut["fileData"];
};

function discoverDerivedFromDeclarator(
    declarator: SWC.VariableDeclarator,
    styleExtractorIdentifiers: RefMap<StyleExtractor>,
    derivedExtractorBindings: RefMap<DerivedExtractorBinding>,
    parentCallsWithDerived: Set<SWC.CallExpression>,
    filePath: string,
    onDiagnostic: ((d: Diagnostic) => void) | undefined,
): void {
    if (declarator.init?.type !== "CallExpression") return;
    if (declarator.init.callee.type !== "Identifier") return;

    const calleeRef = idToRef(declarator.init.callee);
    const parentExtractor = styleExtractorIdentifiers.get(calleeRef);
    if (!parentExtractor?.derivedExtractors) return;

    const extractorName = `${parentExtractor.importPath}:${parentExtractor.symbolName}`;

    if (declarator.id.type !== "ObjectPattern") {
        onDiagnostic?.({
            code: "MOCHI_INVALID_EXTRACTOR_USAGE",
            message:
                `Return value of "${extractorName}" must be destructured with an object pattern ` +
                `(e.g. \`const { css } = ${parentExtractor.symbolName}(...)\`), ` +
                `but was assigned to a ${declarator.id.type === "Identifier" ? "variable" : "non-object pattern"}. ` +
                `Sub-extractors will not be discovered.`,
            severity: "warning",
            file: filePath,
            line: declarator.init.span.start,
        });
        return;
    }

    const hasRestSpread = declarator.id.properties.some(
        (p) => p.type === "RestElement",
    );
    if (hasRestSpread) {
        onDiagnostic?.({
            code: "MOCHI_INVALID_EXTRACTOR_USAGE",
            message:
                `Destructuring of "${extractorName}" must not use rest spread (\`...\`). ` +
                `Each sub-extractor must be explicitly named so it can be statically analyzed.`,
            severity: "warning",
            file: filePath,
            line: declarator.init.span.start,
        });
        return;
    }

    parentCallsWithDerived.add(declarator.init);

    for (const prop of declarator.id.properties) {
        let keyName: string | null = null;
        let localId: SWC.Identifier | null = null;

        if (prop.type === "AssignmentPatternProperty") {
            keyName = prop.key.value;
            localId = prop.key;
        } else if (prop.type === "KeyValuePatternProperty") {
            if (prop.key.type === "Identifier") keyName = prop.key.value;
            if (prop.value.type === "Identifier") localId = prop.value;
        }

        if (!keyName || !localId) continue;

        const derivedExtractor = parentExtractor.derivedExtractors.get(keyName);
        if (!derivedExtractor) continue;

        const ref = idToRef(localId);
        derivedExtractorBindings.set(ref, {
            extractor: derivedExtractor,
            parentExtractor,
            parentCallExpression: declarator.init,
            propertyName: keyName,
            localIdentifier: localId,
        });
        styleExtractorIdentifiers.set(ref, derivedExtractor);
    }
}

export const DERIVED_EXTRACTOR_STAGE = Symbol.for("DerivedExtractorStage");

export function makeDerivedExtractorStage(
    importStage: ReturnType<typeof makeImportSpecStage>,
): StageDefinition<
    [ReturnType<typeof makeImportSpecStage>],
    DerivedExtractorStageOut
> {
    const stage = defineStage({
        dependsOn: [importStage] as const,
        init(
            registry: CacheRegistry,
            importInst: ImportSpecStageOut,
        ): DerivedExtractorStageOut {
            const derived = registry.fileCache(
                (file) => [importInst.importSpecs.for(file)],
                (file): DerivedStageResult => {
                    const data = importInst.fileData.cache.for(file).get();

                    // Seed styleExtractorIds from ImportSpecStage output
                    const importSpecsResult = importInst.importSpecs
                        .for(file)
                        .get();
                    const styleExtractorIds = new RefMap<StyleExtractor>();
                    for (const [
                        ref,
                        extractor,
                    ] of importSpecsResult.entries()) {
                        styleExtractorIds.set(ref, extractor);
                    }

                    const derivedExtractorBindings =
                        new RefMap<DerivedExtractorBinding>();
                    const parentCallsWithDerived =
                        new Set<SWC.CallExpression>();

                    // Pass 1.5: discover derived extractors from destructuring
                    for (const item of data.ast.body) {
                        let varDecl: SWC.VariableDeclaration | null = null;
                        if (item.type === "VariableDeclaration") {
                            varDecl = item;
                        } else if (
                            item.type === "ExportDeclaration" &&
                            item.declaration.type === "VariableDeclaration"
                        ) {
                            varDecl = item.declaration;
                        }
                        if (!varDecl) continue;

                        for (const declarator of varDecl.declarations) {
                            discoverDerivedFromDeclarator(
                                declarator,
                                styleExtractorIds,
                                derivedExtractorBindings,
                                parentCallsWithDerived,
                                file,
                                data.onDiagnostic,
                            );
                        }
                    }

                    // Pass 1.75: warn about ignored return values from parent extractors
                    for (const item of data.ast.body) {
                        let expr: SWC.Expression | undefined;
                        if (item.type === "ExpressionStatement") {
                            expr = item.expression;
                        }
                        if (expr?.type !== "CallExpression") continue;
                        if (expr.callee.type !== "Identifier") continue;

                        const calleeRef = idToRef(expr.callee);
                        const extractor = styleExtractorIds.get(calleeRef);
                        if (!extractor?.derivedExtractors) continue;

                        const extractorName = `${extractor.importPath}:${extractor.symbolName}`;
                        data.onDiagnostic?.({
                            code: "MOCHI_INVALID_EXTRACTOR_USAGE",
                            message:
                                `Return value of "${extractorName}" is not used. ` +
                                `"${extractor.symbolName}" produces sub-extractors that must be destructured ` +
                                `(e.g. \`const { css } = ${extractor.symbolName}(...)\`).`,
                            severity: "warning",
                            file,
                            line: expr.span.start,
                        });
                    }

                    return {
                        derivedBindings: derivedExtractorBindings,
                        parentCalls: parentCallsWithDerived,
                        mergedExtractorIds: styleExtractorIds,
                    };
                },
            );

            return { derived, fileData: importInst.fileData };
        },
    });

    return Object.assign(stage, { [DERIVED_EXTRACTOR_STAGE]: true as const });
}
