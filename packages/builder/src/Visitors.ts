import SWC from "@swc/types"

const ret = Symbol("ret")
type Ret = typeof ret

function run(callback: () => Ret): void {
    callback()
}

type VisitorContext<C> = { context: C, descend(context: C): void, visitors: AllVisitors<C> }
type Visitor<N extends SWC.Node, C> = (node: N, context: VisitorContext<C>) => void

export type AnyNode =
    | SWC.Module
    | SWC.ModuleItem
    | SWC.ExportSpecifier
    | SWC.ImportSpecifier
    | SWC.Statement
    | SWC.Expression
    | SWC.SpreadElement
    | SWC.Property
    | SWC.Param
    | SWC.Decorator
    | SWC.Pattern
    | SWC.Declaration
    | SWC.TsTypeAnnotation
    | SWC.VariableDeclarator
    | SWC.TsTypeParameterDeclaration
    | SWC.TsTypeParameterInstantiation
    | SWC.TsType
    | SWC.PropertyName
    | SWC.Super
    | SWC.Import
    | SWC.ObjectPatternProperty
    | SWC.TsEntityName

type AllVisitors<C> = Partial<{
    any: Visitor<AnyNode, C>
    module: Visitor<SWC.Module, C>
    moduleItem: Visitor<SWC.ModuleItem, C>
    moduleDeclaration: Visitor<SWC.ModuleDeclaration, C>
    exportDeclaration: Visitor<SWC.ExportDeclaration, C>
    exportNamedDeclaration: Visitor<SWC.ExportNamedDeclaration, C>
    exportDefaultDeclaration: Visitor<SWC.ExportDefaultDeclaration, C>
    exportDefaultExpression: Visitor<SWC.ExportDefaultExpression, C>
    exportAllDeclaration: Visitor<SWC.ExportAllDeclaration, C>
    tsImportEqualsDeclaration: Visitor<SWC.TsImportEqualsDeclaration, C>
    tsExportAssignment: Visitor<SWC.TsExportAssignment, C>
    tsNamespaceExportDeclaration: Visitor<SWC.TsNamespaceExportDeclaration, C>
    defaultDecl: Visitor<SWC.DefaultDecl, C>
    exportSpecifier: Visitor<SWC.ExportSpecifier, C>
    importDeclaration: Visitor<SWC.ImportDeclaration, C>
    importSpecifier: Visitor<SWC.ImportSpecifier, C>
    importNamedSpecifier: Visitor<SWC.NamedImportSpecifier, C>
    importDefaultSpecifier: Visitor<SWC.ImportDefaultSpecifier, C>
    importNamespaceSpecifier: Visitor<SWC.ImportNamespaceSpecifier, C>
    declaration: Visitor<SWC.Declaration, C>
    variableDeclaration: Visitor<SWC.VariableDeclaration, C>
    variableDeclarator: Visitor<SWC.VariableDeclarator, C>
    classDeclaration: Visitor<SWC.ClassDeclaration, C>
    functionDeclaration: Visitor<SWC.FunctionDeclaration, C>
    tsInterfaceDeclaration: Visitor<SWC.TsInterfaceDeclaration, C>
    tsTypeAliasDeclaration: Visitor<SWC.TsTypeAliasDeclaration, C>
    tsEnumDeclaration: Visitor<SWC.TsEnumDeclaration, C>
    tsModuleDeclaration: Visitor<SWC.TsModuleDeclaration, C>
    tsTypeParameterDeclaration: Visitor<SWC.TsTypeParameterDeclaration, C>
    tsTypeParameterInstantiation: Visitor<SWC.TsTypeParameterInstantiation, C>
    statement: Visitor<SWC.Statement, C>
    blockStatement: Visitor<SWC.BlockStatement, C>
    emptyStatement: Visitor<SWC.EmptyStatement, C>
    debuggerStatement: Visitor<SWC.DebuggerStatement, C>
    withStatement: Visitor<SWC.WithStatement, C>
    returnStatement: Visitor<SWC.ReturnStatement, C>
    labeledStatement: Visitor<SWC.LabeledStatement, C>
    breakStatement: Visitor<SWC.BreakStatement, C>
    continueStatement: Visitor<SWC.ContinueStatement, C>
    ifStatement: Visitor<SWC.IfStatement, C>
    switchStatement: Visitor<SWC.SwitchStatement, C>
    throwStatement: Visitor<SWC.ThrowStatement, C>
    tryStatement: Visitor<SWC.TryStatement, C>
    whileStatement: Visitor<SWC.WhileStatement, C>
    doWhileStatement: Visitor<SWC.DoWhileStatement, C>
    forStatement: Visitor<SWC.ForStatement, C>
    forInStatement: Visitor<SWC.ForInStatement, C>
    forOfStatement: Visitor<SWC.ForOfStatement, C>
    expressionStatement: Visitor<SWC.ExpressionStatement, C>
    expression: Visitor<SWC.Expression, C>
    thisExpression: Visitor<SWC.ThisExpression, C>
    arrayExpression: Visitor<SWC.ArrayExpression, C>
    objectExpression: Visitor<SWC.ObjectExpression, C>
    functionExpression: Visitor<SWC.FunctionExpression, C>
    unaryExpression: Visitor<SWC.UnaryExpression, C>
    updateExpression: Visitor<SWC.UpdateExpression, C>
    binaryExpression: Visitor<SWC.BinaryExpression, C>
    assignmentExpression: Visitor<SWC.AssignmentExpression, C>
    memberExpression: Visitor<SWC.MemberExpression, C>
    superPropExpression: Visitor<SWC.SuperPropExpression, C>
    conditionalExpression: Visitor<SWC.ConditionalExpression, C>
    callExpression: Visitor<SWC.CallExpression, C>
    newExpression: Visitor<SWC.NewExpression, C>
    sequenceExpression: Visitor<SWC.SequenceExpression, C>
    identifier: Visitor<SWC.Identifier, C>
    literal: Visitor<SWC.Literal, C>
    templateLiteral: Visitor<SWC.TemplateLiteral, C>
    taggedTemplateExpression: Visitor<SWC.TaggedTemplateExpression, C>
    arrowFunctionExpression: Visitor<SWC.ArrowFunctionExpression, C>
    classExpression: Visitor<SWC.ClassExpression, C>
    yieldExpression: Visitor<SWC.YieldExpression, C>
    metaProperty: Visitor<SWC.MetaProperty, C>
    awaitExpression: Visitor<SWC.AwaitExpression, C>
    parenthesisExpression: Visitor<SWC.ParenthesisExpression, C>
    jsxMemberExpression: Visitor<SWC.JSXMemberExpression, C>
    jsxNamespacedName: Visitor<SWC.JSXNamespacedName, C>
    jsxEmptyExpression: Visitor<SWC.JSXEmptyExpression, C>
    jsxElement: Visitor<SWC.JSXElement, C>
    jsxFragment: Visitor<SWC.JSXFragment, C>
    tsTypeAssertion: Visitor<SWC.TsTypeAssertion, C>
    tsConstAssertion: Visitor<SWC.TsConstAssertion, C>
    tsNonNullExpression: Visitor<SWC.TsNonNullExpression, C>
    tsAsExpression: Visitor<SWC.TsAsExpression, C>
    tsSatisfiesExpression: Visitor<SWC.TsSatisfiesExpression, C>
    tsInstantiation: Visitor<SWC.TsInstantiation, C>
    privateName: Visitor<SWC.PrivateName, C>
    optionalChainingExpression: Visitor<SWC.OptionalChainingExpression, C>
    invalid: Visitor<SWC.Invalid, C>
    spreadElement: Visitor<SWC.SpreadElement, C>
    property: Visitor<SWC.Property, C>
    propertyName: Visitor<SWC.PropertyName, C>
    computedPropertyName: Visitor<SWC.ComputedPropName, C>
    keyValueProperty: Visitor<SWC.KeyValueProperty, C>
    assignmentProperty: Visitor<SWC.AssignmentProperty, C>
    getterProperty: Visitor<SWC.GetterProperty, C>
    setterProperty: Visitor<SWC.SetterProperty, C>
    methodProperty: Visitor<SWC.MethodProperty, C>
    param: Visitor<SWC.Param, C>
    decorator: Visitor<SWC.Decorator, C>
    pattern: Visitor<SWC.Pattern, C>
    arrayPattern: Visitor<SWC.ArrayPattern, C>
    restElement: Visitor<SWC.RestElement, C>
    objectPattern: Visitor<SWC.ObjectPattern, C>
    assignmentPattern: Visitor<SWC.AssignmentPattern, C>
    objectPatternProperty: Visitor<SWC.ObjectPatternProperty, C>
    keyValuePatternProperty: Visitor<SWC.KeyValuePatternProperty, C>
    assignmentPatternProperty: Visitor<SWC.AssignmentPatternProperty, C>
    tsTypeAnnotation: Visitor<SWC.TsTypeAnnotation, C>
    tsType: Visitor<SWC.TsType, C>
    tsKeywordType: Visitor<SWC.TsKeywordType, C>
    tsThisType: Visitor<SWC.TsThisType, C>
    tsFunctionType: Visitor<SWC.TsFunctionType, C>
    tsConstructorType: Visitor<SWC.TsConstructorType, C>
    tsTypeReference: Visitor<SWC.TsTypeReference, C>
    tsTypeQuery: Visitor<SWC.TsTypeQuery, C>
    tsTypeLiteral: Visitor<SWC.TsTypeLiteral, C>
    tsArrayType: Visitor<SWC.TsArrayType, C>
    tsTupleType: Visitor<SWC.TsTupleType, C>
    tsOptionalType: Visitor<SWC.TsOptionalType, C>
    tsRestType: Visitor<SWC.TsRestType, C>
    tsUnionType: Visitor<SWC.TsUnionType, C>
    tsIntersectionType: Visitor<SWC.TsIntersectionType, C>
    tsConditionalType: Visitor<SWC.TsConditionalType, C>
    tsInferType: Visitor<SWC.TsInferType, C>
    tsParenthesizedType: Visitor<SWC.TsParenthesizedType, C>
    tsTypeOperator: Visitor<SWC.TsTypeOperator, C>
    tsIndexedAccessType: Visitor<SWC.TsIndexedAccessType, C>
    tsMappedType: Visitor<SWC.TsMappedType, C>
    tsLiteralType: Visitor<SWC.TsLiteralType, C>
    tsTypePredicate: Visitor<SWC.TsTypePredicate, C>
    tsImportType: Visitor<SWC.TsImportType, C>
    tsEntityName: Visitor<SWC.TsEntityName, C>
    tsQualifiedName: Visitor<SWC.TsQualifiedName, C>
    super: Visitor<SWC.Super, C>
    import: Visitor<SWC.Import, C>
}>

