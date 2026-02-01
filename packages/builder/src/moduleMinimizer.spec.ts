import { describe, it, expect, assert } from "vitest"
import * as SWC from "@swc/core"
import { parseSource } from "@/parse"
import {
    patternContainsIdentifier,
    isPatternPropertyUsed,
    isPatternElementUsed,
    pruneUnusedPatternParts,
    generateMinimalModuleItem
} from "@/moduleMinimizer"
import { FileInfo, BindingInfo } from "@/ProjectIndex"

// Helper to parse code and extract the first variable declarator's pattern
async function getPattern(code: string): Promise<SWC.Pattern> {
    const module = await parseSource(code, "test.ts")
    const decl = module.ast.body[0] as SWC.VariableDeclaration
    const declarator = decl.declarations[0]
    assert(declarator, "Expected declarator to be defined")
    return declarator.id
}

// Helper to get identifier from pattern at a specific position
function getIdentifierFromPattern(pattern: SWC.Pattern, name: string): SWC.Identifier {
    const result = findIdentifierInPattern(pattern, name)
    assert(result, `Expected to find identifier '${name}' in pattern`)
    return result
}

function findIdentifierInPattern(pattern: SWC.Pattern, name: string): SWC.Identifier | null {
    if (pattern.type === "Identifier") {
        return pattern.value === name ? pattern : null
    }
    if (pattern.type === "ObjectPattern") {
        for (const prop of pattern.properties) {
            if (prop.type === "AssignmentPatternProperty" && prop.key.value === name) {
                return prop.key
            }
            if (prop.type === "KeyValuePatternProperty") {
                const found = findIdentifierInPattern(prop.value, name)
                if (found) return found
            }
            if (prop.type === "RestElement") {
                const found = findIdentifierInPattern(prop.argument, name)
                if (found) return found
            }
        }
    }
    if (pattern.type === "ArrayPattern") {
        for (const elem of pattern.elements) {
            if (elem) {
                const found = findIdentifierInPattern(elem, name)
                if (found) return found
            }
        }
    }
    if (pattern.type === "RestElement") {
        return findIdentifierInPattern(pattern.argument, name)
    }
    if (pattern.type === "AssignmentPattern") {
        return findIdentifierInPattern(pattern.left, name)
    }
    return null
}

// Helper to create a mock FileInfo with specific used bindings
function createMockFileInfo(
    declarator: SWC.VariableDeclarator,
    declaration: SWC.VariableDeclaration,
    moduleItem: SWC.ModuleItem,
    usedIdentifiers: SWC.Identifier[]
): FileInfo {
    const usedBindings = new Set<BindingInfo>()

    for (const identifier of usedIdentifiers) {
        usedBindings.add({
            identifier,
            ref: { name: identifier.value, id: identifier.ctxt },
            declarator: { type: 'variable', declarator, declaration },
            moduleItem
        })
    }

    return {
        filePath: "test.ts",
        ast: { type: "Module", span: { start: 0, end: 0, ctxt: 0 }, body: [], interpreter: "" },
        styleExpressions: new Set(),
        extractedExpressions: new Map(),
        references: new Set(),
        moduleBindings: { get: () => undefined, set: () => {}, has: () => false, delete: () => false } as unknown as FileInfo["moduleBindings"],
        localImports: { get: () => undefined, set: () => {}, has: () => false, delete: () => false } as unknown as FileInfo["localImports"],
        usedBindings,
        exports: new Map()
    }
}

function createEmptyFileInfo(ast: SWC.Module): FileInfo {
    return {
        filePath: "test.ts",
        ast,
        styleExpressions: new Set(),
        extractedExpressions: new Map(),
        references: new Set(),
        moduleBindings: { get: () => undefined, set: () => {}, has: () => false, delete: () => false } as unknown as FileInfo["moduleBindings"],
        localImports: { get: () => undefined, set: () => {}, has: () => false, delete: () => false } as unknown as FileInfo["localImports"],
        usedBindings: new Set(),
        exports: new Map()
    }
}

