import { describe, it, expect } from "vitest"
import { globExToRegex } from "./globEx"

describe("globExToRegex", () => {
    describe("filename-only patterns (no /)", () => {
        it("matches a simple extension glob", () => {
            const re = globExToRegex("*.ts")
            expect(re.test("foo.ts")).toBe(true)
            expect(re.test("src/bar.ts")).toBe(true)
            expect(re.test("foo.js")).toBe(false)
            expect(re.test("foo.tsx")).toBe(false)
        })

        it("matches brace alternation", () => {
            const re = globExToRegex("*.{ts,tsx}")
            expect(re.test("foo.ts")).toBe(true)
            expect(re.test("foo.tsx")).toBe(true)
            expect(re.test("src/bar.tsx")).toBe(true)
            expect(re.test("foo.js")).toBe(false)
        })

        it("matches multiple brace alternatives", () => {
            const re = globExToRegex("*.{ts,tsx,js,jsx}")
            expect(re.test("foo.ts")).toBe(true)
            expect(re.test("foo.tsx")).toBe(true)
            expect(re.test("foo.js")).toBe(true)
            expect(re.test("foo.jsx")).toBe(true)
            expect(re.test("foo.css")).toBe(false)
        })

        it("matches ? as a single non-slash character", () => {
            const re = globExToRegex("foo?.ts")
            expect(re.test("fooX.ts")).toBe(true)
            expect(re.test("foo1.ts")).toBe(true)
            expect(re.test("foo.ts")).toBe(false)
            expect(re.test("fooXY.ts")).toBe(false)
        })

        it("? does not match a slash", () => {
            const re = globExToRegex("foo?.ts")
            expect(re.test("foo/.ts")).toBe(false)
        })

        it("* does not match across path segments", () => {
            const re = globExToRegex("*.ts")
            expect(re.test("src/nested/foo.ts")).toBe(true)
            // * in filename position should not match a slash within the segment
            const re2 = globExToRegex("src*.ts")
            expect(re2.test("src/foo.ts")).toBe(false)
        })

        it("treats dot as a literal", () => {
            const re = globExToRegex("*.ts")
            expect(re.test("fooXts")).toBe(false)
        })

        it("treats unclosed brace as a literal", () => {
            const re = globExToRegex("foo{bar.ts")
            expect(re.test("foo{bar.ts")).toBe(true)
            expect(re.test("foobar.ts")).toBe(false)
        })
    })

    describe("path patterns (contain /)", () => {
        it("matches a path with * in filename position", () => {
            const re = globExToRegex("src/*.ts")
            expect(re.test("src/foo.ts")).toBe(true)
            expect(re.test("src/bar.ts")).toBe(true)
            expect(re.test("lib/foo.ts")).toBe(false)
            expect(re.test("src/nested/foo.ts")).toBe(false)
        })

        it("matches ** spanning multiple segments", () => {
            const re = globExToRegex("src/**/*.ts")
            expect(re.test("src/foo.ts")).toBe(true)
            expect(re.test("src/nested/foo.ts")).toBe(true)
            expect(re.test("src/a/b/c/foo.ts")).toBe(true)
            expect(re.test("lib/foo.ts")).toBe(false)
        })

        it("matches img/**/*.svg example from the plan", () => {
            const re = globExToRegex("img/**/*.svg")
            expect(re.test("img/foo.svg")).toBe(true)
            expect(re.test("img/sub/foo.svg")).toBe(true)
            expect(re.test("img/a/b/icon.svg")).toBe(true)
            expect(re.test("src/foo.svg")).toBe(false)
        })

        it("** followed by / consumes the slash", () => {
            const re = globExToRegex("src/**/foo.ts")
            expect(re.test("src/foo.ts")).toBe(true)
            expect(re.test("src/nested/foo.ts")).toBe(true)
        })

        it("matches brace alternation in path patterns", () => {
            const re = globExToRegex("src/*.{ts,tsx}")
            expect(re.test("src/foo.ts")).toBe(true)
            expect(re.test("src/bar.tsx")).toBe(true)
            expect(re.test("src/baz.js")).toBe(false)
        })
    })
})
