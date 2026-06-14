// Public interfaces

import * as SWC from "@swc/core"
import { CellStorage, Cell, SimpleCell, FixpointCell, VariableCell } from "./CellStorage"

/** A handle to a lazily computed, dependency-tracked value. */
export type Cached<T> = {
    /** Returns the current value, recomputing it if the cell is stale. */
    get(): T
    /** Marks this value and all downstream dependants as stale. */
    invalidate(): void
}

/** A dependency-tracked signal with no value; useful for triggering invalidation. */
export type Signal = Cached<void>

/** The parsed source file data stored in `CacheEngine.fileData`. */
export type FileInfo = {
    /** Path to the source file. */
    filePath: string
    /** Parsed SWC module AST. */
    ast: SWC.Module
}

/** A cache keyed by the file path. */
export type FileCache<T> = {
    /** Returns the `Cached` handle for the given file, creating one if needed. */
    for(filePath: string): Cached<T>
}

/** A cache keyed by AST node identity (via `WeakMap`). */
export type NodeCache<N extends object, T> = {
    /** Returns the `Cached` handle for the given node, creating one if needed. */
    for(node: N): Cached<T>
}

/** A single project-level cached value. */
export type ProjectCache<T> = Cached<T>

/**
 * A writable, file-keyed input that feeds downstream caches.
 *
 * Calling `set` stores a new value and propagates invalidation to all
 * derived caches that declared this input as a dependency.
 */
export type FileInput<T> = {
    /** Returns the `Cached` handle for the given file. */
    for(filePath: string): Cached<T>
    /** Stores a value for the given file and invalidates downstream caches. */
    set(filePath: string, value: T): void
    /** Invalidates the cached value for the given file without storing a new one. */
    invalidate(filePath: string): void
}

/**
 * A writable project-level cached value.
 * @typeParam T - type of the stored value.
 */
export interface ProjectInput<T> extends Cached<T> {
    /** Stores a new value and invalidates all dependants. */
    set(value: T): void
}

/**
 * Read-only view of the cache engine exposed to analysis stages.
 *
 * Stages call the factory methods to create their derived caches; they cannot
 * write source data directly (use `CacheEngine` for that).
 */
export interface CacheRegistry {
    /** Returns the list of source file paths registered with the engine. */
    getFilePaths(): string[]
    /** Parsed AST and path for every registered source file. */
    fileData: FileCache<FileInfo>
    /** Creates a writable per-file input that derived caches can declare as a dependency. */
    fileInput<T>(): FileInput<T>
    /** Project-level input that derived caches can declare as a dependency. */
    projectInput<T>(value: T): ProjectInput<T>
    /**
     * Creates a derived cache whose entries are computed per file.
     *
     * @param deps - returns the `Cached` values this file's result depends on;
     *   when any of them is invalidated the derived entry is also invalidated
     * @param compute - pure function that produces the value for a given file
     */
    fileCache<T>(deps: (filePath: string) => Cached<unknown>[], compute: (filePath: string) => T): FileCache<T>
    /**
     * Creates a derived cache whose entries are computed per AST node.
     *
     * Node identity is tracked via a `WeakMap`, so entries are GC'd together
     * with the nodes they belong to.
     *
     * @param deps - returns the `Cached` values this node's result depends on
     * @param compute - pure function that produces the value for a given node
     */
    nodeCache<N extends object, T>(deps: (node: N) => Cached<unknown>[], compute: (node: N) => T): NodeCache<N, T>
    /**
     * Creates a single derived value that spans the whole project.
     *
     * The value is recomputed to a fixpoint: if any dependency is invalidated
     * during `compute`, the function runs again until the result stabilizes.
     *
     * @param deps - returns the `Cached` values this result depends on
     * @param compute - pure function that produces the project-wide value
     */
    projectCache<T>(deps: () => Cached<unknown>[], compute: () => T): ProjectCache<T>
    /** Creates a new {@link Signal} that can be used to trigger invalidation of dependants. */
    signal(): Signal
}

/** Concrete implementation of {@link CacheRegistry}. */
export class CacheEngine implements CacheRegistry {
    private readonly cellStorage = new CellStorage<Cached<unknown>>()
    private readonly nodeSlots = new WeakMap<object, Map<symbol, Cached<unknown>>>()

    /** File data entrypoint for the analysis engine. */
    public readonly fileData: FileInput<FileInfo>

