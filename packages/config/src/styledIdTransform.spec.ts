import { describe, it, expect } from "vitest"
import { transformStyledIds } from "./styledIdTransform"
import { shortHash } from "@mochi-css/core"
import dedent from "dedent"

const FILE = "/project/src/Button.tsx"

describe("transformStyledIds", () => {
    it("injects an s- id into a simple styled call", () => {
        const source = `const Button = styled('button', { color: 'red' })`
        const result = transformStyledIds(source, FILE)
        expect(result).toContain("'s-")
        expect(result).toMatch(/styled\('button', \{ color: 'red' }, 's-[0-9A-Za-z_-]+'\)/)
    })

    it("is idempotent — does not inject if last arg is already s- string", () => {
        const source = `const Button = styled('button', { color: 'red' })`
        const once = transformStyledIds(source, FILE)
        const twice = transformStyledIds(once, FILE)
        expect(once).toBe(twice)
    })

    it("generates different IDs for different variable names in the same file", () => {
        const source = `
            const Button = styled('button', { color: 'red' })
            const Link = styled('a', { color: 'blue' })
        `
        const result = transformStyledIds(source, FILE)
        const ids = [...result.matchAll(/'s-([0-9A-Za-z_-]+)'/g)].map((m) => m[0])
        expect(ids.length).toBe(2)
        expect(ids[0]).not.toBe(ids[1])
    })

    it("generates different IDs for the same var name in different files", () => {
        const source = `const Button = styled('button', {})`
        const r1 = transformStyledIds(source, "/src/A.tsx")
        const r2 = transformStyledIds(source, "/src/B.tsx")
        const id1 = /'s-([0-9A-Za-z_-]+)'/.exec(r1)?.[0]
        const id2 = /'s-([0-9A-Za-z_-]+)'/.exec(r2)?.[0]
        expect(id1).not.toBe(id2)
    })

    it("returns source unchanged when there is no 'styled' in source", () => {
        const source = `const Button = css({ color: 'red' })`
        expect(transformStyledIds(source, FILE)).toBe(source)
    })

    it("returns source unchanged on parse error", () => {
        const source = `const x = styled('button', {`
        expect(transformStyledIds(source, FILE)).toBe(source)
    })

    it("uses index-based ID for anonymous (no variable name) styled calls", () => {
        const source = `export default styled('div', { margin: 0 })`
        const result = transformStyledIds(source, FILE)
        // 'default' is the varName for ExportDefaultExpression
        const expectedId = "s-" + shortHash(FILE + ":default")
        expect(result).toContain(`'${expectedId}'`)
    })

    it("handles exported variable declarations", () => {
        const source = `export const Card = styled('section', { padding: 16 })`
        const result = transformStyledIds(source, FILE)
        expect(result).toMatch(/styled\('section', \{ padding: 16 }, 's-[0-9A-Za-z_-]+'\)/)
    })

    it("uses index-based ID for inline expression statement styled calls", () => {
        const source = `styled('div', { margin: 0 })`
        const result = transformStyledIds(source, FILE)
        expect(result).toMatch(/styled\('div', \{ margin: 0 }, 's-[0-9A-Za-z_-]+'\)/)
    })

    it("does not inject into function declaration following a multiline styled call", () => {
        // noinspection TypeScriptCheckImport,TypeScriptMissingConfigOption
        const source = /* language=tsx */ dedent`
            import { styled } from "@mochi-css/react"
            
            const Box = styled("div", {
                backgroundColor: "green",
                color: "white",
                width: 500,
                height: 500
            })
            
            export default function Subpage() {
                return <Box>Test</Box>
            }
        `

        const result = transformStyledIds(source, "/project/src/Subpage.tsx")
        expect(result).not.toMatch(/function Subpage\(,/)
        const styledIdx = result.indexOf("styled(")
        const subpageIdx = result.indexOf("function Subpage(")
        const idIdx = result.indexOf("'s-")
        expect(idIdx).toBeGreaterThan(styledIdx)
        expect(idIdx).toBeLessThan(subpageIdx)
    })
})
