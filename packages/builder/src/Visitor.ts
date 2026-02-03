import SWC from "@swc/core"

const ret = Symbol("ret")
type Ret = typeof ret

function run(callback: () => Ret): void {
    callback()
}

function visitAny<C>(_: AnyNode, context: VisitorContext<C>) {
    context.descend(context.context)
}

const defaultVisitors = {
    stringLiteral<C>(_node: SWC.StringLiteral, _context: VisitorContext<C>) {},
    booleanLiteral<C>(_node: SWC.BooleanLiteral, _context: VisitorContext<C>) {},
    nullLiteral<C>(_node: SWC.NullLiteral, _context: VisitorContext<C>) {},
    numericLiteral<C>(_node: SWC.NumericLiteral, _context: VisitorContext<C>) {},
    bigIntLiteral<C>(_node: SWC.BigIntLiteral, _context: VisitorContext<C>) {},
    regExpLiteral<C>(_node: SWC.RegExpLiteral, _context: VisitorContext<C>) {},
    module<C>(node: SWC.Module, context: VisitorContext<C>): void {
        node.body.forEach(node => visit.moduleItem(node, context.visitors, context.context))
    },
    moduleItem<C>(node: SWC.ModuleItem, context: VisitorContext<C>): void {
        run(() => {
            switch (node.type) {
                case "ImportDeclaration":
                case "ExportDeclaration":
                case "ExportNamedDeclaration":
                case "ExportDefaultDeclaration":
                case "ExportDefaultExpression":
                case "ExportAllDeclaration":
                case "TsImportEqualsDeclaration":
                case "TsExportAssignment":
                case "TsNamespaceExportDeclaration":
                    return visit.moduleDeclaration(node, context.visitors, context.context, true)
                default:
                    return visit.statement(node, context.visitors, context.context, true)
            }
        })
    },
    moduleDeclaration<C>(node: SWC.ModuleDeclaration, context: VisitorContext<C>): void {
        run(() => {
            switch (node.type) {
                case "ImportDeclaration":
                    return visit.importDeclaration(node, context.visitors, context.context, true)
                case "ExportDeclaration":
                    return visit.exportDeclaration(node, context.visitors, context.context, true)
                case "ExportNamedDeclaration":
                    return visit.exportNamedDeclaration(node, context.visitors, context.context, true)
                case "ExportDefaultDeclaration":
                    return visit.exportDefaultDeclaration(node, context.visitors, context.context, true)
                case "ExportDefaultExpression":
                    return visit.exportDefaultExpression(node, context.visitors, context.context, true)
                case "ExportAllDeclaration":
                    return visit.exportAllDeclaration(node, context.visitors, context.context, true)
                case "TsImportEqualsDeclaration":
                    return visit.tsImportEqualsDeclaration(node, context.visitors, context.context, true)
                case "TsExportAssignment":
                    return visit.tsExportAssignment(node, context.visitors, context.context, true)
                case "TsNamespaceExportDeclaration":
                    return visit.tsNamespaceExportDeclaration(node, context.visitors, context.context, true)
            }
        })
    },
    exportDeclaration<C>(node: SWC.ExportDeclaration, context: VisitorContext<C>): void {
        visit.declaration(node.declaration, context.visitors, context.context)
    },
    exportNamedDeclaration<C>(node: SWC.ExportNamedDeclaration, context: VisitorContext<C>): void {
        node.specifiers.forEach(specifier => visit.exportSpecifier(specifier, context.visitors, context.context))
        if (node.source) visit.stringLiteral(node.source, context.visitors, context.context)
        if (node.asserts) visit.objectExpression(node.asserts, context.visitors, context.context)
    },
    exportDefaultDeclaration<C>(node: SWC.ExportDefaultDeclaration, context: VisitorContext<C>): void {
        visit.defaultDecl(node.decl, context.visitors, context.context)
    },
    exportDefaultExpression<C>(node: SWC.ExportDefaultExpression, context: VisitorContext<C>): void {
        visit.expression(node.expression, context.visitors, context.context)
    },
    exportAllDeclaration<C>(node: SWC.ExportAllDeclaration, context: VisitorContext<C>): void {
        visit.stringLiteral(node.source, context.visitors, context.context)
        if (node.asserts) visit.objectExpression(node.asserts, context.visitors, context.context)
    },
    tsImportEqualsDeclaration<C>(node: SWC.TsImportEqualsDeclaration, context: VisitorContext<C>): void {
        visit.identifier(node.id, context.visitors, context.context)
        visit.tsModuleReference(node.moduleRef, context.visitors, context.context)
    },
    tsModuleReference<C>(node: SWC.TsModuleReference, context: VisitorContext<C>): void {
        run(() => {
            switch (node.type) {
                case "TsQualifiedName":
                case "Identifier":
                    return visit.tsEntityName(node, context.visitors, context.context, true)
                case "TsExternalModuleReference":
                    return visit.tsExternalModuleReference(node, context.visitors, context.context, true)
            }
        })
    },
    tsExternalModuleReference<C>(node: SWC.TsExternalModuleReference, context: VisitorContext<C>): void {
        visit.stringLiteral(node.expression, context.visitors, context.context)
    },
    tsExportAssignment<C>(node: SWC.TsExportAssignment, context: VisitorContext<C>): void {
        visit.expression(node.expression, context.visitors, context.context)
    },
    tsNamespaceExportDeclaration<C>(node: SWC.TsNamespaceExportDeclaration, context: VisitorContext<C>): void {
        visit.identifier(node.id, context.visitors, context.context)
    },
    defaultDecl<C>(node: SWC.DefaultDecl, context: VisitorContext<C>): void {
        run(() => {
            switch (node.type) {
                case "ClassExpression":
                    return visit.classExpression(node, context.visitors, context.context, true)
                case "FunctionExpression":
                    return visit.functionExpression(node, context.visitors, context.context, true)
                case "TsInterfaceDeclaration":
                    return visit.tsInterfaceDeclaration(node, context.visitors, context.context, true)
            }
        })
    },
    exportSpecifier<C>(node: SWC.ExportSpecifier, context: VisitorContext<C>): void {
        run(() => {
            switch (node.type) {
                case "ExportNamespaceSpecifier":
                    return visit.exportNamespaceSpecifier(node, context.visitors, context.context, true)
                case "ExportDefaultSpecifier":
                    return visit.exportDefaultSpecifier(node, context.visitors, context.context, true)
                case "ExportSpecifier":
                    return visit.namedExportSpecifier(node, context.visitors, context.context, true)
            }
        })
    },
    namedExportSpecifier<C>(node: SWC.NamedExportSpecifier, context: VisitorContext<C>): void {
        visit.moduleExportName(node.orig, context.visitors, context.context)
        if (node.exported) visit.moduleExportName(node.exported, context.visitors, context.context)
    },
    exportNamespaceSpecifier<C>(node: SWC.ExportNamespaceSpecifier, context: VisitorContext<C>): void {
        visit.moduleExportName(node.name, context.visitors, context.context)
    },
    moduleExportName<C>(node: SWC.ModuleExportName, context: VisitorContext<C>): void {
        run(() => {
            switch (node.type) {
                case "Identifier":
                    return visit.identifier(node, context.visitors, context.context, true)
                case "StringLiteral":
                    return visit.stringLiteral(node, context.visitors, context.context, true)
            }
        })
    },
    exportDefaultSpecifier<C>(node: SWC.ExportDefaultSpecifier, context: VisitorContext<C>): void {
        visit.identifier(node.exported, context.visitors, context.context)
    },
    importDeclaration<C>(node: SWC.ImportDeclaration, context: VisitorContext<C>): void {
        node.specifiers.forEach(specifier => visit.importSpecifier(specifier, context.visitors, context.context))
        visit.stringLiteral(node.source, context.visitors, context.context)
        if (node.asserts)
            visit.objectExpression(node.asserts, context.visitors, context.context)
    },
    importSpecifier<C>(node: SWC.ImportSpecifier, context: VisitorContext<C>): void {
        run(() => {
            switch (node.type) {
                case "ImportSpecifier":
                    return visit.importNamedSpecifier(node, context.visitors, context.context, true)
                case "ImportDefaultSpecifier":
                    return visit.importDefaultSpecifier(node, context.visitors, context.context, true)
                case "ImportNamespaceSpecifier":
                    return visit.importNamespaceSpecifier(node, context.visitors, context.context, true)
            }
        })
    },
    importNamedSpecifier<C>(node: SWC.NamedImportSpecifier, context: VisitorContext<C>): void {
        visit.identifier(node.local, context.visitors, context.context)
        if (node.imported) visit.moduleExportName(node.imported, context.visitors, context.context)
    },
    importDefaultSpecifier<C>(node: SWC.ImportDefaultSpecifier, context: VisitorContext<C>): void {
        visit.identifier(node.local, context.visitors, context.context)
    },
    importNamespaceSpecifier<C>(node: SWC.ImportNamespaceSpecifier, context: VisitorContext<C>): void {
        visit.identifier(node.local, context.visitors, context.context)
    },
    declaration<C>(node: SWC.Declaration, context: VisitorContext<C>): void {
        run(() => {
            switch (node.type) {
                case "ClassDeclaration":
                    return visit.classDeclaration(node, context.visitors, context.context, true)
                case "FunctionDeclaration":
                    return visit.functionDeclaration(node, context.visitors, context.context, true)
                case "VariableDeclaration":
                    return visit.variableDeclaration(node, context.visitors, context.context, true)
                case "TsInterfaceDeclaration":
                    return visit.tsInterfaceDeclaration(node, context.visitors, context.context, true)
                case "TsTypeAliasDeclaration":
                    return visit.tsTypeAliasDeclaration(node, context.visitors, context.context, true)
                case "TsEnumDeclaration":
                    return visit.tsEnumDeclaration(node, context.visitors, context.context, true)
                case "TsModuleDeclaration":
                    return visit.tsModuleDeclaration(node, context.visitors, context.context, true)
            }
        })
    },
    variableDeclaration<C>(node: SWC.VariableDeclaration, context: VisitorContext<C>): void {
        node.declarations.forEach(declarator => visit.variableDeclarator(declarator, context.visitors, context.context))
    },
    variableDeclarator<C>(node: SWC.VariableDeclarator, context: VisitorContext<C>): void {
        visit.pattern(node.id, context.visitors, context.context)
        if (node.init) visit.expression(node.init, context.visitors, context.context)
    },
    classDeclaration<C>(node: SWC.ClassDeclaration, context: VisitorContext<C>): void {
        visit.class(node, context.visitors, context.context, true)
        visit.identifier(node.identifier, context.visitors, context.context)
    },
    class<C>(node: SWC.Class, context: VisitorContext<C>): void {
        if (node.decorators) node.decorators.forEach(d => visit.decorator(d, context.visitors, context.context))
        if (node.typeParams) visit.tsTypeParameterDeclaration(node.typeParams, context.visitors, context.context)
        if (node.superClass) visit.expression(node.superClass, context.visitors, context.context)
        if (node.superTypeParams) visit.tsTypeParameterInstantiation(node.superTypeParams, context.visitors, context.context)
        if (node.implements) node.implements.forEach(i => visit.tsExpressionWithTypeArguments(i, context.visitors, context.context))
        node.body.forEach(m => visit.classMember(m, context.visitors, context.context))
    },
    tsExpressionWithTypeArguments<C>(node: SWC.TsExpressionWithTypeArguments, context: VisitorContext<C>): void {
        visit.expression(node.expression, context.visitors, context.context)
        if (node.typeArguments) visit.tsTypeParameterInstantiation(node.typeArguments, context.visitors, context.context)
    },
    classMember<C>(node: SWC.ClassMember, context: VisitorContext<C>): void {
        run(() => {
            switch (node.type) {
                case "Constructor":
                    return visit.classConstructor(node, context.visitors, context.context, true)
                case "ClassMethod":
                    return visit.classMethod(node, context.visitors, context.context, true)
                case "PrivateMethod":
                    return visit.privateMethod(node, context.visitors, context.context, true)
                case "ClassProperty":
                    return visit.classProperty(node, context.visitors, context.context, true)
                case "PrivateProperty":
                    return visit.privateProperty(node, context.visitors, context.context, true)
                case "TsIndexSignature":
                    return visit.tsIndexSignature(node, context.visitors, context.context, true)
                case "EmptyStatement":
                    return visit.emptyStatement(node, context.visitors, context.context, true)
                case "StaticBlock":
                    return visit.staticBlock(node, context.visitors, context.context, true)
            }
        })
    },
    classConstructor<C>(node: SWC.Constructor, context: VisitorContext<C>): void {
        visit.propertyName(node.key, context.visitors, context.context)
        node.params.forEach(param => {
            if (param.type === "Parameter")
                visit.param(param, context.visitors, context.context)
            else
                visit.tsParameterProperty(param, context.visitors, context.context)
        })
        if (node.body) visit.blockStatement(node.body, context.visitors, context.context)
    },
    tsParameterProperty<C>(node: SWC.TsParameterProperty, context: VisitorContext<C>): void {
        if (node.decorators) node.decorators.forEach(d => visit.decorator(d, context.visitors, context.context))
        visit.tsParameterPropertyParameter(node.param, context.visitors, context.context)
    },
    tsParameterPropertyParameter<C>(node: SWC.TsParameterPropertyParameter, context: VisitorContext<C>): void {
        run(() => {
            switch (node.type) {
                case "Identifier":
                    return visit.bindingIdentifier(node, context.visitors, context.context, true)
                case "AssignmentPattern":
                    return visit.assignmentPattern(node, context.visitors, context.context, true)
            }
        })
    },
    bindingIdentifier<C>(node: SWC.BindingIdentifier, context: VisitorContext<C>): void {
        if (node.typeAnnotation) visit.tsTypeAnnotation(node.typeAnnotation, context.visitors, context.context)
    },
    classMethod<C>(node: SWC.ClassMethod, context: VisitorContext<C>): void {
        visit.classMethodBase(node, context.visitors, context.context, true)
        visit.propertyName(node.key, context.visitors, context.context)
    },
    privateMethod<C>(node: SWC.PrivateMethod, context: VisitorContext<C>): void {
        visit.classMethodBase(node, context.visitors, context.context, true)
        visit.privateName(node.key, context.visitors, context.context)
    },
    classMethodBase<C>(node: SWC.ClassMethodBase, context: VisitorContext<C>): void {
        visit.function(node.function, context.visitors, context.context, true)
    },
    function<C>(node: SWC.Fn, context: VisitorContext<C>): void {
        if (node.typeParameters) visit.tsTypeParameterDeclaration(node.typeParameters, context.visitors, context.context)
        node.params.forEach(param => visit.param(param, context.visitors, context.context))
        if (node.body) visit.blockStatement(node.body, context.visitors, context.context)
    },
    classProperty<C>(node: SWC.ClassProperty, context: VisitorContext<C>): void {
        visit.classPropertyBase(node, context.visitors, context.context, true)
        visit.propertyName(node.key, context.visitors, context.context)
    },
    privateProperty<C>(node: SWC.PrivateProperty, context: VisitorContext<C>): void {
        visit.classPropertyBase(node, context.visitors, context.context, true)
        visit.privateName(node.key, context.visitors, context.context)
    },
    classPropertyBase<C>(node: SWC.ClassPropertyBase, context: VisitorContext<C>): void {
        if (node.decorators) node.decorators.forEach(d => visit.decorator(d, context.visitors, context.context))
        if (node.typeAnnotation) visit.tsTypeAnnotation(node.typeAnnotation, context.visitors, context.context)
        if (node.value) visit.expression(node.value, context.visitors, context.context)
    },
    tsIndexSignature<C>(node: SWC.TsIndexSignature, context: VisitorContext<C>): void {
        node.params.forEach(param => visit.tsFnParameter(param, context.visitors, context.context))
        if (node.typeAnnotation) visit.tsTypeAnnotation(node.typeAnnotation, context.visitors, context.context)
    },
    tsFnParameter<C>(node: SWC.TsFnParameter, context: VisitorContext<C>): void {
        run(() => {
            switch (node.type) {
                case "Identifier":
                    return visit.bindingIdentifier(node, context.visitors, context.context, true)
                case "ArrayPattern":
                    return visit.arrayPattern(node, context.visitors, context.context, true)
                case "RestElement":
                    return visit.restElement(node, context.visitors, context.context, true)
                case "ObjectPattern":
                    return visit.objectPattern(node, context.visitors, context.context, true)
            }
        })
    },
    staticBlock<C>(node: SWC.StaticBlock, context: VisitorContext<C>): void {
        visit.blockStatement(node.body, context.visitors, context.context)
    },
    functionDeclaration<C>(node: SWC.FunctionDeclaration, context: VisitorContext<C>): void {
        visit.function(node, context.visitors, context.context, true)
        visit.identifier(node.identifier, context.visitors, context.context)
    },
    tsInterfaceDeclaration<C>(node: SWC.TsInterfaceDeclaration, context: VisitorContext<C>): void {
        visit.identifier(node.id, context.visitors, context.context)
        if (node.typeParams) visit.tsTypeParameterDeclaration(node.typeParams, context.visitors, context.context)
        node.extends.forEach(i => visit.tsExpressionWithTypeArguments(i, context.visitors, context.context))
        visit.tsInterfaceBody(node.body, context.visitors, context.context)
    },
    tsInterfaceBody<C>(node: SWC.TsInterfaceBody, context: VisitorContext<C>): void {
        node.body.forEach(e => visit.tsTypeElement(e, context.visitors, context.context))
    },
    tsTypeElement<C>(node: SWC.TsTypeElement, context: VisitorContext<C>): void {
        run(() => {
            switch (node.type) {
                case "TsCallSignatureDeclaration":
                    return visit.tsCallSignatureDeclaration(node, context.visitors, context.context, true)
                case "TsConstructSignatureDeclaration":
                    return visit.tsConstructSignatureDeclaration(node, context.visitors, context.context, true)
                case "TsPropertySignature":
                    return visit.tsPropertySignature(node, context.visitors, context.context, true)
                case "TsGetterSignature":
                    return visit.tsGetterSignature(node, context.visitors, context.context, true)
                case "TsSetterSignature":
                    return visit.tsSetterSignature(node, context.visitors, context.context, true)
                case "TsMethodSignature":
                    return visit.tsMethodSignature(node, context.visitors, context.context, true)
                case "TsIndexSignature":
                    return visit.tsIndexSignature(node, context.visitors, context.context, true)
            }
        })
    },
    tsCallSignatureDeclaration<C>(node: SWC.TsCallSignatureDeclaration, context: VisitorContext<C>): void {
        if (node.typeParams) visit.tsTypeParameterDeclaration(node.typeParams, context.visitors, context.context)
        node.params.forEach(param => visit.tsFnParameter(param, context.visitors, context.context))
        if (node.typeAnnotation) visit.tsTypeAnnotation(node.typeAnnotation, context.visitors, context.context)
    },
    tsConstructSignatureDeclaration<C>(node: SWC.TsConstructSignatureDeclaration, context: VisitorContext<C>): void {
        if (node.typeParams) visit.tsTypeParameterDeclaration(node.typeParams, context.visitors, context.context)
        node.params.forEach(param => visit.tsFnParameter(param, context.visitors, context.context))
        if (node.typeAnnotation) visit.tsTypeAnnotation(node.typeAnnotation, context.visitors, context.context)
    },
    tsPropertySignature<C>(node: SWC.TsPropertySignature, context: VisitorContext<C>): void {
        visit.expression(node.key, context.visitors, context.context)
        if (node.typeAnnotation) visit.tsTypeAnnotation(node.typeAnnotation, context.visitors, context.context)
    },
    tsGetterSignature<C>(node: SWC.TsGetterSignature, context: VisitorContext<C>): void {
        visit.expression(node.key, context.visitors, context.context)
        if (node.typeAnnotation) visit.tsTypeAnnotation(node.typeAnnotation, context.visitors, context.context)
    },
    tsSetterSignature<C>(node: SWC.TsSetterSignature, context: VisitorContext<C>): void {
        visit.expression(node.key, context.visitors, context.context)
        visit.tsFnParameter(node.param, context.visitors, context.context)
    },
    tsMethodSignature<C>(node: SWC.TsMethodSignature, context: VisitorContext<C>): void {
        visit.expression(node.key, context.visitors, context.context)
        if (node.typeParams) visit.tsTypeParameterDeclaration(node.typeParams, context.visitors, context.context)
        node.params.forEach(param => visit.tsFnParameter(param, context.visitors, context.context))
        if (node.typeAnn) visit.tsTypeAnnotation(node.typeAnn, context.visitors, context.context)
    },
    tsTypeAliasDeclaration<C>(node: SWC.TsTypeAliasDeclaration, context: VisitorContext<C>): void {
        visit.identifier(node.id, context.visitors, context.context)
        if (node.typeParams) visit.tsTypeParameterDeclaration(node.typeParams, context.visitors, context.context)
        visit.tsType(node.typeAnnotation, context.visitors, context.context)
    },
    tsEnumDeclaration<C>(node: SWC.TsEnumDeclaration, context: VisitorContext<C>): void {
        visit.identifier(node.id, context.visitors, context.context)
        node.members.forEach(member => visit.tsEnumMember(member, context.visitors, context.context))
    },
    tsEnumMember<C>(node: SWC.TsEnumMember, context: VisitorContext<C>): void {
        visit.tsEnumMemberId(node.id, context.visitors, context.context)
        if (node.init) visit.expression(node.init, context.visitors, context.context)
    },
    tsEnumMemberId<C>(node: SWC.TsEnumMemberId, context: VisitorContext<C>): void {
        run(() => {
            switch (node.type) {
                case "Identifier":
                    return visit.identifier(node, context.visitors, context.context, true)
                case "StringLiteral":
                    return visit.stringLiteral(node, context.visitors, context.context, true)
            }
        })
    },
    tsModuleDeclaration<C>(node: SWC.TsModuleDeclaration, context: VisitorContext<C>): void {
        visit.tsModuleName(node.id, context.visitors, context.context)
        if (node.body) visit.tsNamespaceBody(node.body, context.visitors, context.context)
    },
    tsModuleName<C>(node: SWC.TsModuleName, context: VisitorContext<C>): void {
        run(() => {
            switch (node.type) {
                case "Identifier":
                    return visit.identifier(node, context.visitors, context.context, true)
                case "StringLiteral":
                    return visit.stringLiteral(node, context.visitors, context.context, true)
            }
        })
    },
    tsNamespaceBody<C>(node: SWC.TsNamespaceBody, context: VisitorContext<C>): void {
        run(() => {
            switch (node.type) {
                case "TsModuleBlock":
                    return visit.tsModuleBlock(node, context.visitors, context.context, true)
                case "TsNamespaceDeclaration":
                    return visit.tsNamespaceDeclaration(node, context.visitors, context.context, true)
            }
        })
    },
    tsModuleBlock<C>(node: SWC.TsModuleBlock, context: VisitorContext<C>): void {
        node.body.forEach(item => visit.moduleItem(item, context.visitors, context.context, true))
    },
    tsNamespaceDeclaration<C>(node: SWC.TsNamespaceDeclaration, context: VisitorContext<C>): void {
        visit.identifier(node.id, context.visitors, context.context)
        visit.tsNamespaceBody(node.body, context.visitors, context.context)
    },
    tsTypeParameterDeclaration<C>(node: SWC.TsTypeParameterDeclaration, context: VisitorContext<C>): void {
        node.parameters.forEach(param => visit.tsTypeParameter(param, context.visitors, context.context))
    },
    tsTypeParameter<C>(node: SWC.TsTypeParameter, context: VisitorContext<C>): void {
        visit.identifier(node.name, context.visitors, context.context)
        if (node.constraint) visit.tsType(node.constraint, context.visitors, context.context)
        if (node.default) visit.tsType(node.default, context.visitors, context.context)
    },
    tsTypeParameterInstantiation<C>(node: SWC.TsTypeParameterInstantiation, context: VisitorContext<C>): void {
        node.params.forEach(type => visit.tsType(type, context.visitors, context.context))
    },
    statement<C>(node: SWC.Statement, context: VisitorContext<C>): void {
        run(() => {
            switch (node.type) {
                case "BlockStatement":
                    return visit.blockStatement(node, context.visitors, context.context, true)
                case "EmptyStatement":
                    return visit.emptyStatement(node, context.visitors, context.context, true)
                case "DebuggerStatement":
                    return visit.debuggerStatement(node, context.visitors, context.context, true)
                case "WithStatement":
                    return visit.withStatement(node, context.visitors, context.context, true)
                case "ReturnStatement":
                    return visit.returnStatement(node, context.visitors, context.context, true)
                case "LabeledStatement":
                    return visit.labeledStatement(node, context.visitors, context.context, true)
                case "BreakStatement":
                    return visit.breakStatement(node, context.visitors, context.context, true)
                case "ContinueStatement":
                    return visit.continueStatement(node, context.visitors, context.context, true)
                case "IfStatement":
                    return visit.ifStatement(node, context.visitors, context.context, true)
                case "SwitchStatement":
                    return visit.switchStatement(node, context.visitors, context.context, true)
                case "ThrowStatement":
                    return visit.throwStatement(node, context.visitors, context.context, true)
                case "TryStatement":
                    return visit.tryStatement(node, context.visitors, context.context, true)
                case "WhileStatement":
                    return visit.whileStatement(node, context.visitors, context.context, true)
                case "DoWhileStatement":
                    return visit.doWhileStatement(node, context.visitors, context.context, true)
                case "ForStatement":
                    return visit.forStatement(node, context.visitors, context.context, true)
                case "ForInStatement":
                    return visit.forInStatement(node, context.visitors, context.context, true)
                case "ForOfStatement":
                    return visit.forOfStatement(node, context.visitors, context.context, true)
                case "ClassDeclaration":
                case "FunctionDeclaration":
                case "VariableDeclaration":
                case "TsInterfaceDeclaration":
                case "TsTypeAliasDeclaration":
                case "TsEnumDeclaration":
                case "TsModuleDeclaration":
                    return visit.declaration(node, context.visitors, context.context, true)
                case "ExpressionStatement":
                    return visit.expressionStatement(node, context.visitors, context.context, true)
            }
        })
    },
    blockStatement<C>(node: SWC.BlockStatement, context: VisitorContext<C>): void {
        node.stmts.forEach(statement => visit.statement(statement, context.visitors, context.context))
    },
    emptyStatement<C>(_node: SWC.EmptyStatement, _context: VisitorContext<C>): void {},
    debuggerStatement<C>(_node: SWC.DebuggerStatement, _context: VisitorContext<C>): void {},
    withStatement<C>(node: SWC.WithStatement, context: VisitorContext<C>): void {
        visit.expression(node.object, context.visitors, context.context)
        visit.statement(node.body, context.visitors, context.context)
    },
    returnStatement<C>(node: SWC.ReturnStatement, context: VisitorContext<C>): void {
        if (node.argument) visit.expression(node.argument, context.visitors, context.context)
    },
    labeledStatement<C>(node: SWC.LabeledStatement, context: VisitorContext<C>): void {
        visit.identifier(node.label, context.visitors, context.context)
        visit.statement(node.body, context.visitors, context.context)
    },
    breakStatement<C>(node: SWC.BreakStatement, context: VisitorContext<C>): void {
        if (node.label) visit.identifier(node.label, context.visitors, context.context)
    },
    continueStatement<C>(node: SWC.ContinueStatement, context: VisitorContext<C>): void {
        if (node.label) visit.identifier(node.label, context.visitors, context.context)
    },
    ifStatement<C>(node: SWC.IfStatement, context: VisitorContext<C>): void {
        visit.expression(node.test, context.visitors, context.context)
        visit.statement(node.consequent, context.visitors, context.context)
        if (node.alternate) visit.statement(node.alternate, context.visitors, context.context)
    },
    switchStatement<C>(node: SWC.SwitchStatement, context: VisitorContext<C>): void {
        visit.expression(node.discriminant, context.visitors, context.context)
        node.cases.forEach(c => visit.switchCase(c, context.visitors, context.context))
    },
    switchCase<C>(node: SWC.SwitchCase, context: VisitorContext<C>): void {
        if (node.test) visit.expression(node.test, context.visitors, context.context)
        node.consequent.forEach(c => visit.statement(c, context.visitors, context.context))
    },
    throwStatement<C>(node: SWC.ThrowStatement, context: VisitorContext<C>): void {
        visit.expression(node.argument, context.visitors, context.context)
    },
    tryStatement<C>(node: SWC.TryStatement, context: VisitorContext<C>): void {
        visit.blockStatement(node.block, context.visitors, context.context)
        if (node.handler) visit.catchClause(node.handler, context.visitors, context.context)
        if (node.finalizer) visit.blockStatement(node.finalizer, context.visitors, context.context)
    },
    catchClause<C>(node: SWC.CatchClause, context: VisitorContext<C>): void {
        if (node.param) visit.pattern(node.param, context.visitors, context.context)
        visit.blockStatement(node.body, context.visitors, context.context)
    },
    whileStatement<C>(node: SWC.WhileStatement, context: VisitorContext<C>): void {
        visit.expression(node.test, context.visitors, context.context)
        visit.statement(node.body, context.visitors, context.context)
    },
    doWhileStatement<C>(node: SWC.DoWhileStatement, context: VisitorContext<C>): void {
        visit.expression(node.test, context.visitors, context.context)
        visit.statement(node.body, context.visitors, context.context)
    },
    forStatement<C>(node: SWC.ForStatement, context: VisitorContext<C>): void {
        if (node.init) {
            if (node.init.type === "VariableDeclaration") visit.variableDeclaration(node.init, context.visitors, context.context)
            else visit.expression(node.init, context.visitors, context.context)
        }
        if (node.test) visit.expression(node.test, context.visitors, context.context)
        if (node.update) visit.expression(node.update, context.visitors, context.context)
        visit.statement(node.body, context.visitors, context.context)
    },
    forInStatement<C>(node: SWC.ForInStatement, context: VisitorContext<C>): void {
        if (node.left.type === "VariableDeclaration") visit.variableDeclaration(node.left, context.visitors, context.context)
        else visit.pattern(node.left, context.visitors, context.context)
        visit.expression(node.right, context.visitors, context.context)
        visit.statement(node.body, context.visitors, context.context)
    },
    forOfStatement<C>(node: SWC.ForOfStatement, context: VisitorContext<C>): void {
        if (node.left.type === "VariableDeclaration") visit.variableDeclaration(node.left, context.visitors, context.context)
        else visit.pattern(node.left, context.visitors, context.context)
        visit.expression(node.right, context.visitors, context.context)
        visit.statement(node.body, context.visitors, context.context)
    },
    expressionStatement<C>(node: SWC.ExpressionStatement, context: VisitorContext<C>): void {
        visit.expression(node.expression, context.visitors, context.context)
    },
    expression<C>(node: SWC.Expression, context: VisitorContext<C>): void {
        run(() => {
            switch (node.type) {
                case "ThisExpression":
                    return visit.thisExpression(node, context.visitors, context.context, true)
                case "ArrayExpression":
                    return visit.arrayExpression(node, context.visitors, context.context, true)
                case "ObjectExpression":
                    return visit.objectExpression(node, context.visitors, context.context, true)
                case "FunctionExpression":
                    return visit.functionExpression(node, context.visitors, context.context, true)
                case "UnaryExpression":
                    return visit.unaryExpression(node, context.visitors, context.context, true)
                case "UpdateExpression":
                    return visit.updateExpression(node, context.visitors, context.context, true)
                case "BinaryExpression":
                    return visit.binaryExpression(node, context.visitors, context.context, true)
                case "AssignmentExpression":
                    return visit.assignmentExpression(node, context.visitors, context.context, true)
                case "MemberExpression":
                    return visit.memberExpression(node, context.visitors, context.context, true)
                case "SuperPropExpression":
                    return visit.superPropExpression(node, context.visitors, context.context, true)
                case "ConditionalExpression":
                    return visit.conditionalExpression(node, context.visitors, context.context, true)
                case "CallExpression":
                    return visit.callExpression(node, context.visitors, context.context, true)
                case "NewExpression":
                    return visit.newExpression(node, context.visitors, context.context, true)
                case "SequenceExpression":
                    return visit.sequenceExpression(node, context.visitors, context.context, true)
                case "Identifier":
                    return visit.identifier(node, context.visitors, context.context, true)
                case "StringLiteral":
                case "BooleanLiteral":
                case "NullLiteral":
                case "NumericLiteral":
                case "BigIntLiteral":
                case "RegExpLiteral":
                case "JSXText":
                    return visit.literal(node, context.visitors, context.context, true)
                case "TemplateLiteral":
                    return visit.templateLiteral(node, context.visitors, context.context, true)
                case "TaggedTemplateExpression":
                    return visit.taggedTemplateExpression(node, context.visitors, context.context, true)
                case "ArrowFunctionExpression":
                    return visit.arrowFunctionExpression(node, context.visitors, context.context, true)
                case "ClassExpression":
                    return visit.classExpression(node, context.visitors, context.context, true)
                case "YieldExpression":
                    return visit.yieldExpression(node, context.visitors, context.context, true)
                case "MetaProperty":
                    return visit.metaProperty(node, context.visitors, context.context, true)
                case "AwaitExpression":
                    return visit.awaitExpression(node, context.visitors, context.context, true)
                case "ParenthesisExpression":
                    return visit.parenthesisExpression(node, context.visitors, context.context, true)
                case "JSXMemberExpression":
                    return visit.jsxMemberExpression(node, context.visitors, context.context, true)
                case "JSXNamespacedName":
                    return visit.jsxNamespacedName(node, context.visitors, context.context, true)
                case "JSXEmptyExpression":
                    return visit.jsxEmptyExpression(node, context.visitors, context.context, true)
                case "JSXElement":
                    return visit.jsxElement(node, context.visitors, context.context, true)
                case "JSXFragment":
                    return visit.jsxFragment(node, context.visitors, context.context, true)
                case "TsTypeAssertion":
                    return visit.tsTypeAssertion(node, context.visitors, context.context, true)
                case "TsConstAssertion":
                    return visit.tsConstAssertion(node, context.visitors, context.context, true)
                case "TsNonNullExpression":
                    return visit.tsNonNullExpression(node, context.visitors, context.context, true)
                case "TsAsExpression":
                    return visit.tsAsExpression(node, context.visitors, context.context, true)
                case "TsSatisfiesExpression":
                    return visit.tsSatisfiesExpression(node, context.visitors, context.context, true)
                case "TsInstantiation":
                    return visit.tsInstantiation(node, context.visitors, context.context, true)
                case "PrivateName":
                    return visit.privateName(node, context.visitors, context.context, true)
                case "OptionalChainingExpression":
                    return visit.optionalChainingExpression(node, context.visitors, context.context, true)
                case "Invalid":
                    return visit.invalid(node, context.visitors, context.context, true)
            }
        })
    },
    thisExpression<C>(_node: SWC.ThisExpression, _context: VisitorContext<C>): void {},
    arrayExpression<C>(node: SWC.ArrayExpression, context: VisitorContext<C>): void {
        node.elements.forEach(element => element && visit.exprOrSpread(element, context.visitors, context.context))
    },
    exprOrSpread<C>(node: SWC.ExprOrSpread, context: VisitorContext<C>): void {
        visit.expression(node.expression, context.visitors, context.context)
    },
    objectExpression<C>(node: SWC.ObjectExpression, context: VisitorContext<C>): void {
        node.properties.forEach(property => {
            if (property.type === 'SpreadElement')
                visit.spreadElement(property, context.visitors, context.context)
            else
                visit.property(property, context.visitors, context.context)
        })
    },
    functionExpression<C>(node: SWC.FunctionExpression, context: VisitorContext<C>): void {
        visit.function(node, context.visitors, context.context, true)
        if (node.identifier) visit.identifier(node.identifier, context.visitors, context.context)
    },
    unaryExpression<C>(node: SWC.UnaryExpression, context: VisitorContext<C>): void {
        visit.expression(node.argument, context.visitors, context.context)
    },
    updateExpression<C>(node: SWC.UpdateExpression, context: VisitorContext<C>): void {
        visit.expression(node.argument, context.visitors, context.context)
    },
    binaryExpression<C>(node: SWC.BinaryExpression, context: VisitorContext<C>): void {
        visit.expression(node.left, context.visitors, context.context)
        visit.expression(node.right, context.visitors, context.context)
    },
    assignmentExpression<C>(node: SWC.AssignmentExpression, context: VisitorContext<C>): void {
        visit.pattern(node.left, context.visitors, context.context)
        visit.expression(node.right, context.visitors, context.context)
    },
    memberExpression<C>(node: SWC.MemberExpression, context: VisitorContext<C>): void {
        visit.expression(node.object, context.visitors, context.context)
        run(() => {
            switch (node.property.type) {
                case "Identifier":
                    return visit.identifier(node.property, context.visitors, context.context)
                case "PrivateName":
                    return visit.privateName(node.property, context.visitors, context.context)
                case "Computed":
                    return visit.computedPropertyName(node.property, context.visitors, context.context)
            }
        })
    },
    superPropExpression<C>(node: SWC.SuperPropExpression, context: VisitorContext<C>): void {
        visit.super(node.obj, context.visitors, context.context)
        run(() => {
            switch (node.property.type) {
                case "Computed":
                    visit.computedPropertyName(node.property, context.visitors, context.context)
                    return ret
                case "Identifier":
                    visit.identifier(node.property, context.visitors, context.context)
                    return ret
            }
        })
    },
    conditionalExpression<C>(node: SWC.ConditionalExpression, context: VisitorContext<C>): void {
        visit.expression(node.test, context.visitors, context.context)
        visit.expression(node.consequent, context.visitors, context.context)
        visit.expression(node.alternate, context.visitors, context.context)
    },
    callExpression<C>(node: SWC.CallExpression, context: VisitorContext<C>): void {
        run(() => {
            switch (node.callee.type) {
                case "Super":
                    return visit.super(node.callee, context.visitors, context.context)
                case "Import":
                    return visit.import(node.callee, context.visitors, context.context)
                default:
                    return visit.expression(node.callee, context.visitors, context.context)
            }
        })
        if (node.typeArguments) visit.tsTypeParameterInstantiation(node.typeArguments, context.visitors, context.context)
        node.arguments.forEach(argument => visit.expression(argument.expression, context.visitors, context.context))
    },
    newExpression<C>(node: SWC.NewExpression, context: VisitorContext<C>): void {
        visit.expression(node.callee, context.visitors, context.context)
        if (node.typeArguments) visit.tsTypeParameterInstantiation(node.typeArguments, context.visitors, context.context)
        if (node.arguments) node.arguments.forEach(argument => visit.expression(argument.expression, context.visitors, context.context))
    },
    sequenceExpression<C>(node: SWC.SequenceExpression, context: VisitorContext<C>): void {
        node.expressions.forEach(expression => visit.expression(expression, context.visitors, context.context))
    },
    identifier<C>(_node: SWC.Identifier, _context: VisitorContext<C>): void {},
    literal<C>(node: SWC.Literal, context: VisitorContext<C>): void {
        run(() => {
            switch (node.type) {
                case "StringLiteral":
                    return visit.stringLiteral(node, context.visitors, context.context, true)
                case "BooleanLiteral":
                    return visit.booleanLiteral(node, context.visitors, context.context, true)
                case "NullLiteral":
                    return visit.nullLiteral(node, context.visitors, context.context, true)
                case "NumericLiteral":
                    return visit.numericLiteral(node, context.visitors, context.context, true)
                case "BigIntLiteral":
                    return visit.bigIntLiteral(node, context.visitors, context.context, true)
                case "RegExpLiteral":
                    return visit.regExpLiteral(node, context.visitors, context.context, true)
                case "JSXText":
                    return visit.jsxText(node, context.visitors, context.context, true)
            }
        })
    },
    jsxText<C>(_node: SWC.JSXText, _context: VisitorContext<C>): void {},
    templateLiteral<C>(node: SWC.TemplateLiteral, context: VisitorContext<C>): void {
        node.expressions.forEach(expression => visit.expression(expression, context.visitors, context.context))
        node.quasis.forEach(quasi => visit.templateElement(quasi, context.visitors, context.context))
    },
    templateElement<C>(_node: SWC.TemplateElement, _context: VisitorContext<C>): void {},
    taggedTemplateExpression<C>(node: SWC.TaggedTemplateExpression, context: VisitorContext<C>): void {
        visit.expression(node.tag, context.visitors, context.context)
        if (node.typeParameters) visit.tsTypeParameterInstantiation(node.typeParameters, context.visitors, context.context)
        visit.templateLiteral(node.template, context.visitors, context.context)
    },
    arrowFunctionExpression<C>(node: SWC.ArrowFunctionExpression, context: VisitorContext<C>): void {
        if (node.typeParameters) visit.tsTypeParameterDeclaration(node.typeParameters, context.visitors, context.context)
        node.params.forEach(param => visit.pattern(param, context.visitors, context.context))
        if (node.returnType) visit.tsTypeAnnotation(node.returnType, context.visitors, context.context)
        if (node.body.type === "BlockStatement") visit.blockStatement(node.body, context.visitors, context.context)
        else visit.expression(node.body, context.visitors, context.context)
    },
    classExpression<C>(node: SWC.ClassExpression, context: VisitorContext<C>): void {
        visit.class(node, context.visitors, context.context, true)
        if (node.identifier) visit.identifier(node.identifier, context.visitors, context.context)
    },
    yieldExpression<C>(node: SWC.YieldExpression, context: VisitorContext<C>): void {
        if (node.argument) visit.expression(node.argument, context.visitors, context.context)
    },
    metaProperty<C>(_node: SWC.MetaProperty, _context: VisitorContext<C>): void {},
    awaitExpression<C>(node: SWC.AwaitExpression, context: VisitorContext<C>): void {
        visit.expression(node.argument, context.visitors, context.context)
    },
    parenthesisExpression<C>(node: SWC.ParenthesisExpression, context: VisitorContext<C>): void {
        visit.expression(node.expression, context.visitors, context.context)
    },
    jsxMemberExpression<C>(node: SWC.JSXMemberExpression, context: VisitorContext<C>): void {
        visit.jsxObject(node.object, context.visitors, context.context)
        visit.identifier(node.property, context.visitors, context.context)
    },
    jsxObject<C>(node: SWC.JSXObject, context: VisitorContext<C>): void {
        run(() => {
            switch (node.type) {
                case "Identifier":
                    return visit.identifier(node, context.visitors, context.context, true)
                case "JSXMemberExpression":
                    return visit.jsxMemberExpression(node, context.visitors, context.context, true)
            }
        })
    },
    jsxNamespacedName<C>(node: SWC.JSXNamespacedName, context: VisitorContext<C>): void {
        visit.identifier(node.namespace, context.visitors, context.context)
        visit.identifier(node.name, context.visitors, context.context)
    },
    jsxEmptyExpression<C>(_node: SWC.JSXEmptyExpression, _context: VisitorContext<C>): void {},
    jsxElement<C>(node: SWC.JSXElement, context: VisitorContext<C>): void {
        visit.jsxOpeningElement(node.opening, context.visitors, context.context)
        node.children.forEach(child => visit.jsxElementChild(child, context.visitors, context.context))
        if (node.closing) visit.jsxClosingElement(node.closing, context.visitors, context.context)
    },
    jsxOpeningElement<C>(node: SWC.JSXOpeningElement, context: VisitorContext<C>): void {
        visit.jsxElementName(node.name, context.visitors, context.context)
        if (node.typeArguments) visit.tsTypeParameterInstantiation(node.typeArguments, context.visitors, context.context)
        node.attributes.forEach(attribute => visit.jsxAttributeOrSpread(attribute, context.visitors, context.context))
    },
    jsxAttributeOrSpread<C>(node: SWC.JSXAttributeOrSpread, context: VisitorContext<C>): void {
        run(() => {
            switch (node.type) {
                case "JSXAttribute":
                    return visit.jsxAttribute(node, context.visitors, context.context, true)
                case "SpreadElement":
                    return visit.spreadElement(node, context.visitors, context.context, true)
            }
        })
    },
    jsxAttribute<C>(node: SWC.JSXAttribute, context: VisitorContext<C>): void {
        visit.jsxAttributeName(node.name, context.visitors, context.context)
        if (node.value) visit.jsxAttrValue(node.value, context.visitors, context.context)
    },
    jsxAttributeName<C>(node: SWC.JSXAttributeName, context: VisitorContext<C>): void {
        run(() => {
            switch (node.type) {
                case "Identifier":
                    return visit.identifier(node, context.visitors, context.context, true)
                case "JSXNamespacedName":
                    return visit.jsxNamespacedName(node, context.visitors, context.context, true)
            }
        })
    },
    jsxElementName<C>(node: SWC.JSXElementName, context: VisitorContext<C>): void {
        run(() => {
            switch (node.type) {
                case "Identifier":
                    return visit.identifier(node, context.visitors, context.context, true)
                case "JSXMemberExpression":
                    return visit.jsxMemberExpression(node, context.visitors, context.context, true)
                case "JSXNamespacedName":
                    return visit.jsxNamespacedName(node, context.visitors, context.context, true)
            }
        })
    },
    jsxAttrValue<C>(node: SWC.JSXAttrValue, context: VisitorContext<C>): void {
        run(() => {
            switch (node.type) {
                case "JSXExpressionContainer":
                    return visit.jsxExpressionContainer(node, context.visitors, context.context, true)
                case "JSXElement":
                    return visit.jsxElement(node, context.visitors, context.context, true)
                case "JSXFragment":
                    return visit.jsxFragment(node, context.visitors, context.context, true)
                default:
                    return visit.literal(node, context.visitors, context.context, true)
            }
        })
    },
    jsxExpressionContainer<C>(node: SWC.JSXExpressionContainer, context: VisitorContext<C>): void {
        visit.jsxExpression(node.expression, context.visitors, context.context)
    },
    jsxExpression<C>(node: SWC.JSXExpression, context: VisitorContext<C>): void {
        run(() => {
            switch (node.type) {
                case "JSXEmptyExpression":
                    return visit.jsxEmptyExpression(node, context.visitors, context.context, true)
                default:
                    return visit.expression(node, context.visitors, context.context, true)
            }
        })
    },
    jsxElementChild<C>(node: SWC.JSXElementChild, context: VisitorContext<C>): void {
        run(() => {
            switch (node.type) {
                case "JSXText":
                    return visit.jsxText(node, context.visitors, context.context, true)
                case "JSXExpressionContainer":
                    return visit.jsxExpressionContainer(node, context.visitors, context.context, true)
                case "JSXSpreadChild":
                    return visit.jsxSpreadChild(node, context.visitors, context.context, true)
                case "JSXElement":
                    return visit.jsxElement(node, context.visitors, context.context, true)
                case "JSXFragment":
                    return visit.jsxFragment(node, context.visitors, context.context, true)
            }
        })
    },
    jsxSpreadChild<C>(node: SWC.JSXSpreadChild, context: VisitorContext<C>): void {
        visit.expression(node.expression, context.visitors, context.context)
    },
    jsxClosingElement<C>(node: SWC.JSXClosingElement, context: VisitorContext<C>): void {
        visit.jsxElementName(node.name, context.visitors, context.context)
    },
    jsxFragment<C>(node: SWC.JSXFragment, context: VisitorContext<C>): void {
        visit.jsxOpeningFragment(node.opening, context.visitors, context.context)
        node.children.forEach(child => visit.jsxElementChild(child, context.visitors, context.context))
        visit.jsxClosingFragment(node.closing, context.visitors, context.context)
    },
    jsxOpeningFragment<C>(_node: SWC.JSXOpeningFragment, _context: VisitorContext<C>): void {},
    jsxClosingFragment<C>(_node: SWC.JSXClosingFragment, _context: VisitorContext<C>): void {},
    tsTypeAssertion<C>(node: SWC.TsTypeAssertion, context: VisitorContext<C>): void {
        visit.expression(node.expression, context.visitors, context.context)
        visit.tsType(node.typeAnnotation, context.visitors, context.context)
    },
    tsConstAssertion<C>(node: SWC.TsConstAssertion, context: VisitorContext<C>): void {
        visit.expression(node.expression, context.visitors, context.context)
    },
    tsNonNullExpression<C>(node: SWC.TsNonNullExpression, context: VisitorContext<C>): void {
        visit.expression(node.expression, context.visitors, context.context)
    },
    tsAsExpression<C>(node: SWC.TsAsExpression, context: VisitorContext<C>): void {
        visit.expression(node.expression, context.visitors, context.context)
        visit.tsType(node.typeAnnotation, context.visitors, context.context)
    },
    tsSatisfiesExpression<C>(node: SWC.TsSatisfiesExpression, context: VisitorContext<C>): void {
        visit.expression(node.expression, context.visitors, context.context)
        visit.tsType(node.typeAnnotation, context.visitors, context.context)
    },
    tsInstantiation<C>(node: SWC.TsInstantiation, context: VisitorContext<C>): void {
        visit.expression(node.expression, context.visitors, context.context)
        visit.tsTypeParameterInstantiation(node.typeArguments, context.visitors, context.context)
    },
    privateName<C>(node: SWC.PrivateName, context: VisitorContext<C>): void {
        visit.identifier(node.id, context.visitors, context.context)
    },
    optionalChainingExpression<C>(node: SWC.OptionalChainingExpression, context: VisitorContext<C>): void {
        run(() => {
            switch (node.base.type) {
                case "MemberExpression":
                    return visit.memberExpression(node.base, context.visitors, context.context)
                case "CallExpression":
                    return visit.callExpression(node.base, context.visitors, context.context)
            }
        })
    },
    invalid<C>(_node: SWC.Invalid, _context: VisitorContext<C>): void {},
    spreadElement<C>(node: SWC.SpreadElement, context: VisitorContext<C>): void {
        visit.expression(node.arguments, context.visitors, context.context)
    },
    property<C>(node: SWC.Property, context: VisitorContext<C>): void {
        run(() => {
            switch (node.type) {
                case "Identifier":
                    return visit.identifier(node, context.visitors, context.context, true)
                case "KeyValueProperty":
                    return visit.keyValueProperty(node, context.visitors, context.context, true)
                case "AssignmentProperty":
                    return visit.assignmentProperty(node, context.visitors, context.context, true)
                case "GetterProperty":
                    return visit.getterProperty(node, context.visitors, context.context, true)
                case "SetterProperty":
                    return visit.setterProperty(node, context.visitors, context.context, true)
                case "MethodProperty":
                    return visit.methodProperty(node, context.visitors, context.context, true)
            }
        })
    },
    propertyName<C>(node: SWC.PropertyName, context: VisitorContext<C>): void {
        run(() => {
            switch (node.type) {
                case "Identifier":
                    return visit.identifier(node, context.visitors, context.context, true)
                case "StringLiteral":
                    return visit.stringLiteral(node, context.visitors, context.context, true)
                case "NumericLiteral":
                    return visit.numericLiteral(node, context.visitors, context.context, true)
                case "Computed":
                    return visit.computedPropertyName(node, context.visitors, context.context, true)
                case "BigIntLiteral":
                    return visit.bigIntLiteral(node, context.visitors, context.context, true)
            }
        })
    },
    computedPropertyName<C>(node: SWC.ComputedPropName, context: VisitorContext<C>): void {
        visit.expression(node.expression, context.visitors, context.context)
    },
    keyValueProperty<C>(node: SWC.KeyValueProperty, context: VisitorContext<C>): void {
        visit.propertyName(node.key, context.visitors, context.context)
        visit.expression(node.value, context.visitors, context.context)
    },
    assignmentProperty<C>(node: SWC.AssignmentProperty, context: VisitorContext<C>): void {
        visit.identifier(node.key, context.visitors, context.context)
        visit.expression(node.value, context.visitors, context.context)
    },
    getterProperty<C>(node: SWC.GetterProperty, context: VisitorContext<C>): void {
        visit.propertyName(node.key, context.visitors, context.context)
        if (node.typeAnnotation) visit.tsTypeAnnotation(node.typeAnnotation, context.visitors, context.context)
        if (node.body) visit.blockStatement(node.body, context.visitors, context.context)
    },
    setterProperty<C>(node: SWC.SetterProperty, context: VisitorContext<C>): void {
        visit.propertyName(node.key, context.visitors, context.context)
        visit.pattern(node.param, context.visitors, context.context)
        if (node.body) visit.blockStatement(node.body, context.visitors, context.context)
    },
    methodProperty<C>(node: SWC.MethodProperty, context: VisitorContext<C>): void {
        visit.function(node, context.visitors, context.context, true)
        visit.propertyName(node.key, context.visitors, context.context)
    },
    param<C>(node: SWC.Param, context: VisitorContext<C>): void {
        if (node.decorators) node.decorators.forEach(decorator => visit.decorator(decorator, context.visitors, context.context))
        visit.pattern(node.pat, context.visitors, context.context)
    },
    decorator<C>(node: SWC.Decorator, context: VisitorContext<C>): void {
        visit.expression(node.expression, context.visitors, context.context)
    },
    pattern<C>(node: SWC.Pattern, context: VisitorContext<C>): void {
        run(() => {
            switch (node.type) {
                case "Identifier":
                    return visit.bindingIdentifier(node, context.visitors, context.context, true)
                case "ArrayPattern":
                    return visit.arrayPattern(node, context.visitors, context.context, true)
                case "RestElement":
                    return visit.restElement(node, context.visitors, context.context, true)
                case "ObjectPattern":
                    return visit.objectPattern(node, context.visitors, context.context, true)
                case "AssignmentPattern":
                    return visit.assignmentPattern(node, context.visitors, context.context, true)
                case "Invalid":
                    return visit.invalid(node, context.visitors, context.context, true)
                default:
                    return visit.expression(node, context.visitors, context.context, true)
            }
        })
    },
    arrayPattern<C>(node: SWC.ArrayPattern, context: VisitorContext<C>): void {
        node.elements.forEach(element => element && visit.pattern(element, context.visitors, context.context))
        if (node.typeAnnotation) visit.tsTypeAnnotation(node.typeAnnotation, context.visitors, context.context)
    },
    restElement<C>(node: SWC.RestElement, context: VisitorContext<C>): void {
        visit.pattern(node.argument, context.visitors, context.context)
        if (node.typeAnnotation) visit.tsTypeAnnotation(node.typeAnnotation, context.visitors, context.context)
    },
    objectPattern<C>(node: SWC.ObjectPattern, context: VisitorContext<C>): void {
        node.properties.forEach(prop => visit.objectPatternProperty(prop, context.visitors, context.context))
        if (node.typeAnnotation) visit.tsTypeAnnotation(node.typeAnnotation, context.visitors, context.context)
    },
    assignmentPattern<C>(node: SWC.AssignmentPattern, context: VisitorContext<C>): void {
        visit.pattern(node.left, context.visitors, context.context)
        visit.expression(node.right, context.visitors, context.context)
        if (node.typeAnnotation) visit.tsTypeAnnotation(node.typeAnnotation, context.visitors, context.context)
    },
    objectPatternProperty<C>(node: SWC.ObjectPatternProperty, context: VisitorContext<C>): void {
        run(() => {
            switch (node.type) {
                case "KeyValuePatternProperty":
                    return visit.keyValuePatternProperty(node, context.visitors, context.context, true)
                case "AssignmentPatternProperty":
                    return visit.assignmentPatternProperty(node, context.visitors, context.context, true)
                case "RestElement":
                    return visit.restElement(node, context.visitors, context.context, true)
            }
        })
    },
    keyValuePatternProperty<C>(node: SWC.KeyValuePatternProperty, context: VisitorContext<C>): void {
        visit.propertyName(node.key, context.visitors, context.context)
        visit.pattern(node.value, context.visitors, context.context)
    },
    assignmentPatternProperty<C>(node: SWC.AssignmentPatternProperty, context: VisitorContext<C>): void {
        visit.identifier(node.key, context.visitors, context.context)
        if (node.value) visit.expression(node.value, context.visitors, context.context)
    },
    tsTypeAnnotation<C>(node: SWC.TsTypeAnnotation, context: VisitorContext<C>): void {
        visit.tsType(node.typeAnnotation, context.visitors, context.context)
    },
    tsType<C>(node: SWC.TsType, context: VisitorContext<C>): void {
        run(() => {
            switch (node.type) {
                case "TsThisType":
                    return visit.tsThisType(node, context.visitors, context.context, true)
                case "TsKeywordType":
                    return visit.tsKeywordType(node, context.visitors, context.context, true)
                case "TsFunctionType":
                    return visit.tsFunctionType(node, context.visitors, context.context, true)
                case "TsConstructorType":
                    return visit.tsConstructorType(node, context.visitors, context.context, true)
                case "TsTypeReference":
                    return visit.tsTypeReference(node, context.visitors, context.context, true)
                case "TsTypeQuery":
                    return visit.tsTypeQuery(node, context.visitors, context.context, true)
                case "TsTypeLiteral":
                    return visit.tsTypeLiteral(node, context.visitors, context.context, true)
                case "TsArrayType":
                    return visit.tsArrayType(node, context.visitors, context.context, true)
                case "TsTupleType":
                    return visit.tsTupleType(node, context.visitors, context.context, true)
                case "TsOptionalType":
                    return visit.tsOptionalType(node, context.visitors, context.context, true)
                case "TsRestType":
                    return visit.tsRestType(node, context.visitors, context.context, true)
                case "TsUnionType":
                    return visit.tsUnionType(node, context.visitors, context.context, true)
                case "TsIntersectionType":
                    return visit.tsIntersectionType(node, context.visitors, context.context, true)
                case "TsConditionalType":
                    return visit.tsConditionalType(node, context.visitors, context.context, true)
                case "TsInferType":
                    return visit.tsInferType(node, context.visitors, context.context, true)
                case "TsParenthesizedType":
                    return visit.tsParenthesizedType(node, context.visitors, context.context, true)
                case "TsTypeOperator":
                    return visit.tsTypeOperator(node, context.visitors, context.context, true)
                case "TsIndexedAccessType":
                    return visit.tsIndexedAccessType(node, context.visitors, context.context, true)
                case "TsMappedType":
                    return visit.tsMappedType(node, context.visitors, context.context, true)
                case "TsLiteralType":
                    return visit.tsLiteralType(node, context.visitors, context.context, true)
                case "TsTypePredicate":
                    return visit.tsTypePredicate(node, context.visitors, context.context, true)
                case "TsImportType":
                    return visit.tsImportType(node, context.visitors, context.context, true)
            }
        })
    },
    tsKeywordType<C>(_node: SWC.TsKeywordType, _context: VisitorContext<C>): void {},
    tsThisType<C>(_node: SWC.TsThisType, _context: VisitorContext<C>): void {},
    tsFunctionType<C>(node: SWC.TsFunctionType, context: VisitorContext<C>): void {
        if (node.typeParams) visit.tsTypeParameterDeclaration(node.typeParams, context.visitors, context.context)
        node.params.forEach(param => visit.tsFnParameter(param, context.visitors, context.context))
        visit.tsTypeAnnotation(node.typeAnnotation, context.visitors, context.context, true)
    },
    tsConstructorType<C>(node: SWC.TsConstructorType, context: VisitorContext<C>): void {
        if (node.typeParams) visit.tsTypeParameterDeclaration(node.typeParams, context.visitors, context.context)
        node.params.forEach(param => visit.tsFnParameter(param, context.visitors, context.context))
        visit.tsTypeAnnotation(node.typeAnnotation, context.visitors, context.context)
    },
    tsTypeReference<C>(node: SWC.TsTypeReference, context: VisitorContext<C>): void {
        visit.tsEntityName(node.typeName, context.visitors, context.context)
        if (node.typeParams) visit.tsTypeParameterInstantiation(node.typeParams, context.visitors, context.context)
    },
    tsTypeQuery<C>(node: SWC.TsTypeQuery, context: VisitorContext<C>): void {
        visit.tsTypeQueryExpr(node.exprName, context.visitors, context.context)
        if (node.typeArguments) visit.tsTypeParameterInstantiation(node.typeArguments, context.visitors, context.context)
    },
    tsTypeQueryExpr<C>(node: SWC.TsTypeQueryExpr, context: VisitorContext<C>): void {
        run(() => {
            switch (node.type) {
                case "TsImportType":
                    return visit.tsImportType(node, context.visitors, context.context, true)
                default:
                    return visit.tsEntityName(node, context.visitors, context.context, true)
            }
        })
    },
    tsTypeLiteral<C>(node: SWC.TsTypeLiteral, context: VisitorContext<C>): void {
        node.members.forEach(member => visit.tsTypeElement(member, context.visitors, context.context))
    },
    tsArrayType<C>(node: SWC.TsArrayType, context: VisitorContext<C>): void {
        visit.tsType(node.elemType, context.visitors, context.context)
    },
    tsTupleType<C>(node: SWC.TsTupleType, context: VisitorContext<C>): void {
        node.elemTypes.forEach(elem => visit.tsTupleElement(elem, context.visitors, context.context))
    },
    tsTupleElement<C>(node: SWC.TsTupleElement, context: VisitorContext<C>): void {
        if (node.label) visit.pattern(node.label, context.visitors, context.context)
        visit.tsType(node.ty, context.visitors, context.context)
    },
    tsOptionalType<C>(node: SWC.TsOptionalType, context: VisitorContext<C>): void {
        visit.tsType(node.typeAnnotation, context.visitors, context.context)
    },
    tsRestType<C>(node: SWC.TsRestType, context: VisitorContext<C>): void {
        visit.tsType(node, context.visitors, context.context)
    },
    tsUnionType<C>(node: SWC.TsUnionType, context: VisitorContext<C>): void {
        node.types.forEach(type => visit.tsType(type, context.visitors, context.context))
    },
    tsIntersectionType<C>(node: SWC.TsIntersectionType, context: VisitorContext<C>): void {
        node.types.forEach(type => visit.tsType(type, context.visitors, context.context))
    },
    tsConditionalType<C>(node: SWC.TsConditionalType, context: VisitorContext<C>): void {
        visit.tsType(node.checkType, context.visitors, context.context)
        visit.tsType(node.extendsType, context.visitors, context.context)
        visit.tsType(node.trueType, context.visitors, context.context)
        visit.tsType(node.falseType, context.visitors, context.context)
    },
    tsInferType<C>(node: SWC.TsInferType, context: VisitorContext<C>): void {
        visit.tsTypeParameter(node.typeParam, context.visitors, context.context)
    },
    tsParenthesizedType<C>(node: SWC.TsParenthesizedType, context: VisitorContext<C>): void {
        visit.tsType(node.typeAnnotation, context.visitors, context.context)
    },
    tsTypeOperator<C>(node: SWC.TsTypeOperator, context: VisitorContext<C>): void {
        visit.tsType(node.typeAnnotation, context.visitors, context.context)
    },
    tsIndexedAccessType<C>(node: SWC.TsIndexedAccessType, context: VisitorContext<C>): void {
        visit.tsType(node.objectType, context.visitors, context.context)
        visit.tsType(node.indexType, context.visitors, context.context)
    },
    tsMappedType<C>(node: SWC.TsMappedType, context: VisitorContext<C>): void {
        if (node.nameType) visit.tsType(node.nameType, context.visitors, context.context)
        visit.tsTypeParameter(node.typeParam, context.visitors, context.context)
        if (node.typeAnnotation) visit.tsType(node.typeAnnotation, context.visitors, context.context)
    },
    tsLiteralType<C>(node: SWC.TsLiteralType, context: VisitorContext<C>): void {
        visit.tsLiteral(node.literal, context.visitors, context.context)
    },
    tsLiteral<C>(node: SWC.TsLiteral, context: VisitorContext<C>): void {
        run(() => {
            switch (node.type) {
                case "NumericLiteral":
                    return visit.numericLiteral(node, context.visitors, context.context, true)
                case "StringLiteral":
                    return visit.stringLiteral(node, context.visitors, context.context, true)
                case "BooleanLiteral":
                    return visit.booleanLiteral(node, context.visitors, context.context, true)
                case "BigIntLiteral":
                    return visit.bigIntLiteral(node, context.visitors, context.context, true)
                case "TemplateLiteral":
                    return visit.tsTemplateLiteralType(node, context.visitors, context.context, true)
            }
        })
    },
    tsTemplateLiteralType<C>(node: SWC.TsTemplateLiteralType, context: VisitorContext<C>): void {
        node.types.forEach(type => visit.tsType(type, context.visitors, context.context))
        node.quasis.forEach(quasi => visit.templateElement(quasi, context.visitors, context.context))
    },
    tsTypePredicate<C>(node: SWC.TsTypePredicate, context: VisitorContext<C>): void {
        visit.tsThisTypeOrIdent(node.paramName, context.visitors, context.context)
        if (node.typeAnnotation) visit.tsTypeAnnotation(node.typeAnnotation, context.visitors, context.context)
    },
    tsThisTypeOrIdent<C>(node: SWC.TsThisTypeOrIdent, context: VisitorContext<C>): void {
        run(() => {
            switch (node.type) {
                case "TsThisType":
                    return visit.tsThisType(node, context.visitors, context.context, true)
                case "Identifier":
                    return visit.identifier(node, context.visitors, context.context, true)
            }
        })
    },
    tsImportType<C>(node: SWC.TsImportType, context: VisitorContext<C>): void {
        if (node.qualifier) visit.tsEntityName(node.qualifier, context.visitors, context.context)
        if (node.typeArguments) visit.tsTypeParameterInstantiation(node.typeArguments, context.visitors, context.context)
        visit.stringLiteral(node.argument, context.visitors, context.context)
    },
    tsEntityName<C>(node: SWC.TsEntityName, context: VisitorContext<C>): void {
        run(() => {
            switch (node.type) {
                case "TsQualifiedName":
                    return visit.tsQualifiedName(node, context.visitors, context.context, true)
                case "Identifier":
                    return visit.identifier(node, context.visitors, context.context, true)
            }
        })
    },
    tsQualifiedName<C>(node: SWC.TsQualifiedName, context: VisitorContext<C>): void {
        visit.tsEntityName(node.left, context.visitors, context.context)
        visit.identifier(node.right, context.visitors, context.context)
    },
    super<C>(_node: SWC.Super, _context: VisitorContext<C>): void {},
    import<C>(_node: SWC.Import, _context: VisitorContext<C>): void {},
} satisfies { [k: string]: <C>(node: any, context: VisitorContext<C>) => void }

