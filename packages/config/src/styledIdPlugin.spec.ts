import { describe, it, expect } from "vitest"
import { styledIdPlugin } from "./styledIdPlugin"
import { FullContext } from "@/plugin"

describe("styledIdPlugin", () => {
    it("registers a source transformation via onLoad", () => {
        const plugin = styledIdPlugin()
        const context = new FullContext()
        plugin.onLoad?.(context)
        expect(context.sourceTransform.getTransformations()).toHaveLength(1)
    })

    it("the registered transformation injects styled IDs", async () => {
        const plugin = styledIdPlugin()
        const context = new FullContext()
        plugin.onLoad?.(context)

        const source = `const Button = styled('button', { color: 'red' })`
        const result = await context.sourceTransform.transform(source, { filePath: "Button.tsx" })
        expect(result).toMatch(/styled\('button', \{ color: 'red' }, 's-[0-9A-Za-z_-]+'\)/)
    })

    it("does not transform files outside the glob filter", async () => {
        const plugin = styledIdPlugin()
        const context = new FullContext()
        plugin.onLoad?.(context)

        const source = `const Button = styled('button', { color: 'red' })`
        const result = await context.sourceTransform.transform(source, { filePath: "Button.css" })
        expect(result).toBe(source)
    })

    it("transforms all supported extensions", async () => {
        for (const ext of ["ts", "tsx", "js", "jsx"]) {
            const plugin = styledIdPlugin()
            const context = new FullContext()
            plugin.onLoad?.(context)

            const source = `const Button = styled('button', {})`
            const result = await context.sourceTransform.transform(source, { filePath: `Button.${ext}` })
            expect(result).toContain("'s-")
        }
    })
})