describe("patternContainsIdentifier", () => {
    describe("simple identifier patterns", () => {
        it("returns true when pattern is the exact identifier", async () => {
            // const x = value
            const pattern = await getPattern("const x = value")
            const identifier = pattern as SWC.Identifier

            expect(patternContainsIdentifier(pattern, identifier)).toBe(true)
        })

        it("returns false when pattern is a different identifier", async () => {
            // const x = value; const y = other
            const pattern1 = await getPattern("const x = value")
            const pattern2 = await getPattern("const y = other")

            expect(patternContainsIdentifier(pattern1, pattern2 as SWC.Identifier)).toBe(false)
        })
    })

    describe("object patterns", () => {
        it("finds identifier in shorthand property: { a }", async () => {
            // const { a } = obj
            const pattern = await getPattern("const { a } = obj") as SWC.ObjectPattern
            const identifier = getIdentifierFromPattern(pattern, "a")

            expect(patternContainsIdentifier(pattern, identifier)).toBe(true)
        })

        it("finds identifier in renamed property: { a: b }", async () => {
            // const { a: b } = obj - 'b' is the local binding
            const pattern = await getPattern("const { a: b } = obj") as SWC.ObjectPattern
            const identifier = getIdentifierFromPattern(pattern, "b")

            expect(patternContainsIdentifier(pattern, identifier)).toBe(true)
        })

        it("finds identifier in rest element: { ...rest }", async () => {
            // const { ...rest } = obj
            const pattern = await getPattern("const { ...rest } = obj") as SWC.ObjectPattern
            const identifier = getIdentifierFromPattern(pattern, "rest")

            expect(patternContainsIdentifier(pattern, identifier)).toBe(true)
        })

        it("finds identifier in nested object pattern: { a: { b } }", async () => {
            // const { a: { b } } = obj
            const pattern = await getPattern("const { a: { b } } = obj") as SWC.ObjectPattern
            const identifier = getIdentifierFromPattern(pattern, "b")

            expect(patternContainsIdentifier(pattern, identifier)).toBe(true)
        })
    })

    describe("array patterns", () => {
        it("finds identifier in array element: [a]", async () => {
            // const [a] = arr
            const pattern = await getPattern("const [a] = arr") as SWC.ArrayPattern
            const identifier = getIdentifierFromPattern(pattern, "a")

            expect(patternContainsIdentifier(pattern, identifier)).toBe(true)
        })

        it("finds identifier with holes: [, , a]", async () => {
            // const [, , a] = arr - skipping first two elements
            const pattern = await getPattern("const [, , a] = arr") as SWC.ArrayPattern
            const identifier = getIdentifierFromPattern(pattern, "a")

            expect(patternContainsIdentifier(pattern, identifier)).toBe(true)
        })

        it("finds identifier in rest element: [...rest]", async () => {
            // const [...rest] = arr
            const pattern = await getPattern("const [...rest] = arr") as SWC.ArrayPattern
            const identifier = getIdentifierFromPattern(pattern, "rest")

            expect(patternContainsIdentifier(pattern, identifier)).toBe(true)
        })

        it("finds identifier in nested array: [[a]]", async () => {
            // const [[a]] = arr
            const pattern = await getPattern("const [[a]] = arr") as SWC.ArrayPattern
            const identifier = getIdentifierFromPattern(pattern, "a")

            expect(patternContainsIdentifier(pattern, identifier)).toBe(true)
        })
    })

    describe("assignment patterns (default values)", () => {
        it("finds identifier with default value: { a = 5 }", async () => {
            // const { a = 5 } = obj
            const pattern = await getPattern("const { a = 5 } = obj") as SWC.ObjectPattern
            const identifier = getIdentifierFromPattern(pattern, "a")

            expect(patternContainsIdentifier(pattern, identifier)).toBe(true)
        })

        it("finds identifier in array with default: [a = 5]", async () => {
            // const [a = 5] = arr
            const pattern = await getPattern("const [a = 5] = arr") as SWC.ArrayPattern
            const identifier = getIdentifierFromPattern(pattern, "a")

            expect(patternContainsIdentifier(pattern, identifier)).toBe(true)
        })
    })

    describe("complex nested patterns", () => {
        it("finds deeply nested identifier", async () => {
            // const { a: { b: [c, { d }] } } = obj
            const pattern = await getPattern("const { a: { b: [c, { d }] } } = obj")
            const identifier = getIdentifierFromPattern(pattern, "d")

            expect(patternContainsIdentifier(pattern, identifier)).toBe(true)
        })
    })

    describe("negative cases", () => {
        it("returns false when identifier is not in object pattern", async () => {
            const pattern = await getPattern("const { a, b } = obj") as SWC.ObjectPattern
            const otherModule = await parseSource("const c = x", "test.ts")
            const otherDecl = otherModule.ast.body[0] as SWC.VariableDeclaration
            const otherDeclarator = otherDecl.declarations[0]
            assert(otherDeclarator, "Expected declarator")
            const cIdentifier = otherDeclarator.id as SWC.Identifier

            expect(patternContainsIdentifier(pattern, cIdentifier)).toBe(false)
        })

        it("returns false when identifier is not in array pattern", async () => {
            const pattern = await getPattern("const [a, b] = arr") as SWC.ArrayPattern
            const otherModule = await parseSource("const c = x", "test.ts")
            const otherDecl = otherModule.ast.body[0] as SWC.VariableDeclaration
            const otherDeclarator = otherDecl.declarations[0]
            assert(otherDeclarator, "Expected declarator")
            const cIdentifier = otherDeclarator.id as SWC.Identifier

            expect(patternContainsIdentifier(pattern, cIdentifier)).toBe(false)
        })

        it("returns false for empty object pattern", async () => {
            const pattern = await getPattern("const {} = obj") as SWC.ObjectPattern
            const otherModule = await parseSource("const a = x", "test.ts")
            const otherDecl = otherModule.ast.body[0] as SWC.VariableDeclaration
            const otherDeclarator = otherDecl.declarations[0]
            assert(otherDeclarator, "Expected declarator")
            const aIdentifier = otherDeclarator.id as SWC.Identifier

            expect(patternContainsIdentifier(pattern, aIdentifier)).toBe(false)
        })

        it("returns false for empty array pattern", async () => {
            const pattern = await getPattern("const [] = arr") as SWC.ArrayPattern
            const otherModule = await parseSource("const a = x", "test.ts")
            const otherDecl = otherModule.ast.body[0] as SWC.VariableDeclaration
            const otherDeclarator = otherDecl.declarations[0]
            assert(otherDeclarator, "Expected declarator")
            const aIdentifier = otherDeclarator.id as SWC.Identifier

            expect(patternContainsIdentifier(pattern, aIdentifier)).toBe(false)
        })
    })
})

