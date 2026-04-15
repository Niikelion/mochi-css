import { describe, it, expect } from "vitest"
import { propagateUsagesFromRef } from "./propagation"
import type { ReexportResolver } from "./propagation"
import type { BindingInfo, LocalImport } from "@mochi-css/builder"
import { RefMap } from "@mochi-css/builder"
import type { FileInfo } from "./types"
import type * as SWC from "@swc/core"

function makeBinding(name: string, id: number): BindingInfo {
    const identifier: SWC.Identifier = {
        type: "Identifier",
        value: name,
        span: { start: 0, end: 0, ctxt: id },
        optional: false,
        ctxt: id,
    }
    const declarator: SWC.VariableDeclarator = {
        type: "VariableDeclarator",
        span: { start: 0, end: 0, ctxt: 0 },
        id: identifier,
        init: undefined,
        definite: false,
    }
    const declaration: SWC.VariableDeclaration = {
        type: "VariableDeclaration",
        span: { start: 0, end: 0, ctxt: 0 },
        kind: "const",
        declarations: [declarator],
        declare: false,
    }
    return {
        identifier,
        ref: { name, id },
        declarator: { type: "variable", declarator, declaration },
        moduleItem: declaration,
    }
}

function emptyAst(): SWC.Module {
    return { type: "Module", span: { start: 0, end: 0, ctxt: 0 }, body: [], interpreter: "" }
}

function makeFileView(filePath: string, partial: Partial<FileInfo> = {}): FileInfo {
    return {
        filePath,
        ast: emptyAst(),
        styleExpressions: new Set(),
        references: new Set(),
        moduleBindings: new RefMap(),
        localImports: new RefMap(),
        usedBindings: new Set(),
        exports: new Map(),
        extractedExpressions: new Map(),
        extractedCallExpressions: new Map(),
        derivedExtractorBindings: new RefMap(),
        exportedDerivedExtractors: new Map(),
        reexports: new Map(),
        namespaceReexports: new Set(),
        ...partial,
    }
}