    /** @param filePaths - source files to register with the engine. */
    constructor(private readonly filePaths: string[]) {
        this.fileData = this.makeFileInput<FileInfo>()
    }

    public getFilePaths(): string[] {
        return this.filePaths
    }

    public fileInput<T>(): FileInput<T> {
        return this.makeFileInput<T>()
    }

    public projectInput<T>(value: T): ProjectInput<T> {
        const cell = new VariableCell(value)
        const cached: ProjectInput<T> & Cached<T> = {
            get(): T {
                return cell.value
            },
            set(value: T): void {
                cell.value = value
            },
            invalidate(): void {
                cell.invalidate()
            },
        }

        this.cellStorage.register(cached, cell)

        return cached
    }

    public fileCache<T>(deps: (filePath: string) => Cached<unknown>[], compute: (filePath: string) => T): FileCache<T> {
        const caches = new Map<string, Cached<T>>()
        const makeCached = this.makeCached.bind(this)<T>

        return {
            for(filePath: string): Cached<T> {
                const existing = caches.get(filePath)
                if (existing) return existing

                const cached = makeCached(() => compute(filePath), deps(filePath))
                caches.set(filePath, cached)
                return cached
            },
        }
    }

    public nodeCache<N extends object, T>(
        deps: (node: N) => Cached<unknown>[],
        compute: (node: N) => T,
    ): NodeCache<N, T> {
        const key = Symbol()

        const nodeSlots = this.nodeSlots
        const makeCached = this.makeCached.bind(this)<T>

        return {
            for(node: N): Cached<T> {
                let slots = nodeSlots.get(node)
                if (!slots) {
                    slots = new Map<symbol, Cached<unknown>>()
                    nodeSlots.set(node, slots)
                }
                const existingCached = slots.get(key)
                if (existingCached) return existingCached as Cached<T>

                const cached = makeCached(() => compute(node), deps(node))
                slots.set(key, cached)
                return cached
            },
        }
    }

    public projectCache<T>(deps: () => Cached<unknown>[], compute: () => T): ProjectCache<T> {
        return this.wrapCellWithCached(new FixpointCell(compute), deps())
    }

    public signal(): Signal {
        return this.makeCached<void>(() => undefined)
    }

    private wrapCellWithCached<T>(cell: Cell<T>, deps?: Cached<unknown>[]): Cached<T> {
        const cached: Cached<T> = {
            get(): T {
                return cell.value
            },
            invalidate(): void {
                cell.invalidate()
            },
        }
        this.cellStorage.register(cached, cell)
        if (deps)
            deps.forEach((dep) => {
                this.cellStorage.addDependency(cached, dep)
            })
        return cached
    }

    private makeCached<T>(computeFn: () => T, deps?: Cached<unknown>[]): Cached<T> {
        const cell = new SimpleCell<T>(computeFn)
        return this.wrapCellWithCached(cell, deps)
    }

    private makeFileInput<V>(): FileInput<V> {
        const store = new Map<string, V>()
        const cells = new Map<string, { cell: Cell<V>; cached: Cached<V> }>()

        const wrapCellWithCached = this.wrapCellWithCached.bind(this)<V>

        function getOrCreateEntry(key: string): { cell: Cell<V>; cached: Cached<V> } {
            const existing = cells.get(key)
            if (existing) return existing
            const cell = new SimpleCell<V>(() => {
                const val = store.get(key)
                if (val === undefined) throw new Error(`Entry for key ${key} not initialized`)
                return val
            })
            const entry = { cell, cached: wrapCellWithCached(cell) }
            cells.set(key, entry)
            return entry
        }

        return {
            for(key: string): Cached<V> {
                return getOrCreateEntry(key).cached
            },
            set(key: string, value: V): void {
                store.set(key, value)
                getOrCreateEntry(key).cell.invalidate()
            },
            invalidate(key: string): void {
                getOrCreateEntry(key).cell.invalidate()
            },
        }
    }
}

/**
 * Creates a `CacheEngine` for the given set of source files.
 *
 * The engine is the root of the reactive cache graph: the builder pushes
 * parsed ASTs via `fileData`, and analysis stages derive their results from
 * it using `fileCache`, `nodeCache`, and `projectCache`.
 *
 * @param filePaths - the source files to register with the engine
 * @returns a fully initialized `CacheEngine`
 */
export function createCacheEngine(filePaths: string[]) {
    return new CacheEngine(filePaths)
}
