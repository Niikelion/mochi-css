import * as SWC from "@swc/core";
import type {
    FileInfo,
    StyleExtractor,
    DerivedExtractorBinding,
} from "./types";
import { generateMinimalModuleItem } from "@mochi-css/builder";

const emptySpan: SWC.Span = { start: 0, end: 0, ctxt: 0 };

function getExtractorId(extractor: StyleExtractor): string {
    return `${extractor.importPath}:${extractor.symbolName}`;
}

function makeExtractorCall(
    extractorId: string,
    filePath: string,
    args: SWC.Argument[],
): SWC.CallExpression & { ctxt: number } {
    return {
        type: "CallExpression",
        span: emptySpan,
        ctxt: 0,
        arguments: [
            {
                expression: {
                    type: "StringLiteral",
                    span: emptySpan,
                    value: filePath,
                },
            },
            ...args,
        ],
        callee: {
            type: "MemberExpression",
            span: emptySpan,
            object: {
                type: "Identifier",
                span: emptySpan,
                ctxt: 1,
                value: "extractors",
                optional: false,
            },
            property: {
                type: "Computed",
                span: emptySpan,
                expression: {
                    type: "StringLiteral",
                    span: emptySpan,
                    value: extractorId,
                },
            },
        },
    };
}

function makeIdentifier(name: string, ctxt: number): SWC.Identifier {
    return {
        type: "Identifier",
        span: emptySpan,
        ctxt,
        value: name,
        optional: false,
    };
}

function makeVarDecl(
    kind: SWC.VariableDeclarationKind,
    declarations: SWC.VariableDeclarator[],
): SWC.VariableDeclaration & { ctxt: number } {
    return {
        type: "VariableDeclaration",
        span: emptySpan,
        ctxt: 0,
        kind,
        declare: false,
        declarations,
    };
}

function makeVarDeclarator(
    id: SWC.Pattern,
    init: SWC.Expression,
): SWC.VariableDeclarator {
    return {
        type: "VariableDeclarator",
        span: emptySpan,
        id,
        init,
        definite: false,
    };
}

/**
 * Tracks a group of extracted arguments that are stored in a shared variable
 * to prevent double evaluation when a css call's result is used as a dependency.
 */
interface DependencyCssCallGroup {
    varName: string;
    expressions: SWC.Expression[];
    bindingDeclarator: SWC.VariableDeclarator;
    callInit: SWC.CallExpression;
    moduleItem: SWC.ModuleItem;
}

/**
 * Finds css call bindings in usedBindings whose args are also in extractedExpressions.
 * These are "dependency calls" — their result is referenced by another css call's args,
 * causing the args to be evaluated twice (once in the binding init, once in the extractor call).
 */
function findDependencyCssCallGroups(
    info: FileInfo,
    counter: { value: number },
): {
    groups: DependencyCssCallGroup[];
    expressionToGroup: Map<SWC.Expression, DependencyCssCallGroup>;
    declaratorToGroup: Map<SWC.VariableDeclarator, DependencyCssCallGroup>;
} {
    const trackedExpressions = new Set<SWC.Expression>();
    for (const expressions of info.extractedExpressions.values()) {
        for (const expr of expressions) {
            trackedExpressions.add(expr);
        }
    }

    const groups: DependencyCssCallGroup[] = [];
    const expressionToGroup = new Map<SWC.Expression, DependencyCssCallGroup>();
    const declaratorToGroup = new Map<
        SWC.VariableDeclarator,
        DependencyCssCallGroup
    >();

    for (const binding of info.usedBindings) {
        if (binding.declarator.type !== "variable") continue;
        const declarator = binding.declarator.declarator;
        const init = declarator.init;
        if (init?.type !== "CallExpression") continue;

        // Avoid creating duplicate groups for the same declarator
        if (declaratorToGroup.has(declarator)) continue;

        // Find args of this call that are tracked extracted expressions
        const callArgs = init.arguments.map((a) => a.expression);
        const trackedCallArgs = callArgs.filter((a) =>
            trackedExpressions.has(a),
        );
        if (trackedCallArgs.length === 0) continue;

        const varName = `__mochi_args_${counter.value++}`;
        const group: DependencyCssCallGroup = {
            varName,
            expressions: trackedCallArgs,
            bindingDeclarator: declarator,
            callInit: init,
            moduleItem: binding.moduleItem,
        };
        groups.push(group);
        for (const arg of trackedCallArgs) {
            expressionToGroup.set(arg, group);
        }
        declaratorToGroup.set(declarator, group);
    }

    return { groups, expressionToGroup, declaratorToGroup };
}

function makeArgsVarDecl(
    group: DependencyCssCallGroup,
): SWC.VariableDeclaration & { ctxt: number } {
    const arrayExpr: SWC.ArrayExpression = {
        type: "ArrayExpression",
        span: emptySpan,
        elements: group.expressions.map((expr) => ({ expression: expr })),
    };
    return makeVarDecl("const", [
        makeVarDeclarator(makeIdentifier(group.varName, 0), arrayExpr),
    ]);
}