describe("isPatternPropertyUsed", () => {
    it("returns true when shorthand property is used", async () => {
        const module = await parseSource("const { a, b } = obj", "test.ts")
        const declaration = module.ast.body[0] as SWC.VariableDeclaration
        const declarator = declaration.declarations[0]
        assert(declarator, "Expected declarator")
        const pattern = declarator.id as SWC.ObjectPattern
        const aProp = pattern.properties[0]
        assert(aProp, "Expected property")
        const aIdentifier = getIdentifierFromPattern(pattern, "a")

        const fileInfo = createMockFileInfo(declarator, declaration, declaration, [aIdentifier])

        expect(isPatternPropertyUsed(aProp, declarator, fileInfo)).toBe(true)
    })

    it("returns false when property is not used", async () => {
        const module = await parseSource("const { a, b } = obj", "test.ts")
        const declaration = module.ast.body[0] as SWC.VariableDeclaration
        const declarator = declaration.declarations[0]
        assert(declarator, "Expected declarator")
        const pattern = declarator.id as SWC.ObjectPattern
        const aProp = pattern.properties[0]
        assert(aProp, "Expected property")
        const bIdentifier = getIdentifierFromPattern(pattern, "b")

        // Only b is used, checking if a is used
        const fileInfo = createMockFileInfo(declarator, declaration, declaration, [bIdentifier])

        expect(isPatternPropertyUsed(aProp, declarator, fileInfo)).toBe(false)
    })

    it("returns true when renamed property value is used", async () => {
        const module = await parseSource("const { a: renamed } = obj", "test.ts")
        const declaration = module.ast.body[0] as SWC.VariableDeclaration
        const declarator = declaration.declarations[0]
        assert(declarator, "Expected declarator")
        const pattern = declarator.id as SWC.ObjectPattern
        const prop = pattern.properties[0]
        assert(prop, "Expected property")
        const renamedIdentifier = getIdentifierFromPattern(pattern, "renamed")

        const fileInfo = createMockFileInfo(declarator, declaration, declaration, [renamedIdentifier])

        expect(isPatternPropertyUsed(prop, declarator, fileInfo)).toBe(true)
    })
})