type VisitorTarget<K extends keyof AllVisitors<unknown>> = Parameters<Required<AllVisitors<unknown>>[K]>[0]

const defaultVisitors = {
    any<C>(_: AnyNode, context: VisitorContext<C>) {
        context.descend(context.context)
    },
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
                    visit.moduleDeclaration(node, context.visitors, context.context, true)
                    return ret
                default:
                    visit.statement(node, context.visitors, context.context, true)
                    return ret
            }
        })
    },
    moduleDeclaration<C>(node: SWC.ModuleDeclaration, context: VisitorContext<C>): void {
        run(() => {
            switch (node.type) {
                case "ExportDeclaration":
                    visit.exportDeclaration(node, context.visitors, context.context, true)
                    return ret
                case "ImportDeclaration":
                    visit.importDeclaration(node, context.visitors, context.context, true)
                    return ret
                case "ExportNamedDeclaration":
                    visit.exportNamedDeclaration(node, context.visitors, context.context, true)
                    return ret
                case "ExportDefaultDeclaration":
                    visit.exportDefaultDeclaration(node, context.visitors, context.context, true)
                    return ret
                case "ExportDefaultExpression":
                    visit.exportDefaultExpression(node, context.visitors, context.context, true)
                    return ret
                case "ExportAllDeclaration":
                    visit.exportAllDeclaration(node, context.visitors, context.context, true)
                    return ret
                case "TsImportEqualsDeclaration":
                    visit.tsImportEqualsDeclaration(node, context.visitors, context.context, true)
                    return ret
                case "TsExportAssignment":
                    visit.tsExportAssignment(node, context.visitors, context.context, true)
                    return ret
                case "TsNamespaceExportDeclaration":
                    visit.tsNamespaceExportDeclaration(node, context.visitors, context.context, true)
                    return ret
            }
        })
    },
    exportDeclaration<C>(node: SWC.ExportDeclaration, context: VisitorContext<C>): void {
        visit.declaration(node.declaration, context.visitors, context.context)
    },
    exportNamedDeclaration<C>(node: SWC.ExportNamedDeclaration, context: VisitorContext<C>): void {
        node.specifiers.forEach(specifier => visit.exportSpecifier(specifier, context.visitors, context.context))
        if (node.asserts)
            visit.objectExpression(node.asserts, context.visitors, context.context)
    },
    exportDefaultDeclaration<C>(node: SWC.ExportDefaultDeclaration, context: VisitorContext<C>): void {
        visit.defaultDecl(node.decl, context.visitors, context.context)
    },
    exportDefaultExpression<C>(node: SWC.ExportDefaultExpression, context: VisitorContext<C>): void {
        visit.expression(node.expression, context.visitors, context.context)
    },
    exportAllDeclaration<C>(node: SWC.ExportAllDeclaration, context: VisitorContext<C>): void {
        if (node.asserts) visit.objectExpression(node.asserts, context.visitors, context.context)
    },
    tsImportEqualsDeclaration<C>(node: SWC.TsImportEqualsDeclaration, context: VisitorContext<C>): void {
        //TODO:
        console.log(`!  TsImportEqualsDeclaration`)
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
                case "TsInterfaceDeclaration":
                    visit.tsInterfaceDeclaration(node, context.visitors, context.context, true)
                    return ret
                case "FunctionExpression":
                    visit.functionExpression(node, context.visitors, context.context, true)
                    return ret
                case "ClassExpression":
                    visit.classExpression(node, context.visitors, context.context, true)
                    return ret
            }
        })
    },
    exportSpecifier<C>(node: SWC.ExportSpecifier, c: VisitorContext<C>): void {
        //TODO:
        console.log(`!  ExportSpecifier > ${node.type}`)
    },
    importDeclaration<C>(node: SWC.ImportDeclaration, context: VisitorContext<C>): void {
        node.specifiers.forEach(specifier => visit.importSpecifier(specifier, context.visitors, context.context))
        if (node.asserts)
            visit.objectExpression(node.asserts, context.visitors, context.context)
    },
    importSpecifier<C>(node: SWC.ImportSpecifier, context: VisitorContext<C>): void {
        run(() => {
            switch (node.type) {
                case "ImportSpecifier":
                    visit.importNamedSpecifier(node, context.visitors, context.context, true)
                    return ret
                case "ImportDefaultSpecifier":
                    visit.importDefaultSpecifier(node, context.visitors, context.context, true)
                    return ret
                case "ImportNamespaceSpecifier":
                    visit.importNamespaceSpecifier(node, context.visitors, context.context, true)
                    return ret
            }
        })
    },
    importNamedSpecifier<C>(node: SWC.NamedImportSpecifier, context: VisitorContext<C>): void {
        if (node.imported?.type === "Identifier") visit.identifier(node.imported, context.visitors, context.context)
        visit.identifier(node.local, context.visitors, context.context)
    },
    importDefaultSpecifier<C>(_node: SWC.ImportDefaultSpecifier, _context: VisitorContext<C>): void {},
    importNamespaceSpecifier<C>(_node: SWC.ImportNamespaceSpecifier, _context: VisitorContext<C>): void {},
    declaration<C>(node: SWC.Declaration, context: VisitorContext<C>): void {
        run(() => {
            switch (node.type) {
                case "VariableDeclaration":
                    visit.variableDeclaration(node, context.visitors, context.context, true)
                    return ret
                case "ClassDeclaration":
                    visit.classDeclaration(node, context.visitors, context.context, true)
                    return ret
                case "FunctionDeclaration":
                    visit.functionDeclaration(node, context.visitors, context.context, true)
                    return ret
                case "TsInterfaceDeclaration":
                    visit.tsInterfaceDeclaration(node, context.visitors, context.context, true)
                    return ret
                case "TsTypeAliasDeclaration":
                    visit.tsTypeAliasDeclaration(node, context.visitors, context.context, true)
                    return ret
                case "TsEnumDeclaration":
                    visit.tsEnumDeclaration(node, context.visitors, context.context, true)
                    return ret
                case "TsModuleDeclaration":
                    visit.tsModuleDeclaration(node, context.visitors, context.context, true)
                    return ret
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
        //TODO:
        console.log(`!  ClassDeclaration`)
    },
    functionDeclaration<C>(node: SWC.FunctionDeclaration, context: VisitorContext<C>): void {
        if (node.decorators) node.decorators.forEach(decorator => visit.decorator(decorator, context.visitors, context.context))
        visit.identifier(node.identifier, context.visitors, context.context)
        if (node.typeParameters) visit.tsTypeParameterDeclaration(node.typeParameters, context.visitors, context.context)
        node.params.forEach(param => visit.param(param, context.visitors, context.context))
        if (node.returnType) visit.tsTypeAnnotation(node.returnType, context.visitors, context.context)
        if (node.body) visit.blockStatement(node.body, context.visitors, context.context)
    },
    tsInterfaceDeclaration<C>(node: SWC.TsInterfaceDeclaration, context: VisitorContext<C>): void {
        //TODO:
        console.log(`!  TsInterfaceDeclaration`)
    },
    tsTypeAliasDeclaration<C>(node: SWC.TsTypeAliasDeclaration, context: VisitorContext<C>): void {
        //TODO:
        console.log(`!  TsTypeAliasDeclaration`)
    },
    tsEnumDeclaration<C>(node: SWC.TsEnumDeclaration, context: VisitorContext<C>): void {
        //TODO:
        console.log(`!  TsEnumDeclaration`)
    },
    tsModuleDeclaration<C>(node: SWC.TsModuleDeclaration, context: VisitorContext<C>): void {
        //TODO:
        console.log(`!  TsModuleDeclaration`)
    },
    tsTypeParameterDeclaration<C>(node: SWC.TsTypeParameterDeclaration, context: VisitorContext<C>): void {
        //TODO:
        console.log(`!  TsTypeParameterDeclaration`)
    },
    tsTypeParameterInstantiation<C>(node: SWC.TsTypeParameterInstantiation, context: VisitorContext<C>): void {
        node.params.forEach(type => visit.tsType(type, context.visitors, context.context))
    },
    statement<C>(node: SWC.Statement, context: VisitorContext<C>): void {
        run(() => {
            switch (node.type) {
                case "EmptyStatement":
                    visit.emptyStatement(node, context.visitors, context.context, true)
                    return ret
                case "BlockStatement":
                    visit.blockStatement(node, context.visitors, context.context, true)
                    return ret
                case "DebuggerStatement":
                    visit.debuggerStatement(node, context.visitors, context.context, true)
                    return ret
                case "WithStatement":
                    visit.withStatement(node, context.visitors, context.context, true)
                    return ret
                case "ReturnStatement":
                    visit.returnStatement(node, context.visitors, context.context, true)
                    return ret
                case "LabeledStatement":
                    visit.labeledStatement(node, context.visitors, context.context, true)
                    return ret
                case "BreakStatement":
                    visit.breakStatement(node, context.visitors, context.context, true)
                    return ret
                case "ContinueStatement":
                    visit.continueStatement(node, context.visitors, context.context, true)
                    return ret
                case "IfStatement":
                    visit.ifStatement(node, context.visitors, context.context, true)
                    return ret
                case "SwitchStatement":
                    visit.switchStatement(node, context.visitors, context.context, true)
                    return ret
                case "ThrowStatement":
                    visit.throwStatement(node, context.visitors, context.context, true)
                    return ret
                case "TryStatement":
                    visit.tryStatement(node, context.visitors, context.context, true)
                    return ret
                case "WhileStatement":
                    visit.whileStatement(node, context.visitors, context.context, true)
                    return ret
                case "DoWhileStatement":
                    visit.doWhileStatement(node, context.visitors, context.context, true)
                    return ret
                case "ForStatement":
                    visit.forStatement(node, context.visitors, context.context, true)
                    return ret
                case "ForInStatement":
                    visit.forInStatement(node, context.visitors, context.context, true)
                    return ret
                case "ForOfStatement":
                    visit.forOfStatement(node, context.visitors, context.context, true)
                    return ret
                case "ClassDeclaration":
                case "FunctionDeclaration":
                case "VariableDeclaration":
                case "TsInterfaceDeclaration":
                case "TsTypeAliasDeclaration":
                case "TsEnumDeclaration":
                case "TsModuleDeclaration":
                    visit.declaration(node, context.visitors, context.context, true)
                    return ret
                case "ExpressionStatement":
                    visit.expressionStatement(node, context.visitors, context.context, true)
                    return ret
            }
        })
    },
    blockStatement<C>(node: SWC.BlockStatement, context: VisitorContext<C>): void {
        node.stmts.forEach(statement => visit.statement(statement, context.visitors, context.context))
    },
    emptyStatement<C>(_node: SWC.EmptyStatement, _context: VisitorContext<C>): void {},
    debuggerStatement<C>(_node: SWC.DebuggerStatement, _context: VisitorContext<C>): void {},
    withStatement<C>(node: SWC.WithStatement, context: VisitorContext<C>): void {
        visit.statement(node.body, context.visitors, context.context)
        visit.expression(node.object, context.visitors, context.context)
    },
    returnStatement<C>(node: SWC.ReturnStatement, context: VisitorContext<C>): void {
        if (node.argument) visit.expression(node.argument, context.visitors, context.context)
    },
    labeledStatement<C>(node: SWC.LabeledStatement, context: VisitorContext<C>): void {
        visit.statement(node.body, context.visitors, context.context)
        visit.identifier(node.label, context.visitors, context.context)
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
        //TODO:
        console.log(`!  SwitchStatement`)
    },
    throwStatement<C>(node: SWC.ThrowStatement, context: VisitorContext<C>): void {
        visit.expression(node.argument, context.visitors, context.context)
    },
    tryStatement<C>(node: SWC.TryStatement, context: VisitorContext<C>): void {
        //TODO:
        console.log(`!  TryStatement`)
    },
    whileStatement<C>(node: SWC.WhileStatement, context: VisitorContext<C>): void {
        visit.expression(node.test, context.visitors, context.context)
        visit.statement(node.body, context.visitors, context.context)
    },
    doWhileStatement<C>(node: SWC.DoWhileStatement, context: VisitorContext<C>): void {
        visit.statement(node.body, context.visitors, context.context)
        visit.expression(node.test, context.visitors, context.context)
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
                    visit.thisExpression(node, context.visitors, context.context, true)
                    return ret
                case "ArrayExpression":
                    visit.arrayExpression(node, context.visitors, context.context, true)
                    return ret
                case "ObjectExpression":
                    visit.objectExpression(node, context.visitors, context.context, true)
                    return ret
                case "FunctionExpression":
                    visit.functionExpression(node, context.visitors, context.context, true)
                    return ret
                case "UnaryExpression":
                    visit.unaryExpression(node, context.visitors, context.context, true)
                    return ret
                case "UpdateExpression":
                    visit.updateExpression(node, context.visitors, context.context, true)
                    return ret
                case "BinaryExpression":
                    visit.binaryExpression(node, context.visitors, context.context, true)
                    return ret
                case "AssignmentExpression":
                    visit.assignmentExpression(node, context.visitors, context.context, true)
                    return ret
                case "MemberExpression":
                    visit.memberExpression(node, context.visitors, context.context, true)
                    return ret
                case "SuperPropExpression":
                    visit.superPropExpression(node, context.visitors, context.context, true)
                    return ret
                case "ConditionalExpression":
                    visit.conditionalExpression(node, context.visitors, context.context, true)
                    return ret
                case "CallExpression":
                    visit.callExpression(node, context.visitors, context.context, true)
                    return ret
                case "NewExpression":
                    visit.newExpression(node, context.visitors, context.context, true)
                    return ret
                case "SequenceExpression":
                    visit.sequenceExpression(node, context.visitors, context.context, true)
                    return ret
                case "Identifier":
                    visit.identifier(node, context.visitors, context.context, true)
                    return ret
                case "StringLiteral":
                case "BooleanLiteral":
                case "NullLiteral":
                case "NumericLiteral":
                case "BigIntLiteral":
                case "RegExpLiteral":
                case "JSXText":
                    visit.literal(node, context.visitors, context.context, true)
                    return ret
                case "TemplateLiteral":
                    visit.templateLiteral(node, context.visitors, context.context, true)
                    return ret
                case "TaggedTemplateExpression":
                    visit.taggedTemplateExpression(node, context.visitors, context.context, true)
                    return ret
                case "ArrowFunctionExpression":
                    visit.arrowFunctionExpression(node, context.visitors, context.context, true)
                    return ret
                case "ClassExpression":
                    visit.classExpression(node, context.visitors, context.context, true)
                    return ret
                case "YieldExpression":
                    visit.yieldExpression(node, context.visitors, context.context, true)
                    return ret
                case "MetaProperty":
                    visit.metaProperty(node, context.visitors, context.context, true)
                    return ret
                case "AwaitExpression":
                    visit.awaitExpression(node, context.visitors, context.context, true)
                    return ret
                case "ParenthesisExpression":
                    visit.parenthesisExpression(node, context.visitors, context.context, true)
                    return ret
                case "JSXMemberExpression":
                    visit.jsxMemberExpression(node, context.visitors, context.context, true)
                    return ret
                case "JSXNamespacedName":
                    visit.jsxNamespaceName(node, context.visitors, context.context, true)
                    return ret
                case "JSXEmptyExpression":
                    visit.jsxEmptyExpression(node, context.visitors, context.context, true)
                    return ret
                case "JSXElement":
                    visit.jsxElement(node, context.visitors, context.context, true)
                    return ret
                case "JSXFragment":
                    visit.jsxFragment(node, context.visitors, context.context, true)
                    return ret
                case "TsTypeAssertion":
                    visit.tsTypeAssertion(node, context.visitors, context.context, true)
                    return ret
                case "TsConstAssertion":
                    visit.tsConstAssertion(node, context.visitors, context.context, true)
                    return ret
                case "TsNonNullExpression":
                    visit.tsNonNullExpression(node, context.visitors, context.context, true)
                    return ret
                case "TsAsExpression":
                    visit.tsAsExpression(node, context.visitors, context.context, true)
                    return ret
                case "TsSatisfiesExpression":
                    visit.tsSatisfiesExpression(node, context.visitors, context.context, true)
                    return ret
                case "TsInstantiation":
                    visit.tsInstantiation(node, context.visitors, context.context, true)
                    return ret
                case "PrivateName":
                    visit.privateName(node, context.visitors, context.context, true)
                    return ret
                case "OptionalChainingExpression":
                    visit.optionalChainingExpression(node, context.visitors, context.context, true)
                    return ret
                case "Invalid":
                    visit.invalid(node, context.visitors, context.context, true)
                    return ret
            }
        })
    },
    thisExpression<C>(_node: SWC.ThisExpression, _context: VisitorContext<C>): void {},
    arrayExpression<C>(node: SWC.ArrayExpression, context: VisitorContext<C>): void{
        node.elements.forEach(element => element && visit.expression(element.expression, context.visitors, context.context))
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
        node.decorators?.forEach(decorator => visit.decorator(decorator, context.visitors, context.context))
        if (node.identifier) visit.identifier(node.identifier, context.visitors, context.context)
        if (node.typeParameters) visit.tsTypeParameterDeclaration(node.typeParameters, context.visitors, context.context)
        node.params.forEach(param => visit.param(param, context.visitors, context.context))

        if (node.returnType) visit.tsTypeAnnotation(node.returnType, context.visitors, context.context)
        if (node.body) visit.blockStatement(node.body, context.visitors, context.context)
    },
    unaryExpression<C>(node: SWC.UnaryExpression, context: VisitorContext<C>): void {
        visit.expression(node, context.visitors, context.context)
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
                case "PrivateName":
                    visit.privateName(node.property, context.visitors, context.context)
                    return ret
                case "Identifier":
                    visit.identifier(node.property, context.visitors, context.context)
                    return ret
                case "Computed":
                    visit.computedPropertyName(node.property, context.visitors, context.context)
                    return ret
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
                    visit.super(node.callee, context.visitors, context.context)
                    return ret
                case "Import":
                    visit.import(node.callee, context.visitors, context.context)
                    return ret
                default:
                    visit.expression(node.callee, context.visitors, context.context)
                    return ret
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
    literal<C>(_node: SWC.Literal, _context: VisitorContext<C>): void {},
    templateLiteral<C>(node: SWC.TemplateLiteral, context: VisitorContext<C>): void {
        //TODO:
        console.log(`!  TemplateLiteral`)
    },
    taggedTemplateExpression<C>(node: SWC.TaggedTemplateExpression, context: VisitorContext<C>): void {
        //TODO:
        console.log(`!  TaggedTemplateExpression`)
    },
    arrowFunctionExpression<C>(node: SWC.ArrowFunctionExpression, context: VisitorContext<C>): void {
        if (node.typeParameters) visit.tsTypeParameterDeclaration(node.typeParameters, context.visitors, context.context)
        node.params.forEach(param => visit.pattern(param, context.visitors, context.context))
        if (node.returnType) visit.tsTypeAnnotation(node.returnType, context.visitors, context.context)
        if (node.body.type === "BlockStatement") visit.blockStatement(node.body, context.visitors, context.context)
        else visit.expression(node.body, context.visitors, context.context)
    },
    classExpression<C>(node: SWC.ClassExpression, context: VisitorContext<C>): void {
        //TODO:
        console.log(`!  ClassExpression`)
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
        if (node.object.type === "Identifier") visit.identifier(node.object, context.visitors, context.context)
        else visit.jsxMemberExpression(node.object, context.visitors, context.context)
        visit.identifier(node.property, context.visitors, context.context)
    },
    jsxNamespacedName<C>(node: SWC.JSXNamespacedName, context: VisitorContext<C>): void {
        visit.identifier(node.namespace, context.visitors, context.context)
        visit.identifier(node.name, context.visitors, context.context)
    },
    jsxEmptyExpression<C>(_node: SWC.JSXEmptyExpression, _context: VisitorContext<C>): void {},
    jsxElement<C>(node: SWC.JSXElement, context: VisitorContext<C>): void {
        //TODO:
        console.log(`!  JSXElement`)
    },
    jsxFragment<C>(node: SWC.JSXFragment, context: VisitorContext<C>): void {
        //TODO:
        console.log(`!  JSXFragment`)
    },
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
                    visit.memberExpression(node.base, context.visitors, context.context)
                    return ret
                case "CallExpression":
                    visit.callExpression(node.base, context.visitors, context.context)
                    return ret
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
                case "KeyValueProperty":
                    visit.keyValueProperty(node, context.visitors, context.context, true)
                    return ret
                case "Identifier":
                    visit.identifier(node, context.visitors, context.context, true)
                    return ret
                case "AssignmentProperty":
                    visit.assignmentProperty(node, context.visitors, context.context, true)
                    return ret
                case "GetterProperty":
                    visit.getterProperty(node, context.visitors, context.context, true)
                    return ret
                case "SetterProperty":
                    visit.setterProperty(node, context.visitors, context.context, true)
                    return ret
                case "MethodProperty":
                    visit.methodProperty(node, context.visitors, context.context, true)
                    return ret
            }
        })
    },
    propertyName<C>(node: SWC.PropertyName, context: VisitorContext<C>): void {
        run(() => {
            switch (node.type) {
                case "Computed":
                    visit.computedPropertyName(node, context.visitors, context.context, true)
                    return ret
                case "Identifier":
                    visit.identifier(node, context.visitors, context.context, true)
                    return ret
                case "StringLiteral":
                case "NumericLiteral":
                case "BigIntLiteral":
                    visit.literal(node, context.visitors, context.context, true)
                    return ret
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
        if (node.decorators) node.decorators.forEach(decorator => visit.decorator(decorator, context.visitors, context.context))
        visit.propertyName(node.key, context.visitors, context.context)
        if (node.typeParameters) visit.tsTypeParameterDeclaration(node.typeParameters, context.visitors, context.context)
        node.params.forEach(param => visit.param(param, context.visitors, context.context))
        if (node.returnType) visit.tsTypeAnnotation(node.returnType, context.visitors, context.context)
        if (node.body) visit.blockStatement(node.body, context.visitors, context.context)
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
                case "Invalid":
                    visit.invalid(node, context.visitors, context.context, true)
                    return ret
                case "Identifier":
                    visit.identifier(node, context.visitors, context.context, true)
                    return ret
                case "ArrayPattern":
                    visit.arrayPattern(node, context.visitors, context.context, true)
                    return ret
                case "RestElement":
                    visit.restElement(node, context.visitors, context.context, true)
                    return ret
                case "ObjectPattern":
                    visit.objectPattern(node, context.visitors, context.context, true)
                    return ret
                case "AssignmentPattern":
                    visit.assignmentPattern(node, context.visitors, context.context, true)
                    return ret
                default:
                    visit.expression(node, context.visitors, context.context, true)
                    return ret
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
                    visit.keyValuePatternProperty(node, context.visitors, context.context, true)
                    return ret
                case "AssignmentPatternProperty":
                    visit.assignmentPatternProperty(node, context.visitors, context.context, true)
                    return ret
                case "RestElement":
                    visit.restElement(node, context.visitors, context.context, true)
                    return ret
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
                    visit.tsThisType(node, context.visitors, context.context, true)
                    return ret
                case "TsKeywordType":
                    visit.tsKeywordType(node, context.visitors, context.context, true)
                    return ret
                case "TsFunctionType":
                    visit.tsFunctionType(node, context.visitors, context.context, true)
                    return ret
                case "TsConstructorType":
                    visit.tsConstructorType(node, context.visitors, context.context, true)
                    return ret
                case "TsTypeReference":
                    visit.tsTypeReference(node, context.visitors, context.context, true)
                    return ret
                case "TsTypeQuery":
                    visit.tsTypeQuery(node, context.visitors, context.context, true)
                    return ret
                case "TsTypeLiteral":
                    visit.tsTypeLiteral(node, context.visitors, context.context, true)
                    return ret
                case "TsArrayType":
                    visit.tsArrayType(node, context.visitors, context.context, true)
                    return ret
                case "TsTupleType":
                    visit.tsTupleType(node, context.visitors, context.context, true)
                    return ret
                case "TsOptionalType":
                    visit.tsOptionalType(node, context.visitors, context.context, true)
                    return ret
                case "TsRestType":
                    visit.tsRestType(node, context.visitors, context.context, true)
                    return ret
                case "TsUnionType":
                    visit.tsUnionType(node, context.visitors, context.context, true)
                    return ret
                case "TsIntersectionType":
                    visit.tsInterSectionType(node, context.visitors, context.context, true)
                    return ret
                case "TsConditionalType":
                    visit.tsConditionalType(node, context.visitors, context.context, true)
                    return ret
                case "TsInferType":
                    visit.tsInferType(node, context.visitors, context.context, true)
                    return ret
                case "TsParenthesizedType":
                    visit.tsParenthesizedType(node, context.visitors, context.context, true)
                    return ret
                case "TsTypeOperator":
                    visit.tsTypeOperator(node, context.visitors, context.context, true)
                    return ret
                case "TsIndexedAccessType":
                    visit.tsIndexedAccessType(node, context.visitors, context.context, true)
                    return ret
                case "TsMappedType":
                    visit.tsMappedType(node, context.visitors, context.context, true)
                    return ret
                case "TsLiteralType":
                    visit.tsLiteralType(node, context.visitors, context.context, true)
                    return ret
                case "TsTypePredicate":
                    visit.tsTypePredicate(node, context.visitors, context.context, true)
                    return ret
                case "TsImportType":
                    visit.tsImportType(node, context.visitors, context.context, true)
                    return ret
            }
        })
    },
    tsKeywordType<C>(_node: SWC.TsKeywordType, _context: VisitorContext<C>): void {},
    tsThisType<C>(_node: SWC.TsThisType, _context: VisitorContext<C>): void {},
    tsFunctionType<C>(node: SWC.TsFunctionType, context: VisitorContext<C>): void {
        if (node.typeParams) visit.tsTypeParameterDeclaration(node.typeParams, context.visitors, context.context)
        node.params.forEach(param => visit.pattern(param, context.visitors, context.context))
        visit.tsTypeAnnotation(node.typeAnnotation, context.visitors, context.context, true)
    },
    tsConstructorType<C>(node: SWC.TsConstructorType, context: VisitorContext<C>): void {
        //TODO:
        console.log(`!  TsConstructorType`)
    },
    tsTypeReference<C>(node: SWC.TsTypeReference, context: VisitorContext<C>): void {
        visit.tsEntityName(node.typeName, context.visitors, context.context)
        if (node.typeParams) visit.tsTypeParameterInstantiation(node.typeParams, context.visitors, context.context)
    },
    tsTypeQuery<C>(node: SWC.TsTypeQuery, context: VisitorContext<C>): void {
        //TODO:
        console.log(`!  TsTypeQuery`)
    },
    tsTypeLiteral<C>(node: SWC.TsTypeLiteral, context: VisitorContext<C>): void {
        //TODO:
        console.log(`!  TsTypeLiteral`)
    },
    tsArrayType<C>(node: SWC.TsArrayType, context: VisitorContext<C>): void {
        visit.tsType(node.elemType, context.visitors, context.context)
    },
    tsTupleType<C>(node: SWC.TsTupleType, context: VisitorContext<C>): void {
        //TODO:
        console.log(`!  TsTupleType`)
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
        //TODO:
        console.log(`!  TsConditionalType`)
    },
    tsInferType<C>(node: SWC.TsInferType, context: VisitorContext<C>): void {
        //TODO:
        console.log(`!  TsInferType`)
    },
    tsParenthesizedType<C>(node: SWC.TsParenthesizedType, context: VisitorContext<C>): void {
        visit.tsType(node.typeAnnotation, context.visitors, context.context)
    },
    tsTypeOperator<C>(node: SWC.TsTypeOperator, context: VisitorContext<C>): void {
        //TODO:
        console.log(`!  TsTypeOperator`)
    },
    tsIndexedAccessType<C>(node: SWC.TsIndexedAccessType, context: VisitorContext<C>): void {
        //TODO:
        console.log(`!  TsIndexedAccessType`)
    },
    tsMappedType<C>(node: SWC.TsMappedType, context: VisitorContext<C>): void {
        //TODO:
        console.log(`!  TsMappedType`)
    },
    tsLiteralType<C>(node: SWC.TsLiteralType, context: VisitorContext<C>): void {
        //TODO:
        console.log(`!  TsLiteralType`)
    },
    tsTypePredicate<C>(node: SWC.TsTypePredicate, context: VisitorContext<C>): void {
        //TODO:
        console.log(`!  TsTypePredicate`)
    },
    tsImportType<C>(node: SWC.TsImportType, context: VisitorContext<C>): void {
        //TODO:
        console.log(`!  TsImportType`)
    },
    tsEntityName<C>(node: SWC.TsEntityName, context: VisitorContext<C>): void {
        if (node.type === "Identifier") visit.identifier(node, context.visitors, context.context, true)
        else visit.tsQualifiedName(node, context.visitors, context.context)
    },
    tsQualifiedName<C>(node: SWC.TsQualifiedName, context: VisitorContext<C>): void {
        visit.tsEntityName(node.left, context.visitors, context.context)
        visit.identifier(node.right, context.visitors, context.context)
    },
    super<C>(_node: SWC.Super, _context: VisitorContext<C>): void {},
    import<C>(_node: SWC.Import, _context: VisitorContext<C>): void {},
} satisfies { [K in keyof AllVisitors<unknown>]: <C>(node: VisitorTarget<K>, context: VisitorContext<C>) => void }

