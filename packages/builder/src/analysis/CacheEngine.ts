// Public interfaces

export type Cached<T> = {
    get(): T
    invalidate(): void
}

export type FileCache<T> = {
    for(filePath: string): Cached<T>
}

export type NodeCache<N extends object, T> = {
    for(node: N): Cached<T>
}

export type ProjectCache<T> = Cached<T>

export type FileInput<T> = {
    cache: FileCache<T>
    set(filePath: string, value: T): void
    invalidate(filePath: string): void
}

export type CacheRegistry = {
    getFilePaths(): string[]
    fileInput<T>(): FileInput<T>
    fileCache<T>(deps: (filePath: string) => Cached<unknown>[], compute: (filePath: string) => T): FileCache<T>
    nodeCache<N extends object, T>(deps: (node: N) => Cached<unknown>[], compute: (node: N) => T): NodeCache<N, T>
    projectCache<T>(deps: () => Cached<unknown>[], compute: () => T): ProjectCache<T>
}

// Internal cell type
type Cell<T> = {
    value: T | undefined
    stale: boolean
    readonly dependents: Set<Cell<unknown>>
    readonly computeFn: () => T
}

// Module-level WeakMap to resolve Cached<T> → Cell<T>
const cellRegistry = new WeakMap<object, Cell<unknown>>()

function createCell<T>(compute: () => T): Cell<T> {
    return {
        value: undefined,
        stale: true,
        dependents: new Set(),
        computeFn: compute,
    }
}

function cellGet<T>(cell: Cell<T>): T {
    if (cell.stale) {
        cell.stale = false
        cell.value = cell.computeFn()
    }
    return cell.value as T
}

function cellInvalidate(cell: Cell<unknown>): void {
    if (cell.stale) return
    cell.stale = true
    for (const dep of cell.dependents) {
        cellInvalidate(dep)
    }
}

function makeCached<T>(cell: Cell<T>): Cached<T> {
    const cached: Cached<T> = {
        get: () => cellGet(cell),
        invalidate: () => {
            cellInvalidate(cell as Cell<unknown>)
        },
    }
    cellRegistry.set(cached as object, cell as Cell<unknown>)
    return cached
}

function wireDepToCell(child: Cell<unknown>, dep: Cached<unknown>): void {
    const depCell = cellRegistry.get(dep as object)
    if (depCell) {
        depCell.dependents.add(child)
    }
}

export function createCacheRegistry(filePaths: string[]): CacheRegistry {
    // node-level WeakMap: node → (symbol → Cell)
    const nodeSlots = new WeakMap<object, Map<symbol, Cell<unknown>>>()

    return {
        getFilePaths(): string[] {
            return filePaths
        },

        fileInput<T>(): FileInput<T> {
            const store = new Map<string, T>()
            const cells = new Map<string, { cell: Cell<T>; cached: Cached<T> }>()

            function getOrCreateEntry(filePath: string): { cell: Cell<T>; cached: Cached<T> } {
                const existing = cells.get(filePath)
                if (existing) return existing
                const cell = createCell<T>(() => {
                    const val = store.get(filePath)
                    if (val === undefined) throw new Error(`File input not initialized: ${filePath}`)
                    return val
                })
                const entry = { cell, cached: makeCached(cell) }
                cells.set(filePath, entry)
                return entry
            }

            return {
                cache: {
                    for(filePath: string): Cached<T> {
                        return getOrCreateEntry(filePath).cached
                    },
                },
                set(filePath: string, value: T): void {
                    store.set(filePath, value)
                    cellInvalidate(getOrCreateEntry(filePath).cell as Cell<unknown>)
                },
                invalidate(filePath: string): void {
                    cellInvalidate(getOrCreateEntry(filePath).cell as Cell<unknown>)
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