describe("isPatternElementUsed", () => {
    it("returns true when element is used", async () => {
        const module = await parseSource("const [a, b] = arr", "test.ts")
        const declaration = module.ast.body[0] as SWC.VariableDeclaration
        const declarator = declaration.declarations[0]
        assert(declarator, "Expected declarator")
        const pattern = declarator.id as SWC.ArrayPattern
        const aElem = pattern.elements[0]
        assert(aElem, "Expected element")
        const aIdentifier = getIdentifierFromPattern(pattern, "a")

        const fileInfo = createMockFileInfo(declarator, declaration, declaration, [aIdentifier])

        expect(isPatternElementUsed(aElem, declarator, fileInfo)).toBe(true)
    })

    it("returns false when element is not used", async () => {
        const module = await parseSource("const [a, b] = arr", "test.ts")
        const declaration = module.ast.body[0] as SWC.VariableDeclaration
        const declarator = declaration.declarations[0]
        assert(declarator, "Expected declarator")
        const pattern = declarator.id as SWC.ArrayPattern
        const aElem = pattern.elements[0]
        assert(aElem, "Expected element")
        const bIdentifier = getIdentifierFromPattern(pattern, "b")

        // Only b is used, checking if a is used
        const fileInfo = createMockFileInfo(declarator, declaration, declaration, [bIdentifier])

        expect(isPatternElementUsed(aElem, declarator, fileInfo)).toBe(false)
    })

    it("returns true when nested element is used", async () => {
        const module = await parseSource("const [[nested]] = arr", "test.ts")
        const declaration = module.ast.body[0] as SWC.VariableDeclaration
        const declarator = declaration.declarations[0]
        assert(declarator, "Expected declarator")
        const pattern = declarator.id as SWC.ArrayPattern
        const outerElem = pattern.elements[0]
        assert(outerElem, "Expected element")
        const nestedIdentifier = getIdentifierFromPattern(pattern, "nested")

        const fileInfo = createMockFileInfo(declarator, declaration, declaration, [nestedIdentifier])

        expect(isPatternElementUsed(outerElem, declarator, fileInfo)).toBe(true)
    })
})