function makeSpreadCallExpr(
    group: DependencyCssCallGroup,
): SWC.CallExpression & { ctxt: number } {
    return {
        type: "CallExpression",
        span: emptySpan,
        ctxt: 0,
        callee: group.callInit.callee,
        arguments: [
            { spread: emptySpan, expression: makeIdentifier(group.varName, 0) },
        ],
    };
}

function generateDerivedStatements(
    filePath: string,
    info: FileInfo,
    derivedLookup: Map<StyleExtractor, DerivedExtractorBinding>,
    parentCallModuleItems: Set<SWC.ModuleItem>,
): SWC.ModuleItem[] {
    // Group local derived bindings by parent call
    const parentCallGroups = new Map<
        SWC.CallExpression,
        DerivedExtractorBinding[]
    >();
    for (const binding of info.derivedExtractorBindings.values()) {
        const ref = {
            name: binding.localIdentifier.value,
            id: binding.localIdentifier.ctxt,
        };
        if (info.localImports.has(ref)) continue;

        const group = parentCallGroups.get(binding.parentCallExpression);
        if (group) group.push(binding);
        else parentCallGroups.set(binding.parentCallExpression, [binding]);
    }

    const statements: SWC.ModuleItem[] = [];
    let derivedCounter = 0;

    for (const [callExpr, bindings] of parentCallGroups) {
        const parentExtractor = bindings[0]?.parentExtractor;
        if (!parentExtractor) continue;
        const extractorId = getExtractorId(parentExtractor);
        const parentArgs = parentExtractor.extractStaticArgs(callExpr);
        const varName = `__mochi_derived_${derivedCounter++}`;

        // Mark original destructuring module items for exclusion
        for (const binding of bindings) {
            const moduleBinding = info.moduleBindings.get({
                name: binding.localIdentifier.value,
                id: binding.localIdentifier.ctxt,
            });
            if (moduleBinding)
                parentCallModuleItems.add(moduleBinding.moduleItem);
        }

        // const __mochi_derived_0 = extractors["parent:id"]("file.ts", ...args)
        statements.push(
            makeVarDecl("const", [
                makeVarDeclarator(
                    makeIdentifier(varName, 0),
                    makeExtractorCall(
                        extractorId,
                        filePath,
                        parentArgs.map((e) => ({ expression: e })),
                    ),
                ),
            ]),
        );

        // For each derived binding: [export] const css = __mochi_derived_0["css"]
        for (const binding of bindings) {
            const hasExpressions = info.extractedExpressions.has(
                binding.extractor,
            );
            const isExported = info.exportedDerivedExtractors.has(
                binding.propertyName,
            );

            if (!hasExpressions && !isExported) continue;

            const memberExpr: SWC.MemberExpression = {
                type: "MemberExpression",
                span: emptySpan,
                object: makeIdentifier(varName, 0),
                property: {
                    type: "Computed",
                    span: emptySpan,
                    expression: {
                        type: "StringLiteral",
                        span: emptySpan,
                        value: binding.propertyName,
                    },
                },
            };

            const varDecl = makeVarDecl("const", [
                makeVarDeclarator(
                    makeIdentifier(binding.localIdentifier.value, 0),
                    memberExpr,
                ),
            ]);

            if (isExported) {
                statements.push({
                    type: "ExportDeclaration",
                    span: emptySpan,
                    declaration: varDecl,
                } satisfies SWC.ExportDeclaration);
            } else {
                statements.push(varDecl);
            }
        }
    }

    return statements;
}

function generateCallStatements(
    filePath: string,
    info: FileInfo,
    derivedLookup: Map<StyleExtractor, DerivedExtractorBinding>,
    expressionToGroup: Map<SWC.Expression, DependencyCssCallGroup>,
): SWC.ExpressionStatement[] {
    const statements: SWC.ExpressionStatement[] = [];

    for (const [extractor, callNodes] of info.extractedCallExpressions) {
        if (callNodes.length === 0) continue;

        const derivedBinding = derivedLookup.get(extractor);
        const extractorId = getExtractorId(extractor);

        for (const callNode of callNodes) {
            const staticArgs = extractor.extractStaticArgs(callNode);
            if (staticArgs.length === 0) continue;

            // Build args, replacing grouped expressions with a single spread element
            const processedGroups = new Set<DependencyCssCallGroup>();
            const args: SWC.Argument[] = [];
            for (const expression of staticArgs) {
                const group = expressionToGroup.get(expression);
                if (group) {
                    if (!processedGroups.has(group)) {
                        processedGroups.add(group);
                        args.push({
                            spread: emptySpan,
                            expression: makeIdentifier(group.varName, 0),
                        });
                    }
                    // Skip: already covered by the spread above
                } else {
                    args.push({ expression });
                }
            }
            if (args.length === 0) continue;

            if (derivedBinding) {
                // Derived call: localRef("file.ts", ...args)
                const callExpr: SWC.CallExpression & { ctxt: number } = {
                    type: "CallExpression",
                    span: emptySpan,
                    ctxt: 0,
                    arguments: [
                        {
                            expression: {
                                type: "StringLiteral",
                                span: emptySpan,
                                value: filePath,
                            },
                        },
                        ...args,
                    ],
                    callee: makeIdentifier(
                        derivedBinding.localIdentifier.value,
                        0,
                    ),
                };
                statements.push({
                    type: "ExpressionStatement",
                    span: emptySpan,
                    expression: callExpr,
                });
            } else {
                // Regular call: extractors["id"]("file.ts", ...args)
                statements.push({
                    type: "ExpressionStatement",
                    span: emptySpan,
                    expression: makeExtractorCall(extractorId, filePath, args),
                });
            }
        }
    }

    return statements;
}