type VisitorContext<C> = { context: C, descend(context: C): void, visitors: Partial<AllVisitors<C>> }
type Visitor<N extends object, C> = (node: N, context: VisitorContext<C>) => void

type Values<T extends object> = T[keyof T]
type DefaultVisitors = typeof defaultVisitors
type AllVisitors<C> = { [K in keyof DefaultVisitors]?: DefaultVisitors[K] extends <_C>(node: infer N, context: VisitorContext<_C>) => void
    ? (node: N, context: VisitorContext<C>) => void
    : never
} & { any: typeof visitAny<C> }
type VisitorTarget<K extends keyof AllVisitors<unknown>> = Parameters<Required<AllVisitors<unknown>>[K]>[0]

export type AnyNode = Values<{ [K in keyof DefaultVisitors]: Parameters<DefaultVisitors[K]>[0] }>

function noDescend(): void {}

function makeVisitor<Name extends keyof typeof defaultVisitors>(name: Name) {
    type Node = VisitorTarget<Name>

    return function<C>(node: Node, visitors: Partial<AllVisitors<C>>, context: C, skipAny: boolean = false): Ret {
        function nodeDescend(newContext: C) {
            (defaultVisitors[name] as Visitor<AnyNode, C>)(node, { context: newContext, visitors, descend: noDescend })
        }

        function anyDescend(newContext: C) {
            const visitor: Visitor<AnyNode, C> = (visitors[name] ?? defaultVisitors[name]<C>) as Visitor<AnyNode, C>
            visitor(node, { context: newContext, visitors, descend: nodeDescend })
        }

        if (skipAny) {
            anyDescend(context)
            return ret
        }

        const visitor = visitors.any ?? visitAny<C>
        visitor(node, { context, visitors, descend: anyDescend })
        return ret
    }
}

type Visit = { [K in keyof typeof defaultVisitors]?: ReturnType<(typeof makeVisitor<K>)> }

export const visit = new Proxy<Visit>({}, {
    get(target, name) {
        return target[name as keyof Visit] ??= makeVisitor(name as keyof typeof defaultVisitors)
    }
}) as Required<Visit>
