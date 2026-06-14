/** Internal lazily computed storage cell with dependants tracking.
 *
 * In most cases you should use {@link SimpleCell}
 * @see {@link FixpointCell}
 * @typeParam T - type of the value stored in the cell
 **/
export abstract class Cell<T> {
    private _value: T | undefined
    private _stale: boolean
    private readonly dependants: Set<Cell<unknown>>

    /** @param value - initial value for the cell
     *  @param stale - initial stale flag; defaults to `true`
     */
    protected constructor(value?: T, stale?: boolean) {
        this._value = value
        this._stale = stale ?? true
        this.dependants = new Set()
    }

    /**
     * Called when the cell is stale and needs to recompute.
     * @remarks Must call {@link Cell.setValue} to store the result.
     */
    protected abstract updateValue(): void
    /** Clears the stale flag. */
    protected markClean(): void {
        this._stale = false
    }
    /** Stores the computed value and clears the stale flag. */
    protected setValue(value: T): void {
        this._value = value
        this.markClean()
    }

    /**
     * Returns the current value.
     * @remarks Triggers recomputation if the cell is stale.
     */
    get value(): T {
        if (this.stale) this.updateValue()
        return this._value as T
    }
    /** Informs whether the cell needs to recompute before the next read. */
    get stale(): boolean {
        return this._stale
    }

    /** Marks the cell and all its dependants as stale. */
    invalidate(): void {
        if (this._stale) return
        this._stale = true
        for (const cell of this.dependants) cell.invalidate()
    }

    /** Registers `dep` as a dependency, so this cell is invalidated when `dep` is. */
    addDependency(dep: Cell<unknown>): void {
        dep.dependants.add(this)
    }
}

/**
 * A {@link Cell} that recomputes its value lazily using the provided function.
 * @typeParam T - type of the value stored in the cell.
 */
export class SimpleCell<T> extends Cell<T> {
    constructor(private readonly computeFn: () => T) {
        super()
    }

    override updateValue(): void {
        this.setValue(this.computeFn())
    }
}

/**
 * A {@link Cell} that holds a mutable value and propagates invalidation on write.
 * @typeParam T - type of the value stored in the cell.
 */
export class VariableCell<T> extends Cell<T> {
    constructor(value: T) {
        super(value, false)
    }

    /**
     * No-op.
     * @remarks Value updating is managed by the setter.
     */
    override updateValue(): void {
        this.markClean()
    }

    override get value(): T {
        return super.value
    }
    /** Stores a new value and invalidates all dependants. */
    override set value(value: T) {
        this.invalidate()
        this.setValue(value)
    }
}

/**
 * A {@link Cell} that reruns its compute function until the result stabilizes.
 * @typeParam T - type of the value stored in the cell.
 */
export class FixpointCell<T> extends Cell<T> {
    constructor(private readonly computeFn: () => T) {
        super()
    }

    /** Repeatedly calls the compute function until no further invalidation occurs. */
    override updateValue() {
        let val: T
        do {
            this.markClean()
            val = this.computeFn()
        } while (this.stale)
        this.setValue(val)
    }
}

/**
 * Maps external keys to their underlying {@link Cell} instances, allowing a
 * convenient abstraction layer on top of the cells system.
 * @typeParam K - type of the key used to look up cells.
 */
export class CellStorage<K> {
    private readonly cellRegistry = new Map<K, Cell<unknown>>()

    /** Associates `key` with `cell` so it can be looked up for invalidation and dependency wiring. */
    register(key: K, cell: Cell<unknown>): void {
        this.cellRegistry.set(key, cell)
    }

    /** Removes all registered key-to-cell mappings. */
    clear(): void {
        this.cellRegistry.clear()
    }

    /** Invalidates the cell registered under `key`, if any. */
    invalidate(key: K): void {
        this.cellRegistry.get(key)?.invalidate()
    }

    /** Wires `dependantKey`'s cell to depend on `dependencyKey`'s cell, so it is invalidated when the dependency is. */
    addDependency(dependantKey: K, dependencyKey: K): void {
        const dependant = this.cellRegistry.get(dependantKey)
        const dependency = this.cellRegistry.get(dependencyKey)
        if (dependant && dependency) dependant.addDependency(dependency)
    }
}
