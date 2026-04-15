import * as SWC from "@swc/core"
import type { Ref } from "./helpers"

export type { Ref }

/** A parsed source file together with its path on disk. */
export type Module = {
    ast: SWC.Module
    filePath: string
}

/** A single import specifier resolved to its `Ref` and originating module path. */
export interface ImportSpec {
    /** The local binding that receives the imported value. */
    ref: Ref
    /** The name as exported by the source module (`default` for default imports). */
    sourceName: string
    /** Whether this is a namespace import (`import * as ns`). */
    isNamespace: boolean
    /** The module specifier string from the import declaration. */
    source: string
}

/** The AST node(s) that introduce a binding, discriminated by declaration kind. */
export type BindingDeclarator =
    | { type: "variable"; declarator: SWC.VariableDeclarator; declaration: SWC.VariableDeclaration }
    | { type: "function"; declaration: SWC.FunctionDeclaration }
    | { type: "class"; declaration: SWC.ClassDeclaration }
    | {
          type: "import"
          specifier: SWC.ImportSpecifier | SWC.ImportDefaultSpecifier
          declaration: SWC.ImportDeclaration
      }

/** Full information about a named binding within a module. */
export interface BindingInfo {
    /** The identifier node for this binding. */
    identifier: SWC.Identifier
    /** Unique reference used to look up this binding across the analysis pipeline. */
    ref: Ref
    /** The declaration that introduces this binding. */
    declarator: BindingDeclarator
    /** The top-level module item containing this binding. */
    moduleItem: SWC.ModuleItem
}

/** A cross-file import resolved to an absolute source path and export name. */
export interface LocalImport {
    /** Ref of the local binding that receives the imported value. */
    localRef: Ref
    /** Resolved, absolute path to the imported source file. */
    sourcePath: string
    /** Original export name from the imported module. */
    exportName: string
}

/** Resolves an import source string to an absolute file path, or `null` if unresolvable. */
export type ResolveImport = (fromFile: string, importSource: string) => string | null

/**
 * Two-level map keyed by `Ref` (name and numeric SWC context id).
 *
 * @template T - type of values stored in the map
 * @remark Provides O(1) lookup for per-binding data across the analysis pipeline.
 */
// noinspection JSUnusedGlobalSymbols
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
