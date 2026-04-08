import * as SWC from "@swc/core"

export type DirtySet = Set<SWC.ModuleItem>

function makeLazyProxy<T>(obj: T, onDirty: () => void): T {
    if (obj === null || typeof obj !== "object") return obj
    return new Proxy(obj as object, {
        get(target, prop, receiver) {
            const val = Reflect.get(target, prop, receiver) as unknown
            if (val !== null && typeof val === "object") {
                return makeLazyProxy(val, onDirty)
            }
            return val
        },
        set(target, prop, value, receiver) {
            onDirty()
            return Reflect.set(target, prop, value, receiver)
        },
    }) as T
}

export function createAstProxy(ast: SWC.Module): {
    proxy: SWC.Module
    dirtyItems: DirtySet
} {
    const dirtyItems: DirtySet = new Set()

    const proxy = new Proxy(ast, {
        get(target, prop, receiver) {
            if (prop === "body") {
                return new Proxy(target.body, {
                    get(bodyTarget, bodyProp, bodyReceiver) {
                        const index = typeof bodyProp === "string" ? parseInt(bodyProp, 10) : NaN
                        if (!isNaN(index) && index >= 0 && index < bodyTarget.length) {
                            const item = bodyTarget[index]
                            if (item === undefined) return item
                            return makeLazyProxy(item, () => {
                                const current = bodyTarget[index]
                                if (current !== undefined) dirtyItems.add(current)
                            })
                        }
                        return Reflect.get(bodyTarget, bodyProp, bodyReceiver) as unknown
                    },
                    set(bodyTarget, bodyProp, value, bodyReceiver) {
                        return Reflect.set(bodyTarget, bodyProp, value, bodyReceiver)
                    },
                })
            }
            return Reflect.get(target, prop, receiver) as unknown
        },
        set(target, prop, value, receiver) {
            return Reflect.set(target, prop, value, receiver)
        },
    })

    return { proxy, dirtyItems }
}

export type MutableFileEntry = { filePath: string; ast: SWC.Module }

/**
 * Wraps file ASTs in mutation-tracking proxies so that dirty files can be
 * detected after a source-transform pass.
 *
 * The caller supplies an array of mutable file entries (e.g. from a stage's
 * FileInput cache).  Each entry's `.ast` field is temporarily replaced with a
 * proxy and restored when `getDirtyFiles()` is called.
 */
export function wrapFilesWithProxies(files: MutableFileEntry[]): {
    getDirtyFiles(): Set<string>
} {
    type ProxiedFile = {
        entry: MutableFileEntry
        originalAst: SWC.Module
        dirtyItems: DirtySet
    }

    const proxiedFiles: ProxiedFile[] = []

    for (const entry of files) {
        const originalAst = entry.ast
        const { proxy, dirtyItems } = createAstProxy(originalAst)
        entry.ast = proxy
        proxiedFiles.push({ entry, originalAst, dirtyItems })
    }

    return {
        getDirtyFiles(): Set<string> {
            const dirty = new Set<string>()
            for (const { entry, originalAst, dirtyItems } of proxiedFiles) {
                entry.ast = originalAst
                if (dirtyItems.size > 0) dirty.add(entry.filePath)
            }
            return dirty
        },
    }
}
