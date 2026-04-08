import * as SWC from "@swc/core"
import type { Ref } from "./helpers"

export type { Ref }

export type Module = {
    ast: SWC.Module
    filePath: string
}

export interface ImportSpec {
    ref: Ref
    sourceName: string
    isNamespace: boolean
    source: string
}

// Binding information for precise tracking
export type BindingDeclarator =
    | { type: "variable"; declarator: SWC.VariableDeclarator; declaration: SWC.VariableDeclaration }
    | { type: "function"; declaration: SWC.FunctionDeclaration }
    | { type: "class"; declaration: SWC.ClassDeclaration }
    | {
          type: "import"
          specifier: SWC.ImportSpecifier | SWC.ImportDefaultSpecifier
          declaration: SWC.ImportDeclaration
      }

export interface BindingInfo {
    identifier: SWC.Identifier
    ref: Ref
    declarator: BindingDeclarator
    moduleItem: SWC.ModuleItem
}

export interface LocalImport {
    localRef: Ref
    sourcePath: string // resolved absolute path
    exportName: string // original export name
}

export type ResolveImport = (fromFile: string, importSource: string) => string | null

/**
 * Minimal view of per-file data needed for propagation and AST minimization.
 * The full FileInfo (with extractor-specific maps) lives in @mochi-css/plugins.
 */
export interface FileView {
    filePath: string
    ast: SWC.Module
    styleExpressions: Set<SWC.Expression>
    references: Set<SWC.Identifier>
    moduleBindings: RefMap<BindingInfo>
    localImports: RefMap<LocalImport>
    usedBindings: Set<BindingInfo>
    exports: Map<string, Ref>
}

export class RefMap<T> {
    private readonly data = new Map<string, Map<number, T>>()

    public set(ref: Ref, v: T): void {
        if (ref.id === undefined) return
        this.requireName(ref.name).set(ref.id, v)
    }
    public delete(ref: Ref): boolean {
        if (ref.id === undefined) return false
        const s = this.data.get(ref.name)
        if (s === undefined) return false
        const r = s.delete(ref.id)
        if (s.size === 0) this.data.delete(ref.name)
        return r
    }
    public has(ref: Ref): boolean {
        if (ref.id === undefined) return false
        return this.data.get(ref.name)?.has(ref.id) ?? false
    }
    public get(ref: Ref): T | undefined {
        if (ref.id === undefined) return undefined
        return this.data.get(ref.name)?.get(ref.id)
    }

    public get size(): number {
        let count = 0
        for (const map of this.data.values()) {
            count += map.size
        }
        return count
    }

    // Get by name only (returns first match) - useful for module-level lookups
    public getByName(name: string): T | undefined {
        const map = this.data.get(name)
        if (!map) return undefined
        return map.values().next().value
    }

    // Iterate all values
    public *values(): IterableIterator<T> {
        for (const map of this.data.values()) {
            yield* map.values()
        }
    }

    // Find a value matching a predicate
    public find(predicate: (value: T) => boolean): T | undefined {
        for (const value of this.values()) {
            if (predicate(value)) return value
        }
        return undefined
    }

    // Iterate all key-value pairs
    public *entries(): IterableIterator<[Ref, T]> {
        for (const [name, map] of this.data.entries()) {
            for (const [id, value] of map.entries()) {
                yield [{ name, id }, value]
            }
        }
    }

    private requireName(name: string): Map<number, T> {
        let s = this.data.get(name)
        if (s !== undefined) return s

        s = new Map<number, T>()
        this.data.set(name, s)
        return s
    }
}