describe("propagateUsagesFromRef — ReexportResolver", () => {
    it("resolves a named reexport via resolver when direct export lookup fails", () => {
        // source.ts: export const foo = ...
        const fooBinding = makeBinding("foo", 1)
        const sourceExports = new Map<string, { name: string; id?: number }>([["foo", fooBinding.ref]])
        const sourceModuleBindings = new RefMap<BindingInfo>()
        sourceModuleBindings.set(fooBinding.ref, fooBinding)
        const sourceView = makeFileView("/source.ts", {
            exports: sourceExports,
            moduleBindings: sourceModuleBindings,
        })

        // barrel.ts: export { foo } from './source' — no local binding, empty exports
        const barrelView = makeFileView("/barrel.ts")

        // app.ts: import { foo } from './barrel'
        const appFooBinding = makeBinding("foo", 2)
        const appLocalImports = new RefMap<LocalImport>()
        appLocalImports.set(appFooBinding.ref, {
            localRef: appFooBinding.ref,
            sourcePath: "/barrel.ts",
            exportName: "foo",
        })
        const appModuleBindings = new RefMap<BindingInfo>()
        appModuleBindings.set(appFooBinding.ref, appFooBinding)
        const appView = makeFileView("/app.ts", {
            localImports: appLocalImports,
            moduleBindings: appModuleBindings,
        })

        const filesInfo = new Map([
            ["/source.ts", sourceView],
            ["/barrel.ts", barrelView],
            ["/app.ts", appView],
        ])

        const resolver: ReexportResolver = (fileView, exportName) => {
            if (fileView.filePath === "/barrel.ts" && exportName === "foo") {
                const sv = filesInfo.get("/source.ts")
                const ref = sv?.exports.get("foo")
                if (sv && ref) return { fileView: sv, ref }
            }
            return null
        }

        const analyzedBindings = new Set<string>()
        propagateUsagesFromRef(analyzedBindings, filesInfo, appView, appFooBinding.ref, resolver)

        // The import binding in app.ts should be marked used
        expect(appView.usedBindings.has(appFooBinding)).toBe(true)
        // The actual definition in source.ts should be marked used
        expect(sourceView.usedBindings.has(fooBinding)).toBe(true)
    })

    it("resolves a namespace reexport via resolver when direct export lookup fails", () => {
        // source.ts: export const bar = ...
        const barBinding = makeBinding("bar", 1)
        const sourceExports = new Map<string, { name: string; id?: number }>([["bar", barBinding.ref]])
        const sourceModuleBindings = new RefMap<BindingInfo>()
        sourceModuleBindings.set(barBinding.ref, barBinding)
        const sourceView = makeFileView("/source.ts", {
            exports: sourceExports,
            moduleBindings: sourceModuleBindings,
        })

        // barrel.ts: export * from './source'
        const barrelView = makeFileView("/barrel.ts")

        // app.ts: import { bar } from './barrel'
        const appBarBinding = makeBinding("bar", 2)
        const appLocalImports = new RefMap<LocalImport>()
        appLocalImports.set(appBarBinding.ref, {
            localRef: appBarBinding.ref,
            sourcePath: "/barrel.ts",
            exportName: "bar",
        })
        const appModuleBindings = new RefMap<BindingInfo>()
        appModuleBindings.set(appBarBinding.ref, appBarBinding)
        const appView = makeFileView("/app.ts", {
            localImports: appLocalImports,
            moduleBindings: appModuleBindings,
        })

        const filesInfo = new Map([
            ["/source.ts", sourceView],
            ["/barrel.ts", barrelView],
            ["/app.ts", appView],
        ])

        // Namespace reexport resolver: barrel.ts has export * from source.ts
        const resolver: ReexportResolver = (fileView, exportName) => {
            if (fileView.filePath === "/barrel.ts") {
                const sv = filesInfo.get("/source.ts")
                const ref = sv?.exports.get(exportName)
                if (sv && ref) return { fileView: sv, ref }
            }
            return null
        }

        const analyzedBindings = new Set<string>()
        propagateUsagesFromRef(analyzedBindings, filesInfo, appView, appBarBinding.ref, resolver)

        expect(appView.usedBindings.has(appBarBinding)).toBe(true)
        expect(sourceView.usedBindings.has(barBinding)).toBe(true)
    })

    it("resolves a multi-hop reexport chain (barrel1 → barrel2 → source)", () => {
        // source.ts: export const baz = ...
        const bazBinding = makeBinding("baz", 1)
        const sourceExports = new Map<string, { name: string; id?: number }>([["baz", bazBinding.ref]])
        const sourceModuleBindings = new RefMap<BindingInfo>()
        sourceModuleBindings.set(bazBinding.ref, bazBinding)
        const sourceView = makeFileView("/source.ts", {
            exports: sourceExports,
            moduleBindings: sourceModuleBindings,
        })

        // barrel2.ts: export { baz } from './source'
        const barrel2View = makeFileView("/barrel2.ts")

        // barrel1.ts: export { baz } from './barrel2'
        const barrel1View = makeFileView("/barrel1.ts")

        // app.ts: import { baz } from './barrel1'
        const appBazBinding = makeBinding("baz", 2)
        const appLocalImports = new RefMap<LocalImport>()
        appLocalImports.set(appBazBinding.ref, {
            localRef: appBazBinding.ref,
            sourcePath: "/barrel1.ts",
            exportName: "baz",
        })
        const appModuleBindings = new RefMap<BindingInfo>()
        appModuleBindings.set(appBazBinding.ref, appBazBinding)
        const appView = makeFileView("/app.ts", {
            localImports: appLocalImports,
            moduleBindings: appModuleBindings,
        })

        const filesInfo = new Map([
            ["/source.ts", sourceView],
            ["/barrel2.ts", barrel2View],
            ["/barrel1.ts", barrel1View],
            ["/app.ts", appView],
        ])

        // Resolver simulates buildReexportResolver: resolves the full chain to the final definition
        const resolver: ReexportResolver = (fileView, exportName) => {
            if ((fileView.filePath === "/barrel1.ts" || fileView.filePath === "/barrel2.ts") && exportName === "baz") {
                const sv = filesInfo.get("/source.ts")
                const ref = sv?.exports.get("baz")
                if (sv && ref) return { fileView: sv, ref }
            }
            return null
        }

        const analyzedBindings = new Set<string>()
        propagateUsagesFromRef(analyzedBindings, filesInfo, appView, appBazBinding.ref, resolver)

        expect(appView.usedBindings.has(appBazBinding)).toBe(true)
        expect(sourceView.usedBindings.has(bazBinding)).toBe(true)
    })

    it("does not use resolver when direct export lookup succeeds", () => {
        // source.ts: export const foo = ... (direct export, no reexport needed)
        const fooBinding = makeBinding("foo", 1)
        const sourceExports = new Map<string, { name: string; id?: number }>([["foo", fooBinding.ref]])
        const sourceModuleBindings = new RefMap<BindingInfo>()
        sourceModuleBindings.set(fooBinding.ref, fooBinding)
        const sourceView = makeFileView("/source.ts", {
            exports: sourceExports,
            moduleBindings: sourceModuleBindings,
        })

        // app.ts: import { foo } from './source' (direct import, not barrel)
        const appFooBinding = makeBinding("foo", 2)
        const appLocalImports = new RefMap<LocalImport>()
        appLocalImports.set(appFooBinding.ref, {
            localRef: appFooBinding.ref,
            sourcePath: "/source.ts",
            exportName: "foo",
        })
        const appModuleBindings = new RefMap<BindingInfo>()
        appModuleBindings.set(appFooBinding.ref, appFooBinding)
        const appView = makeFileView("/app.ts", {
            localImports: appLocalImports,
            moduleBindings: appModuleBindings,
        })

        const filesInfo = new Map([
            ["/source.ts", sourceView],
            ["/app.ts", appView],
        ])

        let resolverCalled = false
        const resolver: ReexportResolver = () => {
            resolverCalled = true
            return null
        }

        const analyzedBindings = new Set<string>()
        propagateUsagesFromRef(analyzedBindings, filesInfo, appView, appFooBinding.ref, resolver)

        expect(resolverCalled).toBe(false)
        expect(sourceView.usedBindings.has(fooBinding)).toBe(true)
    })
})