describe("pruneUnusedPatternParts", () => {
    describe("simple identifiers", () => {
        it("returns declarator as-is when identifier is used", async () => {
            const module = await parseSource("const x = 5", "test.ts")
            const declaration = module.ast.body[0] as SWC.VariableDeclaration
            const declarator = declaration.declarations[0]
            assert(declarator, "Expected declarator to be defined")
            const identifier = declarator.id as SWC.Identifier

            const fileInfo = createMockFileInfo(declarator, declaration, declaration, [identifier])
            const result = pruneUnusedPatternParts(declarator, fileInfo)

            expect(result).toBe(declarator)
        })

        it("returns null when identifier is not used", async () => {
            const module = await parseSource("const x = 5", "test.ts")
            const declaration = module.ast.body[0] as SWC.VariableDeclaration
            const declarator = declaration.declarations[0]
            assert(declarator, "Expected declarator to be defined")

            const fileInfo = createMockFileInfo(declarator, declaration, declaration, [])
            const result = pruneUnusedPatternParts(declarator, fileInfo)

            expect(result).toBeNull()
        })
    })

    describe("object patterns", () => {
        it("keeps only used properties", async () => {
            // const { a, b, c } = obj - only 'b' is used
            const module = await parseSource("const { a, b, c } = obj", "test.ts")
            const declaration = module.ast.body[0] as SWC.VariableDeclaration
            const declarator = declaration.declarations[0]
            assert(declarator, "Expected declarator to be defined")
            const pattern = declarator.id as SWC.ObjectPattern
            const bIdentifier = getIdentifierFromPattern(pattern, "b")

            const fileInfo = createMockFileInfo(declarator, declaration, declaration, [bIdentifier])
            const result = pruneUnusedPatternParts(declarator, fileInfo)

            assert(result, "Expected result to be defined")
            const resultPattern = result.id as SWC.ObjectPattern
            expect(resultPattern.properties).toHaveLength(1)
        })

        it("returns null when no properties are used", async () => {
            const module = await parseSource("const { a, b } = obj", "test.ts")
            const declaration = module.ast.body[0] as SWC.VariableDeclaration
            const declarator = declaration.declarations[0]
            assert(declarator, "Expected declarator to be defined")

            const fileInfo = createMockFileInfo(declarator, declaration, declaration, [])
            const result = pruneUnusedPatternParts(declarator, fileInfo)

            expect(result).toBeNull()
        })

        it("keeps multiple used properties", async () => {
            // const { a, b, c, d } = obj - 'a' and 'd' are used
            const module = await parseSource("const { a, b, c, d } = obj", "test.ts")
            const declaration = module.ast.body[0] as SWC.VariableDeclaration
            const declarator = declaration.declarations[0]
            assert(declarator, "Expected declarator to be defined")
            const pattern = declarator.id as SWC.ObjectPattern
            const aIdentifier = getIdentifierFromPattern(pattern, "a")
            const dIdentifier = getIdentifierFromPattern(pattern, "d")

            const fileInfo = createMockFileInfo(declarator, declaration, declaration, [aIdentifier, dIdentifier])
            const result = pruneUnusedPatternParts(declarator, fileInfo)

            assert(result, "Expected result to be defined")
            const resultPattern = result.id as SWC.ObjectPattern
            expect(resultPattern.properties).toHaveLength(2)
        })

        it("keeps rest element when used", async () => {
            // const { a, ...rest } = obj - only 'rest' is used
            const module = await parseSource("const { a, ...rest } = obj", "test.ts")
            const declaration = module.ast.body[0] as SWC.VariableDeclaration
            const declarator = declaration.declarations[0]
            assert(declarator, "Expected declarator to be defined")
            const pattern = declarator.id as SWC.ObjectPattern
            const restIdentifier = getIdentifierFromPattern(pattern, "rest")

            const fileInfo = createMockFileInfo(declarator, declaration, declaration, [restIdentifier])
            const result = pruneUnusedPatternParts(declarator, fileInfo)

            assert(result, "Expected result to be defined")
            const resultPattern = result.id as SWC.ObjectPattern
            expect(resultPattern.properties).toHaveLength(1)
            const firstProp = resultPattern.properties[0]
            assert(firstProp, "Expected first property to be defined")
            expect(firstProp.type).toBe("RestElement")
        })
    })

    describe("array patterns", () => {
        it("preserves holes for unused elements to maintain indices", async () => {
            // const [a, b, c] = arr - only 'c' is used (index 2)
            // Result should be [undefined, undefined, c] to preserve index
            const module = await parseSource("const [a, b, c] = arr", "test.ts")
            const declaration = module.ast.body[0] as SWC.VariableDeclaration
            const declarator = declaration.declarations[0]
            assert(declarator, "Expected declarator to be defined")
            const pattern = declarator.id as SWC.ArrayPattern
            const cIdentifier = getIdentifierFromPattern(pattern, "c")

            const fileInfo = createMockFileInfo(declarator, declaration, declaration, [cIdentifier])
            const result = pruneUnusedPatternParts(declarator, fileInfo)

            assert(result, "Expected result to be defined")
            const resultPattern = result.id as SWC.ArrayPattern
            // Should have 3 elements: [undefined, undefined, c]
            expect(resultPattern.elements).toHaveLength(3)
            expect(resultPattern.elements[0]).toBeUndefined()
            expect(resultPattern.elements[1]).toBeUndefined()
            expect(resultPattern.elements[2]).toBeDefined()
        })

        it("trims trailing unused elements", async () => {
            // const [a, b, c] = arr - only 'a' is used (index 0)
            // Result should be [a] - no need to keep trailing holes
            const module = await parseSource("const [a, b, c] = arr", "test.ts")
            const declaration = module.ast.body[0] as SWC.VariableDeclaration
            const declarator = declaration.declarations[0]
            assert(declarator, "Expected declarator to be defined")
            const pattern = declarator.id as SWC.ArrayPattern
            const aIdentifier = getIdentifierFromPattern(pattern, "a")

            const fileInfo = createMockFileInfo(declarator, declaration, declaration, [aIdentifier])
            const result = pruneUnusedPatternParts(declarator, fileInfo)

            assert(result, "Expected result to be defined")
            const resultPattern = result.id as SWC.ArrayPattern
            expect(resultPattern.elements).toHaveLength(1)
        })

        it("returns null when no elements are used", async () => {
            const module = await parseSource("const [a, b] = arr", "test.ts")
            const declaration = module.ast.body[0] as SWC.VariableDeclaration
            const declarator = declaration.declarations[0]
            assert(declarator, "Expected declarator to be defined")

            const fileInfo = createMockFileInfo(declarator, declaration, declaration, [])
            const result = pruneUnusedPatternParts(declarator, fileInfo)

            expect(result).toBeNull()
        })

        it("keeps multiple used elements with holes between them", async () => {
            // const [a, b, c, d] = arr - 'a' and 'd' are used
            // Result should be [a, undefined, undefined, d]
            const module = await parseSource("const [a, b, c, d] = arr", "test.ts")
            const declaration = module.ast.body[0] as SWC.VariableDeclaration
            const declarator = declaration.declarations[0]
            assert(declarator, "Expected declarator to be defined")
            const pattern = declarator.id as SWC.ArrayPattern
            const aIdentifier = getIdentifierFromPattern(pattern, "a")
            const dIdentifier = getIdentifierFromPattern(pattern, "d")

            const fileInfo = createMockFileInfo(declarator, declaration, declaration, [aIdentifier, dIdentifier])
            const result = pruneUnusedPatternParts(declarator, fileInfo)

            assert(result, "Expected result to be defined")
            const resultPattern = result.id as SWC.ArrayPattern
            expect(resultPattern.elements).toHaveLength(4)
            expect(resultPattern.elements[0]).toBeDefined() // a
            expect(resultPattern.elements[1]).toBeUndefined() // hole
            expect(resultPattern.elements[2]).toBeUndefined() // hole
            expect(resultPattern.elements[3]).toBeDefined() // d
        })

        it("handles nested destructuring with partial use", async () => {
            // const [{ a }, b] = arr - only 'a' is used
            const module = await parseSource("const [{ a }, b] = arr", "test.ts")
            const declaration = module.ast.body[0] as SWC.VariableDeclaration
            const declarator = declaration.declarations[0]
            assert(declarator, "Expected declarator to be defined")
            const pattern = declarator.id as SWC.ArrayPattern
            const aIdentifier = getIdentifierFromPattern(pattern, "a")

            const fileInfo = createMockFileInfo(declarator, declaration, declaration, [aIdentifier])
            const result = pruneUnusedPatternParts(declarator, fileInfo)

            assert(result, "Expected result to be defined")
            const resultPattern = result.id as SWC.ArrayPattern
            // Should keep first element (the object pattern), trim trailing 'b'
            expect(resultPattern.elements).toHaveLength(1)
            expect(resultPattern.elements[0]).toBeDefined()
        })
    })
})

