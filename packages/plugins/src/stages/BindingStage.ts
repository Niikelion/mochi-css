import * as SWC from "@swc/core";
import type { DerivedExtractorBinding } from "../types";
import { visit } from "@mochi-css/builder";
import { defineStage } from "@mochi-css/builder";
import type { CacheRegistry, FileCache } from "@mochi-css/builder";
import { RefMap } from "@mochi-css/builder";
import type {
    BindingInfo,
    BindingDeclarator,
    LocalImport,
} from "@mochi-css/builder";
import { idToRef, isLocalImport, type Ref } from "@mochi-css/builder";
import type { StageDefinition } from "@mochi-css/builder";
import { makeStyleExprStage, type StyleExprStageOut } from "./StyleExprStage";

function collectBindingsFromPattern(
    pattern: SWC.Pattern,
    declarator: SWC.VariableDeclarator,
    declaration: SWC.VariableDeclaration,
    moduleItem: SWC.ModuleItem,
    bindings: RefMap<BindingInfo>,
): void {
    switch (pattern.type) {
        case "Identifier": {
            const ref = idToRef(pattern);
            bindings.set(ref, {
                identifier: pattern,
                ref,
                declarator: { type: "variable", declarator, declaration },
                moduleItem,
            });
            break;
        }
        case "ObjectPattern":
            for (const prop of pattern.properties) {
                switch (prop.type) {
                    case "RestElement": {
                        collectBindingsFromPattern(
                            prop.argument,
                            declarator,
                            declaration,
                            moduleItem,
                            bindings,
                        );
                        break;
                    }
                    case "KeyValuePatternProperty": {
                        collectBindingsFromPattern(
                            prop.value,
                            declarator,
                            declaration,
                            moduleItem,
                            bindings,
                        );
                        break;
                    }
                }
                if (prop.type === "RestElement") {
                    collectBindingsFromPattern(
                        prop.argument,
                        declarator,
                        declaration,
                        moduleItem,
                        bindings,
                    );
                } else if (prop.type === "AssignmentPatternProperty") {
                    const ref = idToRef(prop.key);
                    bindings.set(ref, {
                        identifier: prop.key,
                        ref,
                        declarator: {
                            type: "variable",
                            declarator,
                            declaration,
                        },
                        moduleItem,
                    });
                }
            }
            break;
        case "ArrayPattern":
            for (const element of pattern.elements) {
                if (element) {
                    collectBindingsFromPattern(
                        element,
                        declarator,
                        declaration,
                        moduleItem,
                        bindings,
                    );
                }
            }
            break;
        case "RestElement":
            collectBindingsFromPattern(
                pattern.argument,
                declarator,
                declaration,
                moduleItem,
                bindings,
            );
            break;
        case "AssignmentPattern":
            collectBindingsFromPattern(
                pattern.left,
                declarator,
                declaration,
                moduleItem,
                bindings,
            );
            break;
    }
}

type BindingStageResult = {
    moduleBindings: RefMap<BindingInfo>;
    localImports: RefMap<LocalImport>;
    references: Set<SWC.Identifier>;
    exports: Map<string, Ref>;
    exportedDerivedExtractors: Map<string, DerivedExtractorBinding>;
};

export type BindingStageOut = {
    fileBindings: FileCache<BindingStageResult>;
    fileData: StyleExprStageOut["fileData"];
    derived: StyleExprStageOut["derived"];
    styleExprs: StyleExprStageOut["styleExprs"];
};

export const BINDING_STAGE = Symbol.for("BindingStage");

