import * as SWC from "@swc/core"
import { FileInfo, ProjectIndex } from "@/ProjectIndex"

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

type ProxiedFile = {
    filePath: string
    fileInfo: FileInfo
    originalAst: SWC.Module
    dirtyItems: DirtySet
}

export function wrapIndexWithProxies(index: ProjectIndex): {
    getDirtyFiles(): Set<string>
} {
    const proxiedFiles: ProxiedFile[] = []

    for (const [filePath, fileInfo] of index.files) {
        const originalAst = fileInfo.ast
        const { proxy, dirtyItems } = createAstProxy(originalAst)
        fileInfo.ast = proxy
        proxiedFiles.push({ filePath, fileInfo, originalAst, dirtyItems })
    }

    return {
        getDirtyFiles(): Set<string> {
            const dirty = new Set<string>()
            for (const { filePath, fileInfo, originalAst, dirtyItems } of proxiedFiles) {
                fileInfo.ast = originalAst
                if (dirtyItems.size > 0) dirty.add(filePath)
            }
            return dirty
        },
    }
}