describe("generateMinimalModuleItem", () => {
    describe("import declarations", () => {
        it("keeps only used import specifiers", async () => {
            // import { a, b, c } from 'module' - only 'b' is used
            const module = await parseSource("import { a, b, c } from 'module'", "test.ts")
            const importDecl = module.ast.body[0] as SWC.ImportDeclaration
            const bSpecifier = importDecl.specifiers[1]
            assert(bSpecifier, "Expected bSpecifier to be defined")

            const usedBindings = new Set<BindingInfo>([{
                identifier: bSpecifier.local,
                ref: { name: bSpecifier.local.value, id: bSpecifier.local.ctxt },
                declarator: { type: 'import', specifier: bSpecifier as SWC.ImportSpecifier, declaration: importDecl },
                moduleItem: importDecl
            }])

            const fileInfo: FileInfo = {
                ...createEmptyFileInfo(module.ast),
                usedBindings
            }

            const result = generateMinimalModuleItem(importDecl, fileInfo)

            assert(result, "Expected result to be defined")
            const resultImport = result as SWC.ImportDeclaration
            expect(resultImport.specifiers).toHaveLength(1)
            const firstSpecifier = resultImport.specifiers[0]
            assert(firstSpecifier, "Expected first specifier to be defined")
            expect(firstSpecifier.local.value).toBe("b")
        })

        it("returns null when no specifiers are used", async () => {
            const module = await parseSource("import { a, b } from 'module'", "test.ts")
            const importDecl = module.ast.body[0] as SWC.ImportDeclaration

            const fileInfo = createEmptyFileInfo(module.ast)

            const result = generateMinimalModuleItem(importDecl, fileInfo)

            expect(result).toBeNull()
        })

        it("keeps default import when used", async () => {
            // import foo from 'module'
            const module = await parseSource("import foo from 'module'", "test.ts")
            const importDecl = module.ast.body[0] as SWC.ImportDeclaration
            const defaultSpecifier = importDecl.specifiers[0]
            assert(defaultSpecifier, "Expected defaultSpecifier to be defined")

            const usedBindings = new Set<BindingInfo>([{
                identifier: defaultSpecifier.local,
                ref: { name: defaultSpecifier.local.value, id: defaultSpecifier.local.ctxt },
                declarator: { type: 'import', specifier: defaultSpecifier as SWC.ImportDefaultSpecifier, declaration: importDecl },
                moduleItem: importDecl
            }])

            const fileInfo: FileInfo = {
                ...createEmptyFileInfo(module.ast),
                usedBindings
            }

            const result = generateMinimalModuleItem(importDecl, fileInfo)

            assert(result, "Expected result to be defined")
            const resultImport = result as SWC.ImportDeclaration
            expect(resultImport.specifiers).toHaveLength(1)
        })

        it("keeps namespace import when used", async () => {
            // import * as foo from 'module'
            const module = await parseSource("import * as foo from 'module'", "test.ts")
            const importDecl = module.ast.body[0] as SWC.ImportDeclaration
            const namespaceSpecifier = importDecl.specifiers[0]
            assert(namespaceSpecifier, "Expected namespaceSpecifier to be defined")

            const usedBindings = new Set<BindingInfo>([{
                identifier: namespaceSpecifier.local,
                ref: { name: namespaceSpecifier.local.value, id: namespaceSpecifier.local.ctxt },
                declarator: { type: 'import', specifier: namespaceSpecifier as SWC.ImportNamespaceSpecifier, declaration: importDecl },
                moduleItem: importDecl
            }])

            const fileInfo: FileInfo = {
                ...createEmptyFileInfo(module.ast),
                usedBindings
            }

            const result = generateMinimalModuleItem(importDecl, fileInfo)

            assert(result, "Expected result to be defined")
            const resultImport = result as SWC.ImportDeclaration
            expect(resultImport.specifiers).toHaveLength(1)
            expect(resultImport.specifiers[0]?.type).toBe("ImportNamespaceSpecifier")
        })

        it("keeps only used specifiers from mixed import", async () => {
            // import foo, { bar, baz } from 'module' - only 'bar' is used
            const module = await parseSource("import foo, { bar, baz } from 'module'", "test.ts")
            const importDecl = module.ast.body[0] as SWC.ImportDeclaration
            const barSpecifier = importDecl.specifiers[1]
            assert(barSpecifier, "Expected barSpecifier to be defined")

            const usedBindings = new Set<BindingInfo>([{
                identifier: barSpecifier.local,
                ref: { name: barSpecifier.local.value, id: barSpecifier.local.ctxt },
                declarator: { type: 'import', specifier: barSpecifier as SWC.ImportSpecifier, declaration: importDecl },
                moduleItem: importDecl
            }])

            const fileInfo: FileInfo = {
                ...createEmptyFileInfo(module.ast),
                usedBindings
            }

            const result = generateMinimalModuleItem(importDecl, fileInfo)

            assert(result, "Expected result to be defined")
            const resultImport = result as SWC.ImportDeclaration
            expect(resultImport.specifiers).toHaveLength(1)
            expect(resultImport.specifiers[0]?.local.value).toBe("bar")
        })
    })

    describe("variable declarations", () => {
        it("keeps only used declarators", async () => {
            // const a = 1, b = 2, c = 3 - only 'b' is used
            const module = await parseSource("const a = 1, b = 2, c = 3", "test.ts")
            const varDecl = module.ast.body[0] as SWC.VariableDeclaration
            const bDeclarator = varDecl.declarations[1]
            assert(bDeclarator, "Expected bDeclarator to be defined")
            const bIdentifier = bDeclarator.id as SWC.Identifier

            const usedBindings = new Set<BindingInfo>([{
                identifier: bIdentifier,
                ref: { name: bIdentifier.value, id: bIdentifier.ctxt },
                declarator: { type: 'variable', declarator: bDeclarator, declaration: varDecl },
                moduleItem: varDecl
            }])

            const fileInfo: FileInfo = {
                ...createEmptyFileInfo(module.ast),
                usedBindings
            }

            const result = generateMinimalModuleItem(varDecl, fileInfo)

            assert(result, "Expected result to be defined")
            const resultDecl = result as SWC.VariableDeclaration
            expect(resultDecl.declarations).toHaveLength(1)
            const firstDeclarator = resultDecl.declarations[0]
            assert(firstDeclarator, "Expected first declarator to be defined")
            expect((firstDeclarator.id as SWC.Identifier).value).toBe("b")
        })

        it("returns null when no declarators are used", async () => {
            const module = await parseSource("const a = 1, b = 2", "test.ts")
            const varDecl = module.ast.body[0] as SWC.VariableDeclaration

            const fileInfo = createEmptyFileInfo(module.ast)

            const result = generateMinimalModuleItem(varDecl, fileInfo)

            expect(result).toBeNull()
        })
    })

    describe("function declarations", () => {
        it("returns function declaration as-is (functions are atomic)", async () => {
            const module = await parseSource("function foo() { return 1 }", "test.ts")
            const fnDecl = module.ast.body[0] as SWC.FunctionDeclaration

            // Even with empty used bindings, function should be returned as-is
            // because generateMinimalModuleItem treats non-import/non-variable items as atomic
            const fileInfo = createEmptyFileInfo(module.ast)

            const result = generateMinimalModuleItem(fnDecl, fileInfo)

            expect(result).toBe(fnDecl)
        })
    })

    describe("class declarations", () => {
        it("returns class declaration as-is (classes are atomic)", async () => {
            const module = await parseSource("class Foo { bar() {} }", "test.ts")
            const classDecl = module.ast.body[0] as SWC.ClassDeclaration

            const fileInfo = createEmptyFileInfo(module.ast)

            const result = generateMinimalModuleItem(classDecl, fileInfo)

            expect(result).toBe(classDecl)
        })
    })

    describe("export declarations", () => {
        it("prunes unused declarators from exported variable declarations", async () => {
            // export const a = 1, b = 2 - only 'b' is used
            const module = await parseSource("export const a = 1, b = 2", "test.ts")
            const exportDecl = module.ast.body[0] as SWC.ExportDeclaration
            const varDecl = exportDecl.declaration as SWC.VariableDeclaration
            const bDeclarator = varDecl.declarations[1]
            assert(bDeclarator, "Expected bDeclarator to be defined")
            const bIdentifier = bDeclarator.id as SWC.Identifier

            const usedBindings = new Set<BindingInfo>([{
                identifier: bIdentifier,
                ref: { name: bIdentifier.value, id: bIdentifier.ctxt },
                declarator: { type: 'variable', declarator: bDeclarator, declaration: varDecl },
                moduleItem: exportDecl
            }])

            const fileInfo: FileInfo = {
                ...createEmptyFileInfo(module.ast),
                usedBindings
            }

            const result = generateMinimalModuleItem(exportDecl, fileInfo)

            assert(result, "Expected result to be defined")
            const resultExport = result as SWC.ExportDeclaration
            const resultVarDecl = resultExport.declaration as SWC.VariableDeclaration
            expect(resultVarDecl.declarations).toHaveLength(1)
            const firstDeclarator = resultVarDecl.declarations[0]
            assert(firstDeclarator, "Expected first declarator to be defined")
            expect((firstDeclarator.id as SWC.Identifier).value).toBe("b")
        })

        it("returns exported function as-is", async () => {
            const module = await parseSource("export function foo() {}", "test.ts")
            const exportDecl = module.ast.body[0] as SWC.ExportDeclaration

            const fileInfo = createEmptyFileInfo(module.ast)

            const result = generateMinimalModuleItem(exportDecl, fileInfo)

            expect(result).toBe(exportDecl)
        })

        it("returns exported class as-is", async () => {
            const module = await parseSource("export class Foo {}", "test.ts")
            const exportDecl = module.ast.body[0] as SWC.ExportDeclaration

            const fileInfo = createEmptyFileInfo(module.ast)

            const result = generateMinimalModuleItem(exportDecl, fileInfo)

            expect(result).toBe(exportDecl)
        })

        it("returns null when no exported variable declarators are used", async () => {
            const module = await parseSource("export const a = 1, b = 2", "test.ts")
            const exportDecl = module.ast.body[0] as SWC.ExportDeclaration

            const fileInfo = createEmptyFileInfo(module.ast)

            const result = generateMinimalModuleItem(exportDecl, fileInfo)

            expect(result).toBeNull()
        })

        it("handles export default function as-is", async () => {
            const module = await parseSource("export default function foo() {}", "test.ts")
            const exportDecl = module.ast.body[0] as SWC.ExportDefaultDeclaration

            const fileInfo = createEmptyFileInfo(module.ast)

            // ExportDefaultDeclaration is not ExportDeclaration, so it should be returned as-is
            const result = generateMinimalModuleItem(exportDecl, fileInfo)

            expect(result).toBe(exportDecl)
        })
    })
})
