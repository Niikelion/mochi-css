// Public interfaces

import * as SWC from "@swc/core"

/** A handle to a lazily computed, dependency-tracked value. */
export type Cached<T> = {
    /** Returns the current value, recomputing it if the cell is stale. */
    get(): T
    /** Marks this value and all downstream dependents as stale. */
    invalidate(): void
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
 * A writable project-level input that feeds downstream caches.
 *
 * Calling `set` stores a new value and propagates invalidation to all
 * derived caches that declared this input as a dependency.
 */
export type ProjectInput<T> = {
    /** The `Cached` handle backed by this input. */
    value: Cached<T>
    /** Stores a new value and invalidates downstream caches. */
    set(value: T): void
}

/** The parsed source file data stored in `CacheEngine.fileData`. */
export type FileInfo = {
    filePath: string
    ast: SWC.Module
}

/**
 * Read-only view of the cache engine exposed to analysis stages.
 *
 * Stages call the factory methods to create their derived caches; they cannot
 * write source data directly (use `CacheEngine` for that).
 */
export type CacheRegistry = {
    /** Returns the list of source file paths registered with the engine. */
    getFilePaths(): string[]
    /** Parsed AST and path for every registered source file. */
    fileData: FileCache<FileInfo>
    /**
     * Creates a new writable, file-keyed input slot.
     *
     * Use this when a stage needs to feed external data (e.g., resolved imports)
     * into the cache graph.
     */
    fileInput<T>(): FileInput<T>
    /**
     * Creates a new writable project-level input slot.
     *
     * Use this when a stage needs to feed a single project-wide value
     * (e.g., config) into the cache graph.
     */
    projectInput<T>(): ProjectInput<T>
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
}

/**
 * Full cache engine used by the builder to feed source data into the graph.
 *
 * Extends `CacheRegistry` by exposing `fileData` as a writable `FileInput`
 * so the builder can push parsed ASTs before analysis begins.
 */
export type CacheEngine = CacheRegistry & {
    fileData: FileInput<FileInfo>
}

// Internal cell type

/** Internal reactive node that holds a lazily computed value. */
type Cell<T> = {
    value: T | undefined
    stale: boolean
    readonly dependents: Set<Cell<unknown>>
    readonly computeFn: () => T
}

// Module-level WeakMap to resolve Cached<T> → Cell<T>
const cellRegistry = new WeakMap<object, Cell<unknown>>()

/** Creates a new stale cell backed by the given compute function. */
function createCell<T>(compute: () => T): Cell<T> {
    return {
        value: undefined,
        stale: true,
        dependents: new Set(),
        computeFn: compute,
    }
}

/**
 * Returns the cell's value, running `computeFn` first if the cell is stale.
 *
 * @param cell - the cell to read
 * @returns the up-to-date value
 */
function cellGet<T>(cell: Cell<T>): T {
    if (cell.stale) {
        cell.stale = false
        cell.value = cell.computeFn()
    }
    return cell.value as T
}

/**
 * Marks a cell and all of its transitive dependents as stale.
 *
 * Propagation stops early for cells that are already stale to avoid
 * redundant traversal in diamond-shaped dependency graphs.
 */
function cellInvalidate(cell: Cell<unknown>): void {
    if (cell.stale) return
    cell.stale = true
    for (const dep of cell.dependents) {
        cellInvalidate(dep)
    }
}

/**
 * Wraps a cell as a public `Cached<T>` handle and registers it in
 * `cellRegistry` so that `wireDepToCell` can resolve it back to its cell.
 *
 * @param cell - the cell to wrap
 * @returns a `Cached<T>` handle backed by `cell`
 */
function makeCached<T>(cell: Cell<T>): Cached<T> {
    const cached: Cached<T> = {
        get: () => cellGet(cell),
        invalidate: () => {
            cellInvalidate(cell)
        },
    }
    cellRegistry.set(cached, cell)
    return cached
}

/**
 * Registers `child` as a dependent of the cell-backing `dep` so that
 * invalidating `dep` also invalidates `child`.
 */
function wireDepToCell(child: Cell<unknown>, dep: Cached<unknown>): void {
    const depCell = cellRegistry.get(dep)
    if (depCell) {
        depCell.dependents.add(child)
    }
}

/**
 * Creates a standalone writable, file-keyed input.
 *
 * Cells are created lazily on first access and kept alive for the lifetime
 * of the input instance.
 *
 * @returns a new `FileInput<V>` instance
 */
function createFileInput<V>(): FileInput<V> {
    const store = new Map<string, V>()
    const cells = new Map<string, { cell: Cell<V>; cached: Cached<V> }>()

    function getOrCreateEntry(key: string): { cell: Cell<V>; cached: Cached<V> } {
        const existing = cells.get(key)
        if (existing) return existing
        const cell = createCell<V>(() => {
            const val = store.get(key)
            if (val === undefined) throw new Error(`Entry for key ${key} not initialized`)
            return val
        })
        const entry = { cell, cached: makeCached(cell) }
        cells.set(key, entry)
        return entry
    }

    return {
        for(key: string): Cached<V> {
            return getOrCreateEntry(key).cached
        },
        set(key: string, value: V): void {
            store.set(key, value)
            cellInvalidate(getOrCreateEntry(key).cell as Cell<unknown>)
        },
        invalidate(key: string): void {
            cellInvalidate(getOrCreateEntry(key).cell as Cell<unknown>)
        },
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
export function createCacheEngine(filePaths: string[]): CacheEngine {
    // node-level WeakMap: node → (symbol → Cell)
    const nodeSlots = new WeakMap<object, Map<symbol, Cell<unknown>>>()

    const fileData = createFileInput<FileInfo>()

    return {
        getFilePaths(): string[] {
            return filePaths
        },

        fileData,

        fileInput<T>(): FileInput<T> {
            return createFileInput<T>()
        },

        projectInput<T>(): ProjectInput<T> {
            let stored: { value: T } | undefined
            const cell = createCell<T>(() => {
                if (stored === undefined) throw new Error("Project input not initialized")
                return stored.value
            })
            const cached = makeCached(cell)
            return {
                value: cached,
                set(value: T): void {
                    stored = { value }
                    cellInvalidate(cell as Cell<unknown>)
                },
            }
        },

        fileCache<T>(deps: (filePath: string) => Cached<unknown>[], compute: (filePath: string) => T): FileCache<T> {
            const caches = new Map<string, Cached<T>>()

            return {
                for(filePath: string): Cached<T> {
                    const existing = caches.get(filePath)
                    if (existing) return existing
                    const cell = createCell<T>(() => compute(filePath))
                    for (const dep of deps(filePath)) {
                        wireDepToCell(cell as Cell<unknown>, dep)
                    }
                    const cached = makeCached(cell)
                    caches.set(filePath, cached)
                    return cached
                },
            }
        },

        nodeCache<N extends object, T>(deps: (node: N) => Cached<unknown>[], compute: (node: N) => T): NodeCache<N, T> {
            const key = Symbol()

            return {
                for(node: N): Cached<T> {
                    let slots = nodeSlots.get(node)
                    if (!slots) {
                        slots = new Map<symbol, Cell<unknown>>()
                        nodeSlots.set(node, slots)
                    }
                    const existingCell = slots.get(key)
                    if (existingCell) {
                        return makeCached(existingCell as Cell<T>)
                    }
                    const cell = createCell<T>(() => compute(node))
                    for (const dep of deps(node)) {
                        wireDepToCell(cell as Cell<unknown>, dep)
                    }
                    slots.set(key, cell as Cell<unknown>)
                    return makeCached(cell)
                },
            }
        },

        projectCache<T>(deps: () => Cached<unknown>[], compute: () => T): ProjectCache<T> {
            const cell = createCell<T>(() => {
                let result = compute()
                // Fixpoint: if this cell was re-invalidated during compute (by a dep being
                // invalidated from within compute()), recompute until stable.
                while (cell.stale) {
                    cell.stale = false
                    result = compute()
                }
                return result
            })
            for (const dep of deps()) {
                wireDepToCell(cell as Cell<unknown>, dep)
            }
            return makeCached(cell)
        },
    }
}
