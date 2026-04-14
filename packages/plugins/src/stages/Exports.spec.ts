import { describe, it, expect, vi } from "vitest"
import { parseSource, StageRunner } from "@mochi-css/builder"
import type { OnDiagnostic } from "@mochi-css/core"
import { importStageDef } from "./ImportSpecStage"
import { exportsStage } from "./Exports"

async function buildExportsInfo(
    source: string,
    resolveImport: (file: string, spec: string) => string | null = () => null,
    onDiagnostic?: OnDiagnostic,
) {
    const module = await parseSource(source, "test.ts")
    const runner = new StageRunner([module.filePath], [importStageDef, exportsStage])
    runner.engine.fileData.set(module.filePath, { filePath: module.filePath, ast: module.ast })
    const importOut = runner.getInstance(importStageDef)
    importOut.extractors.set(new Map())
    importOut.fileCallbacks.set(module.filePath, { resolveImport, onDiagnostic })
    return runner.getInstance(exportsStage).fileExports.for(module.filePath).get()
}

describe("ExportsStage — named reexports", () => {
    it("tracks export { foo } from './source' with same originalName and exportedName", async () => {
        const result = await buildExportsInfo(`export { foo } from "./source"`, () => "/project/source.ts")
        expect(result.reexports.get("/project/source.ts")).toEqual([{ originalName: "foo", exportedName: "foo" }])
    })

    it("tracks export { foo as bar } from './source' with distinct names", async () => {
        const result = await buildExportsInfo(`export { foo as bar } from "./source"`, () => "/project/source.ts")
        expect(result.reexports.get("/project/source.ts")).toEqual([{ originalName: "foo", exportedName: "bar" }])
    })

    it("merges multiple specifiers from the same source into one array", async () => {
        const result = await buildExportsInfo(`export { foo, bar as baz } from "./source"`, () => "/project/source.ts")
        const entries = result.reexports.get("/project/source.ts")
        expect(entries).toHaveLength(2)
        expect(entries).toContainEqual({ originalName: "foo", exportedName: "foo" })
        expect(entries).toContainEqual({ originalName: "bar", exportedName: "baz" })
    })

    it("does not track package imports", async () => {
        const result = await buildExportsInfo(`export { foo } from "some-package"`)
        expect(result.reexports.size).toBe(0)
        expect(result.namespaceReexports.size).toBe(0)
    })

    it("emits MOCHI_UNRESOLVED_IMPORT for an unresolvable local named reexport", async () => {
        const onDiagnostic = vi.fn()
        const result = await buildExportsInfo(`export { foo } from "./missing"`, () => null, onDiagnostic)
        expect(onDiagnostic).toHaveBeenCalledWith(expect.objectContaining({ code: "MOCHI_UNRESOLVED_IMPORT" }))
        expect(result.reexports.size).toBe(0)
    })

    it("does not track direct export declarations (those belong to BindingStage)", async () => {
        const result = await buildExportsInfo(`export function foo() {}`)
        expect(result.reexports.size).toBe(0)
        expect(result.namespaceReexports.size).toBe(0)
    })

    it("does not track local re-exports without source (those belong to BindingStage)", async () => {
        const result = await buildExportsInfo(`const foo = 1\nexport { foo }`)
        expect(result.reexports.size).toBe(0)
        expect(result.namespaceReexports.size).toBe(0)
    })
})

describe("ExportsStage — namespace reexports", () => {
    it("tracks export * from './source' in namespaceReexports", async () => {
        const result = await buildExportsInfo(`export * from "./source"`, () => "/project/source.ts")
        expect(result.namespaceReexports.has("/project/source.ts")).toBe(true)
        expect(result.reexports.size).toBe(0)
    })

    it("does not track package namespace reexports", async () => {
        const result = await buildExportsInfo(`export * from "some-package"`)
        expect(result.namespaceReexports.size).toBe(0)
    })

    it("emits MOCHI_UNRESOLVED_IMPORT for an unresolvable local namespace reexport", async () => {
        const onDiagnostic = vi.fn()
        await buildExportsInfo(`export * from "./missing"`, () => null, onDiagnostic)
        expect(onDiagnostic).toHaveBeenCalledWith(expect.objectContaining({ code: "MOCHI_UNRESOLVED_IMPORT" }))
    })

    it("tracks multiple namespace reexports from different sources", async () => {
        const result = await buildExportsInfo(`export * from "./a"\nexport * from "./b"`, (_, spec) =>
            spec === "./a" ? "/project/a.ts" : "/project/b.ts",
        )
        expect(result.namespaceReexports.has("/project/a.ts")).toBe(true)
        expect(result.namespaceReexports.has("/project/b.ts")).toBe(true)
    })
})
