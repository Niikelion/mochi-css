import { describe, it, expect, vi } from "vitest"
import { ProjectIndex } from "@/ProjectIndex"
import { parseSource } from "@/parse"
import { defaultStages } from "@/analysis/stages"
import type { OnDiagnostic } from "@/diagnostics"

async function buildIndex(source: string, resolveImport = () => null, onDiagnostic?: OnDiagnostic) {
    const module = await parseSource(source, "test.ts")
    const index = new ProjectIndex([module], defaultStages, [], resolveImport, onDiagnostic)
    const fileInfo = index.files.find(([p]) => p === "test.ts")?.[1]
    if (!fileInfo) throw new Error("fileInfo not found")
    return fileInfo
}

describe("BindingStage — ExportDeclaration with function/class", () => {
    it("registers an exported function declaration as a binding and export", async () => {
        const fileInfo = await buildIndex(`export function foo() {}`)
        const binding = fileInfo.moduleBindings.getByName("foo")
        expect(binding).toBeDefined()
        expect(binding?.declarator.type).toBe("function")
        expect(fileInfo.exports.get("foo")).toBeDefined()
    })

    it("registers an exported class declaration as a binding and export", async () => {
        const fileInfo = await buildIndex(`export class Foo {}`)
        const binding = fileInfo.moduleBindings.getByName("Foo")
        expect(binding).toBeDefined()
        expect(binding?.declarator.type).toBe("class")
        expect(fileInfo.exports.get("Foo")).toBeDefined()
    })
})

describe("BindingStage — Pass 4 scope-depth tracking", () => {
    it("collects module-level identifier references", async () => {
        const fileInfo = await buildIndex(`
const x = 1
const y = x
`)
        const refNames = [...fileInfo.references].map((id) => id.value)
        expect(refNames).toContain("x")
    })

    it("does not collect identifiers inside a function declaration body as top-level references", async () => {
        const fileInfo = await buildIndex(`
const outer = 1
function foo() {
    const inner = outer
}
`)
        const refNames = [...fileInfo.references].map((id) => id.value)
        // "inner" is inside the function body — should NOT appear as a module-level reference
        expect(refNames).not.toContain("inner")
    })

    it("does not collect identifiers inside a function expression body", async () => {
        const fileInfo = await buildIndex(`
const fn = function() {
    const inner = 1
}
`)
        const refNames = [...fileInfo.references].map((id) => id.value)
        expect(refNames).not.toContain("inner")
    })

    it("does not collect identifiers inside an arrow function body", async () => {
        const fileInfo = await buildIndex(`
const arr = () => {
    const inner = 1
}
`)
        const refNames = [...fileInfo.references].map((id) => id.value)
        expect(refNames).not.toContain("inner")
    })

    it("does not collect identifiers inside a class method body", async () => {
        const fileInfo = await buildIndex(`
class MyClass {
    method() {
        const inner = 1
    }
}
`)
        const refNames = [...fileInfo.references].map((id) => id.value)
        expect(refNames).not.toContain("inner")
    })

    it("does not collect identifiers inside an IIFE function expression body", async () => {
        const fileInfo = await buildIndex(`;(function() { const inner = 1 })()`)
        const refNames = [...fileInfo.references].map((id) => id.value)
        expect(refNames).not.toContain("inner")
    })

    it("does not collect identifiers inside an IIFE arrow function body", async () => {
        const fileInfo = await buildIndex(`;(() => { const inner = 1 })()`)
        const refNames = [...fileInfo.references].map((id) => id.value)
        expect(refNames).not.toContain("inner")
    })
})

describe("BindingStage — collectBindingsFromPattern", () => {
    it("collects bindings from array destructuring", async () => {
        const fileInfo = await buildIndex(`const [a, b] = arr`)
        expect(fileInfo.moduleBindings.getByName("a")).toBeDefined()
        expect(fileInfo.moduleBindings.getByName("b")).toBeDefined()
    })

    it("collects bindings from rest element in array destructuring", async () => {
        const fileInfo = await buildIndex(`const [first, ...rest] = arr`)
        expect(fileInfo.moduleBindings.getByName("first")).toBeDefined()
        expect(fileInfo.moduleBindings.getByName("rest")).toBeDefined()
    })

    it("collects bindings from assignment pattern (default value in array destructuring)", async () => {
        const fileInfo = await buildIndex(`const [x = 1] = arr`)
        expect(fileInfo.moduleBindings.getByName("x")).toBeDefined()
    })
})

describe("BindingStage — unresolved local import diagnostic", () => {
    it("emits MOCHI_UNRESOLVED_IMPORT diagnostic when resolveImport returns null", async () => {
        const onDiagnostic = vi.fn()
        await buildIndex(`import { foo } from "./local"`, () => null, onDiagnostic)
        expect(onDiagnostic).toHaveBeenCalledWith(expect.objectContaining({ code: "MOCHI_UNRESOLVED_IMPORT" }))
    })

    it("does not emit diagnostic for unresolvable package imports", async () => {
        const onDiagnostic = vi.fn()
        await buildIndex(`import { foo } from "some-package"`, () => null, onDiagnostic)
        expect(onDiagnostic).not.toHaveBeenCalled()
    })
})
