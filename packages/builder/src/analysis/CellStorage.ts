/** Internal reactive node that holds a lazily computed value. */
export abstract class Cell<T> {
    protected _value: T | undefined
    protected _stale: boolean
    private readonly dependents: Set<Cell<unknown>>

    constructor(
        public readonly computeFn: () => T,
        value?: T,
        stale?: boolean,
    ) {
        this._value = value
        this._stale = stale ?? true
        this.dependents = new Set()
    }

    abstract get value(): T
    protected markClean(): void {
        this._stale = false
    }
    protected setValue(value: T): void {
        this._value = value
    }

    get stale(): boolean {
        return this._stale
    }

    invalidate(): void {
        if (this._stale) return
        this._stale = true
        for (const cell of this.dependents) cell.invalidate()
    }

    addDependency(dep: Cell<unknown>): void {
        dep.dependents.add(this)
    }
}

export class SimpleCell<T> extends Cell<T> {
    override get value(): T {
        if (this.stale) {
            this.setValue(this.computeFn())
            this.markClean()
        }
        return this._value as T
    }
}

export class VariableCell<T> extends Cell<T> {
    protected override _value: T

    constructor(value: T) {
        super(() => this._value, value, false)
        this._value = value
    }

    override get value(): T {
        this.markClean()
        return this._value
    }

    set value(value: T) {
        this._value = value
        this.invalidate()
        this.markClean()
    }
}

export class FixpointCell<T> extends Cell<T> {
    override get value(): T {
        while (this.stale) {
            this.markClean()
            this.setValue(this.computeFn())
        }
        return this._value as T
    }
}

export class CellStorage<K> {
    private readonly cellRegistry = new Map<K, Cell<unknown>>()

    register(key: K, cell: Cell<unknown>): void {
        this.cellRegistry.set(key, cell)
    }

    clear(): void {
        this.cellRegistry.clear()
    }

    invalidate(key: K): void {
        this.cellRegistry.get(key)?.invalidate()
    }

    addDependency(dependantKey: K, dependencyKey: K): void {
        const dependant = this.cellRegistry.get(dependantKey)
        const dependency = this.cellRegistry.get(dependencyKey)
        if (dependant && dependency) dependant.addDependency(dependency)
    }
}