export function makeBindingStage(
    styleExprStage: ReturnType<typeof makeStyleExprStage>,
): StageDefinition<[ReturnType<typeof makeStyleExprStage>], BindingStageOut> {
    const stage = defineStage({
        dependsOn: [styleExprStage] as const,
        init(
            registry: CacheRegistry,
            styleExprInst: StyleExprStageOut,
        ): BindingStageOut {
            const fileBindings = registry.fileCache(
                (file) => [styleExprInst.fileData.cache.for(file)],
                (file): BindingStageResult => {
                    const data = styleExprInst.fileData.cache.for(file).get();
                    const { derivedBindings } = styleExprInst.derived
                        .for(file)
                        .get();

                    const moduleBindings = new RefMap<BindingInfo>();
                    const localImports = new RefMap<LocalImport>();
                    const references = new Set<SWC.Identifier>();
                    const exports = new Map<string, Ref>();

                    // Pass 3: Collect module-level bindings, local imports, and exports
                    for (const item of data.ast.body) {
                        switch (item.type) {
                            case "ImportDeclaration": {
                                const isLocal = isLocalImport(
                                    item.source.value,
                                );
                                const sourcePath = isLocal
                                    ? data.resolveImport(
                                          file,
                                          item.source.value,
                                      )
                                    : null;

                                if (isLocal && sourcePath === null) {
                                    data.onDiagnostic?.({
                                        code: "MOCHI_UNRESOLVED_IMPORT",
                                        message: `Cannot resolve local import "${item.source.value}"`,
                                        severity: "warning",
                                        file,
                                        line: item.source.span.start,
                                    });
                                }

                                for (const specifier of item.specifiers) {
                                    if (
                                        specifier.type ===
                                        "ImportNamespaceSpecifier"
                                    )
                                        continue;

                                    const ref = idToRef(specifier.local);
                                    const sourceName =
                                        specifier.type === "ImportSpecifier"
                                            ? (specifier.imported?.value ??
                                              ref.name)
                                            : ref.name;

                                    if (sourcePath) {
                                        localImports.set(ref, {
                                            localRef: ref,
                                            sourcePath,
                                            exportName: sourceName,
                                        });
                                    }

                                    moduleBindings.set(ref, {
                                        identifier: specifier.local,
                                        ref,
                                        declarator: {
                                            type: "import",
                                            specifier,
                                            declaration: item,
                                        },
                                        moduleItem: item,
                                    });
                                }
                                break;
                            }

                            case "VariableDeclaration":
                                for (const declarator of item.declarations) {
                                    collectBindingsFromPattern(
                                        declarator.id,
                                        declarator,
                                        item,
                                        item,
                                        moduleBindings,
                                    );
                                }
                                break;

                            case "FunctionDeclaration": {
                                const ref = idToRef(item.identifier);
                                moduleBindings.set(ref, {
                                    identifier: item.identifier,
                                    ref,
                                    declarator: {
                                        type: "function",
                                        declaration: item,
                                    },
                                    moduleItem: item,
                                });
                                break;
                            }

                            case "ClassDeclaration": {
                                const ref = idToRef(item.identifier);
                                moduleBindings.set(ref, {
                                    identifier: item.identifier,
                                    ref,
                                    declarator: {
                                        type: "class",
                                        declaration: item,
                                    },
                                    moduleItem: item,
                                });
                                break;
                            }

                            case "ExportDeclaration": {
                                const decl = item.declaration;
                                if (decl.type === "VariableDeclaration") {
                                    for (const declarator of decl.declarations) {
                                        collectBindingsFromPattern(
                                            declarator.id,
                                            declarator,
                                            decl,
                                            item,
                                            moduleBindings,
                                        );
                                        if (declarator.id.type !== "Identifier")
                                            continue;
                                        const ref = idToRef(declarator.id);
                                        exports.set(ref.name, ref);
                                    }
                                    break;
                                }
                                const identifier =
                                    decl.type === "FunctionDeclaration" ||
                                    decl.type === "ClassDeclaration"
                                        ? decl.identifier
                                        : null;
                                if (!identifier) break;
                                const ref = idToRef(identifier);
                                const type =
                                    decl.type === "FunctionDeclaration"
                                        ? "function"
                                        : "class";
                                moduleBindings.set(ref, {
                                    identifier,
                                    ref,
                                    declarator: {
                                        type,
                                        declaration: decl,
                                    } as BindingDeclarator,
                                    moduleItem: item,
                                });
                                exports.set(ref.name, ref);
                                break;
                            }

                            case "ExportNamedDeclaration":
                                for (const specifier of item.specifiers) {
                                    if (specifier.type !== "ExportSpecifier")
                                        continue;
                                    const localName =
                                        specifier.orig.type === "Identifier"
                                            ? specifier.orig.value
                                            : specifier.orig.value;
                                    const exportedName =
                                        specifier.exported?.value ?? localName;
                                    const binding =
                                        moduleBindings.getByName(localName);
                                    if (binding)
                                        exports.set(exportedName, binding.ref);
                                }
                                break;
                        }
                    }

                    // Pass 4: Collect references (identifiers used in expressions)
                    visit.module(
                        data.ast,
                        {
                            functionDeclaration(_, { descend, context }) {
                                descend({
                                    ...context,
                                    scopeDepth: context.scopeDepth + 1,
                                });
                            },
                            functionExpression(_, { descend, context }) {
                                descend({
                                    ...context,
                                    scopeDepth: context.scopeDepth + 1,
                                });
                            },
                            arrowFunctionExpression(_, { descend, context }) {
                                descend({
                                    ...context,
                                    scopeDepth: context.scopeDepth + 1,
                                });
                            },
                            classMethod(_, { descend, context }) {
                                descend({
                                    ...context,
                                    scopeDepth: context.scopeDepth + 1,
                                });
                            },
                            variableDeclarator(node) {
                                if (node.init) {
                                    visit.expression(
                                        node.init,
                                        {
                                            identifier(id) {
                                                references.add(id);
                                            },
                                        },
                                        null,
                                    );
                                }
                            },
                            param() {
                                /* skip parameters */
                            },
                            pattern() {
                                /* skip patterns */
                            },
                            identifier(node, { context }) {
                                if (context.scopeDepth === 0) {
                                    references.add(node);
                                }
                            },
                            tsType() {
                                /* empty */
                            },
                        },
                        { scopeDepth: 0 },
                    );

                    // Post-pass: populate exportedDerivedExtractors
                    const exportedDerivedExtractors = new Map<
                        string,
                        DerivedExtractorBinding
                    >();
                    for (const [exportName, ref] of exports) {
                        const binding = derivedBindings.get(ref);
                        if (binding) {
                            exportedDerivedExtractors.set(exportName, binding);
                        }
                    }

                    return {
                        moduleBindings,
                        localImports,
                        references,
                        exports,
                        exportedDerivedExtractors,
                    };
                },
            );

            return {
                fileBindings,
                fileData: styleExprInst.fileData,
                derived: styleExprInst.derived,
                styleExprs: styleExprInst.styleExprs,
            };
        },
    });

    return Object.assign(stage, { [BINDING_STAGE]: true as const });
}