function noDescend(): void {}

function makeVisitor<Name extends keyof AllVisitors<unknown>>(name: Name) {
    type Node = VisitorTarget<Name>

    return function<C>(node: Node, visitors: AllVisitors<C>, context: C, skipAny: boolean = false) {
        function nodeDescend(newContext: C) {
            (defaultVisitors[name] as Visitor<Node, C>)(node, { context: newContext, visitors, descend: noDescend })
        }

        function anyDescend(newContext: C) {
            const visitor: Visitor<Node, C> = (visitors[name] ?? defaultVisitors[name]<C>) as Visitor<Node, C>
            visitor(node, { context: newContext, visitors, descend: nodeDescend })
        }

        if (skipAny) {
            anyDescend(context)
            return
        }

        const visitor = visitors.any ?? defaultVisitors.any<C>
        visitor(node, { context, visitors, descend: anyDescend })
    }
}

export const visit = {
    module: makeVisitor("module"),
    moduleItem: makeVisitor("moduleItem"),
    moduleDeclaration: makeVisitor("moduleDeclaration"),
    exportDeclaration: makeVisitor("exportDeclaration"),
    exportNamedDeclaration: makeVisitor("exportNamedDeclaration"),
    exportDefaultDeclaration: makeVisitor("exportDefaultDeclaration"),
    exportDefaultExpression: makeVisitor("exportDefaultExpression"),
    exportAllDeclaration: makeVisitor("exportAllDeclaration"),
    tsImportEqualsDeclaration: makeVisitor("tsImportEqualsDeclaration"),
    tsExportAssignment: makeVisitor("tsExportAssignment"),
    tsNamespaceExportDeclaration: makeVisitor("tsNamespaceExportDeclaration"),
    defaultDecl: makeVisitor("defaultDecl"),
    exportSpecifier: makeVisitor("exportSpecifier"),
    importDeclaration: makeVisitor("importDeclaration"),
    importSpecifier: makeVisitor("importSpecifier"),
    importNamedSpecifier: makeVisitor("importNamedSpecifier"),
    importDefaultSpecifier: makeVisitor("importDefaultSpecifier"),
    importNamespaceSpecifier: makeVisitor("importNamespaceSpecifier"),
    declaration: makeVisitor("declaration"),
    variableDeclaration: makeVisitor("variableDeclaration"),
    variableDeclarator: makeVisitor("variableDeclarator"),
    classDeclaration: makeVisitor("classDeclaration"),
    functionDeclaration: makeVisitor("functionDeclaration"),
    tsInterfaceDeclaration: makeVisitor("tsInterfaceDeclaration"),
    tsTypeAliasDeclaration: makeVisitor("tsTypeAliasDeclaration"),
    tsEnumDeclaration: makeVisitor("tsEnumDeclaration"),
    tsModuleDeclaration: makeVisitor("tsModuleDeclaration"),
    tsTypeParameterDeclaration: makeVisitor("tsTypeParameterDeclaration"),
    tsTypeParameterInstantiation: makeVisitor("tsTypeParameterInstantiation"),
    statement: makeVisitor("statement"),
    expression: makeVisitor("expression"),
    thisExpression: makeVisitor("thisExpression"),
    arrayExpression: makeVisitor("arrayExpression"),
    objectExpression: makeVisitor("objectExpression"),
    functionExpression: makeVisitor("functionExpression"),
    unaryExpression: makeVisitor("unaryExpression"),
    updateExpression: makeVisitor("updateExpression"),
    binaryExpression: makeVisitor("binaryExpression"),
    assignmentExpression: makeVisitor("assignmentExpression"),
    memberExpression: makeVisitor("memberExpression"),
    superPropExpression: makeVisitor("superPropExpression"),
    conditionalExpression: makeVisitor("conditionalExpression"),
    callExpression: makeVisitor("callExpression"),
    newExpression: makeVisitor("newExpression"),
    sequenceExpression: makeVisitor("sequenceExpression"),
    identifier: makeVisitor("identifier"),
    literal: makeVisitor("literal"),
    templateLiteral: makeVisitor("templateLiteral"),
    taggedTemplateExpression: makeVisitor("taggedTemplateExpression"),
    arrowFunctionExpression: makeVisitor("arrowFunctionExpression"),
    classExpression: makeVisitor("classExpression"),
    yieldExpression: makeVisitor("yieldExpression"),
    metaProperty: makeVisitor("metaProperty"),
    awaitExpression: makeVisitor("awaitExpression"),
    parenthesisExpression: makeVisitor("parenthesisExpression"),
    jsxMemberExpression: makeVisitor("jsxMemberExpression"),
    jsxNamespaceName: makeVisitor("jsxNamespacedName"),
    jsxEmptyExpression: makeVisitor("jsxEmptyExpression"),
    jsxElement: makeVisitor("jsxElement"),
    jsxFragment: makeVisitor("jsxFragment"),
    tsTypeAssertion: makeVisitor("tsTypeAssertion"),
    tsConstAssertion: makeVisitor("tsConstAssertion"),
    tsNonNullExpression: makeVisitor("tsNonNullExpression"),
    tsAsExpression: makeVisitor("tsAsExpression"),
    tsSatisfiesExpression: makeVisitor("tsSatisfiesExpression"),
    tsInstantiation: makeVisitor("tsInstantiation"),
    privateName: makeVisitor("privateName"),
    optionalChainingExpression: makeVisitor("optionalChainingExpression"),
    invalid: makeVisitor("invalid"),
    spreadElement: makeVisitor("spreadElement"),
    property: makeVisitor("property"),
    propertyName: makeVisitor("propertyName"),
    computedPropertyName: makeVisitor("computedPropertyName"),
    keyValueProperty: makeVisitor("keyValueProperty"),
    assignmentProperty: makeVisitor("assignmentProperty"),
    getterProperty: makeVisitor("getterProperty"),
    setterProperty: makeVisitor("setterProperty"),
    methodProperty: makeVisitor("methodProperty"),
    param: makeVisitor("param"),
    decorator: makeVisitor("decorator"),
    pattern: makeVisitor("pattern"),
    arrayPattern: makeVisitor("arrayPattern"),
    restElement: makeVisitor("restElement"),
    objectPattern: makeVisitor("objectPattern"),
    assignmentPattern: makeVisitor("assignmentPattern"),
    tsTypeAnnotation: makeVisitor("tsTypeAnnotation"),
    blockStatement: makeVisitor("blockStatement"),
    emptyStatement: makeVisitor("emptyStatement"),
    debuggerStatement: makeVisitor("debuggerStatement"),
    withStatement: makeVisitor("withStatement"),
    returnStatement: makeVisitor("returnStatement"),
    labeledStatement: makeVisitor("labeledStatement"),
    breakStatement: makeVisitor("breakStatement"),
    continueStatement: makeVisitor("continueStatement"),
    ifStatement: makeVisitor("ifStatement"),
    switchStatement: makeVisitor("switchStatement"),
    throwStatement: makeVisitor("throwStatement"),
    tryStatement: makeVisitor("tryStatement"),
    whileStatement: makeVisitor("whileStatement"),
    doWhileStatement: makeVisitor("doWhileStatement"),
    forStatement: makeVisitor("forStatement"),
    forInStatement: makeVisitor("forInStatement"),
    forOfStatement: makeVisitor("forOfStatement"),
    expressionStatement: makeVisitor("expressionStatement"),
    tsType: makeVisitor("tsType"),
    super: makeVisitor("super"),
    import: makeVisitor("import"),
    objectPatternProperty: makeVisitor("objectPatternProperty"),
    keyValuePatternProperty: makeVisitor("keyValuePatternProperty"),
    assignmentPatternProperty: makeVisitor("assignmentPatternProperty"),
    tsKeywordType: makeVisitor("tsKeywordType"),
    tsThisType: makeVisitor("tsThisType"),
    tsFunctionType: makeVisitor("tsFunctionType"),
    tsConstructorType: makeVisitor("tsConstructorType"),
    tsTypeReference: makeVisitor("tsTypeReference"),
    tsTypeQuery: makeVisitor("tsTypeQuery"),
    tsTypeLiteral: makeVisitor("tsTypeLiteral"),
    tsArrayType: makeVisitor("tsArrayType"),
    tsTupleType: makeVisitor("tsTupleType"),
    tsOptionalType: makeVisitor("tsOptionalType"),
    tsRestType: makeVisitor("tsRestType"),
    tsUnionType: makeVisitor("tsUnionType"),
    tsInterSectionType: makeVisitor("tsIntersectionType"),
    tsConditionalType: makeVisitor("tsConditionalType"),
    tsInferType: makeVisitor("tsInferType"),
    tsParenthesizedType: makeVisitor("tsParenthesizedType"),
    tsTypeOperator: makeVisitor("tsTypeOperator"),
    tsIndexedAccessType: makeVisitor("tsIndexedAccessType"),
    tsMappedType: makeVisitor("tsMappedType"),
    tsLiteralType: makeVisitor("tsLiteralType"),
    tsTypePredicate: makeVisitor("tsTypePredicate"),
    tsImportType: makeVisitor("tsImportType"),
    tsEntityName: makeVisitor("tsEntityName"),
    tsQualifiedName: makeVisitor("tsQualifiedName"),
}
