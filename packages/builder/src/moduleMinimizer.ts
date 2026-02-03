import * as SWC from "@swc/core";
import {FileInfo} from "@/ProjectIndex";

/**
 * Checks if a pattern (destructuring) contains a specific identifier.
 */
export function patternContainsIdentifier(pattern: SWC.Pattern, identifier: SWC.Identifier): boolean {
    switch (pattern.type) {
        case "Identifier":
            return pattern === identifier
        case "ObjectPattern":
            return pattern.properties.some(prop => {
                switch (prop.type) {
                    case "AssignmentPatternProperty":
                        return prop.key === identifier
                    case "KeyValuePatternProperty":
                        return patternContainsIdentifier(prop.value, identifier)
                    case "RestElement":
                        return patternContainsIdentifier(prop.argument, identifier)
                    default:
                        return false
                }
            })
        case 'ArrayPattern':
            return pattern.elements.some(elem => elem && patternContainsIdentifier(elem, identifier))
        case 'RestElement':
            return patternContainsIdentifier(pattern.argument, identifier)
        case 'AssignmentPattern':
            return patternContainsIdentifier(pattern.left, identifier)
        default:
            return false
    }
}

/**
 * Checks if an object pattern property is used by any binding in the file.
 */
export function isPatternPropertyUsed(prop: SWC.ObjectPatternProperty, declarator: SWC.VariableDeclarator, info: FileInfo): boolean {
    for (const binding of info.usedBindings) {
        if (binding.declarator.type !== 'variable') continue
        if (binding.declarator.declarator !== declarator) continue

        // Check if this binding's identifier is within this property
        if (prop.type === 'AssignmentPatternProperty' && binding.identifier === prop.key) return true
        if (prop.type === 'KeyValuePatternProperty' && patternContainsIdentifier(prop.value, binding.identifier)) return true
        if (prop.type === 'RestElement' && patternContainsIdentifier(prop.argument, binding.identifier)) return true
    }
    return false
}

/**
 * Checks if an array pattern element is used by any binding in the file.
 */
export function isPatternElementUsed(elem: SWC.Pattern, declarator: SWC.VariableDeclarator, info: FileInfo): boolean {
    for (const binding of info.usedBindings) {
        if (binding.declarator.type !== 'variable') continue
        if (binding.declarator.declarator !== declarator) continue

        if (patternContainsIdentifier(elem, binding.identifier)) return true
    }
    return false
}

/**
 * Prunes unused parts from destructuring patterns in a variable declarator.
 */
export function pruneUnusedPatternParts(declarator: SWC.VariableDeclarator, info: FileInfo): SWC.VariableDeclarator | null {
    // Check if any binding from this declarator is used
    const hasUsedBinding = [...info.usedBindings].some(binding =>
        binding.declarator.type === 'variable' &&
        binding.declarator.declarator === declarator
    )

    if (!hasUsedBinding) return null

    switch (declarator.id.type) {
        // For simple identifiers, return as-is
        case "Identifier":
            return declarator
        // For object patterns, prune unused properties
        case "ObjectPattern": {
            const usedProperties = declarator.id.properties.filter(prop => {
                return isPatternPropertyUsed(prop, declarator, info)
            })

            if (usedProperties.length === 0) return null

            return {
                ...declarator,
                id: {
                    ...declarator.id,
                    properties: usedProperties
                }
            }
        }
        // For array patterns, prune unused elements (but keep holes for indices)
        case "ArrayPattern": {
            let lastUsedIndex = -1
            const usedElements = declarator.id.elements.map((elem, index) => {
                if (!elem) return undefined
                if (isPatternElementUsed(elem, declarator, info)) {
                    lastUsedIndex = index
                    return elem
                }
                return undefined
            })

            // Trim trailing undefines
            const trimmedElements = usedElements.slice(0, lastUsedIndex + 1)
            if (trimmedElements.length === 0) return null

            return {
                ...declarator,
                id: {
                    ...declarator.id,
                    elements: trimmedElements
                }
            }
        }
        // For other patterns, return as-is
        default:
            return declarator
    }
}

/**
 * Generates a minimal version of a module item, keeping only used bindings.
 */
export function generateMinimalModuleItem(item: SWC.ModuleItem, info: FileInfo): SWC.ModuleItem | null {
    // For imports, generate minimal import declaration
    if (item.type === 'ImportDeclaration') {
        const usedSpecifiers = item.specifiers.filter(spec => {
            for (const binding of info.usedBindings) {
                if (binding.declarator.type === 'import' &&
                    binding.declarator.declaration === item &&
                    binding.identifier === spec.local) {
                    return true
                }
            }
            return false
        })

        if (usedSpecifiers.length === 0) return null

        return {
            ...item,
            specifiers: usedSpecifiers
        }
    }

    // For variable declarations, prune unused bindings from patterns
    if (item.type === 'VariableDeclaration') {
        const minimalDeclarators = item.declarations
            .map(declarator => pruneUnusedPatternParts(declarator, info))
            .filter((d): d is SWC.VariableDeclarator => d !== null)

        if (minimalDeclarators.length === 0) return null

        return {
            ...item,
            declarations: minimalDeclarators
        }
    }

    // For function/class declarations, include as-is
    if (item.type !== 'ExportDeclaration') {
        return item
    }

    // For export declarations, handle the inner declaration

    if (item.declaration.type === 'VariableDeclaration') {
        const minimalDeclarators = item.declaration.declarations
            .map(declarator => pruneUnusedPatternParts(declarator, info))
            .filter((d): d is SWC.VariableDeclarator => d !== null)

        if (minimalDeclarators.length === 0) return null

        return {
            ...item,
            declaration: {
                ...item.declaration,
                declarations: minimalDeclarators
            }
        }
    }
    // For function/class exports, include as-is if any binding is used
    return item
}