/**
 * Extracts relevant symbols from a list of file infos, generating minimal code for each file.
 */
export function extractRelevantSymbols(
    files: [string, FileInfo][],
    extraExpressions?: Map<string, Set<SWC.Expression>>,
): Record<string, string | null> {
    return Object.fromEntries(
        files.map(([filePath, info]) => {
            const styles = info.styleExpressions;
            const hasDerived = info.derivedExtractorBindings.size > 0;
            const extra = [...(extraExpressions?.get(filePath) ?? [])];

            if (
                styles.size === 0 &&
                info.usedBindings.size === 0 &&
                !hasDerived &&
                extra.length === 0
            )
                return [filePath, null];

            // Build derived extractor lookup
            const derivedLookup = new Map<
                StyleExtractor,
                DerivedExtractorBinding
            >();
            for (const binding of info.derivedExtractorBindings.values()) {
                derivedLookup.set(binding.extractor, binding);
            }

            // Generate derived statements and collect module items to exclude
            const parentCallModuleItems = new Set<SWC.ModuleItem>();
            const derivedStatements = hasDerived
                ? generateDerivedStatements(
                      filePath,
                      info,
                      derivedLookup,
                      parentCallModuleItems,
                  )
                : [];

            // Find dependency css call groups (bindings whose css call args are also in extractedExpressions)
            const counter = { value: 0 };
            const { expressionToGroup, declaratorToGroup } =
                findDependencyCssCallGroups(info, counter);

            // Build the module body from used bindings, sorted by original source position
            const moduleBody: SWC.ModuleItem[] = [];
            const processedItems = new Set<SWC.ModuleItem>();

            const usedItems: SWC.ModuleItem[] = [];
            for (const binding of info.usedBindings) {
                const item = binding.moduleItem;
                if (processedItems.has(item)) continue;
                if (parentCallModuleItems.has(item)) continue;
                processedItems.add(item);
                usedItems.push(item);
            }

            usedItems.sort((a, b) => a.span.start - b.span.start);

            for (const item of usedItems) {
                const minimalItem = generateMinimalModuleItem(item, info);
                if (!minimalItem) continue;

                if (minimalItem.type === "VariableDeclaration") {
                    // Check if any declarators in this item are dependency css calls
                    const itemGroups: DependencyCssCallGroup[] = [];
                    for (const d of minimalItem.declarations) {
                        const group = declaratorToGroup.get(d);
                        if (group) itemGroups.push(group);
                    }

                    if (itemGroups.length > 0) {
                        // Insert args variables first, then the modified binding declaration
                        for (const group of itemGroups) {
                            moduleBody.push(makeArgsVarDecl(group));
                        }
                        const modifiedDeclarators =
                            minimalItem.declarations.map((d) => {
                                const group = declaratorToGroup.get(d);
                                if (!group) return d;
                                return makeVarDeclarator(
                                    d.id,
                                    makeSpreadCallExpr(group),
                                );
                            });
                        moduleBody.push({
                            ...minimalItem,
                            declarations: modifiedDeclarators,
                        });
                    } else {
                        moduleBody.push(minimalItem);
                    }
                } else {
                    moduleBody.push(minimalItem);
                }
            }

            const extraStatements: SWC.ExpressionStatement[] = extra.map(
                (expression) => ({
                    type: "ExpressionStatement",
                    span: emptySpan,
                    expression,
                }),
            );

            const hasExpressions =
                styles.size > 0 ||
                info.extractedExpressions.size > 0 ||
                extra.length > 0;
            if (!hasExpressions && derivedStatements.length === 0) {
                if (moduleBody.length === 0) return [filePath, null];

                const code = SWC.printSync({
                    type: "Module",
                    span: emptySpan,
                    body: moduleBody,
                    interpreter: "",
                }).code;

                return [filePath, code];
            }

            const callStatements = generateCallStatements(
                filePath,
                info,
                derivedLookup,
                expressionToGroup,
            );

            const code = SWC.printSync({
                type: "Module",
                span: emptySpan,
                body: [
                    ...moduleBody,
                    ...derivedStatements,
                    ...callStatements,
                    ...extraStatements,
                ],
                interpreter: "",
            }).code;

            return [filePath, code];
        }),
    );
}
