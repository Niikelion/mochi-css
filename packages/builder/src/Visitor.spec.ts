import { describe, it, expect } from "vitest"
import { visit } from "@/Visitor"
import { parseSource } from "@/parse"
import dedent from "dedent"
import * as SWC from "@swc/core"

async function parse(code: string) {
    const { ast } = await parseSource(dedent(code), "test.ts")
    return ast
}

async function parseTsx(code: string) {
    const { ast } = await parseSource(dedent(code), "test.tsx")
    return ast
}

function collectIdentifiers(names: string[]): { identifier(node: { value: string }): void } {
    return {
        identifier(node) {
            names.push(node.value)
        },
    }
}

async function parseWithDecorators(code: string): Promise<SWC.Module> {
    return await SWC.parse(dedent(code), {
        syntax: "typescript",
        decorators: true,
    })
}

describe("Visitor", () => {
    describe("core mechanism", () => {
        it("visits identifiers reached as expressions", async () => {
            const module = await parse(`a + b`)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("a")
            expect(names).toContain("b")
        })

        it("any visitor fires for every node and receives a descend function", async () => {
            const module = await parse(`const x = 1`)

            let count = 0
            visit.module(
                module,
                {
                    any(_node, context) {
                        count++
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(count).toBeGreaterThan(1)
        })

        it("any visitor can stop traversal by not calling descend", async () => {
            const module = await parse(`a + b`)

            const names: string[] = []
            visit.module(
                module,
                {
                    any(_node, _context) {
                        // do not call descend → traversal stops at every node
                    },
                    identifier(node) {
                        names.push(node.value)
                    },
                },
                null,
            )

            expect(names).toHaveLength(0)
        })

        it("named visitor without descend call skips default child traversal", async () => {
            const module = await parse(`foo(bar)`)

            const names: string[] = []
            visit.module(
                module,
                {
                    callExpression(_node, _context) {
                        // override without descend — callee/args won't be visited
                    },
                    identifier(node) {
                        names.push(node.value)
                    },
                },
                null,
            )

            expect(names).not.toContain("foo")
            expect(names).not.toContain("bar")
        })

        it("named visitor calling descend triggers default child traversal", async () => {
            const module = await parse(`foo(bar)`)

            const names: string[] = []
            visit.module(
                module,
                {
                    callExpression(_node, context) {
                        context.descend(context.context)
                    },
                    identifier(node) {
                        names.push(node.value)
                    },
                },
                null,
            )

            expect(names).toContain("foo")
            expect(names).toContain("bar")
        })

        it("context is threaded through traversal", async () => {
            const module = await parse(`const x = 1`)

            const depths: number[] = []
            visit.module(
                module,
                {
                    any(_node, context) {
                        depths.push(context.context)
                        context.descend(context.context + 1)
                    },
                },
                0,
            )

            expect(depths[0]).toBe(0)
            expect(depths.some((d) => d > 0)).toBe(true)
        })

        it("visit.module dispatches to all module items", async () => {
            const module = await parse(dedent`
                a
                b
                c
            `)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("a")
            expect(names).toContain("b")
            expect(names).toContain("c")
        })
    })

    describe("statement traversal", () => {
        it("traverses if statement with consequent and alternate", async () => {
            const module = await parse(dedent`
                if (condition) {
                    yes()
                } else {
                    no()
                }
            `)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("condition")
            expect(names).toContain("yes")
            expect(names).toContain("no")
        })

        it("traverses for...of statement", async () => {
            const module = await parse(dedent`
                for (const item of items) {
                    process(item)
                }
            `)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("items")
            expect(names).toContain("process")
            expect(names).toContain("item")
        })

        it("traverses for...in statement", async () => {
            const module = await parse(dedent`
                for (const key in obj) {
                    use(key)
                }
            `)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("obj")
            expect(names).toContain("use")
            expect(names).toContain("key")
        })

        it("traverses for statement with expression init", async () => {
            const module = await parse(dedent`
                for (i = 0; i < n; i++) {
                    body(i)
                }
            `)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("i")
            expect(names).toContain("n")
            expect(names).toContain("body")
        })

        it("traverses for statement with variable declaration init", async () => {
            const module = await parse(dedent`
                for (let i = start; i < end; i++) {}
            `)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("start")
            expect(names).toContain("end")
        })

        it("traverses while statement", async () => {
            const module = await parse(dedent`
                while (running) {
                    tick()
                }
            `)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("running")
            expect(names).toContain("tick")
        })

        it("traverses do...while statement", async () => {
            const module = await parse(dedent`
                do {
                    step()
                } while (going)
            `)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("step")
            expect(names).toContain("going")
        })

        it("traverses try/catch/finally", async () => {
            const module = await parse(dedent`
                try {
                    attempt()
                } catch (err) {
                    handle(err)
                } finally {
                    cleanup()
                }
            `)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("attempt")
            expect(names).toContain("handle")
            expect(names).toContain("cleanup")
        })

        it("traverses switch/case/break", async () => {
            const module = await parse(dedent`
                switch (value) {
                    case 1:
                        doA()
                        break
                    default:
                        doB()
                }
            `)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("value")
            expect(names).toContain("doA")
            expect(names).toContain("doB")
        })

        it("traverses throw statement", async () => {
            const module = await parse(`throw new Error(message)`)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("Error")
            expect(names).toContain("message")
        })

        it("traverses return statement", async () => {
            const module = await parse(dedent`
                function f() {
                    return result
                }
            `)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("result")
        })

        it("traverses labeled statement and continue with label", async () => {
            const module = await parse(dedent`
                outer: for (const x of xs) {
                    continue outer
                }
            `)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("outer")
            expect(names).toContain("xs")
        })

        it("traverses debugger statement via any", async () => {
            const module = await parse(`debugger`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("DebuggerStatement")
        })
    })

    describe("expression traversal", () => {
        it("traverses binary expression operands", async () => {
            const module = await parse(`a + b`)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("a")
            expect(names).toContain("b")
        })

        it("traverses member expression object and property", async () => {
            const module = await parse(`obj.prop`)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("obj")
            expect(names).toContain("prop")
        })

        it("traverses computed member expression", async () => {
            const module = await parse(`obj[key]`)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("obj")
            expect(names).toContain("key")
        })

        it("traverses conditional expression branches", async () => {
            const module = await parse(`a ? b : c`)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("a")
            expect(names).toContain("b")
            expect(names).toContain("c")
        })

        it("traverses object expression properties", async () => {
            const module = await parse(`({ x: a, y: b })`)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("a")
            expect(names).toContain("b")
        })

        it("traverses spread element in object expression", async () => {
            const module = await parse(`const o = { ...rest, x: 1 }`)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("rest")
        })

        it("traverses array expression elements", async () => {
            const module = await parse(`[a, b, c]`)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("a")
            expect(names).toContain("b")
            expect(names).toContain("c")
        })

        it("traverses template literal expressions", async () => {
            const module = await parse("`hello ${name}`")

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("name")
        })

        it("traverses tagged template expression", async () => {
            const module = await parse("tag`hello ${world}`")

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("tag")
            expect(names).toContain("world")
        })

        it("traverses arrow function expression", async () => {
            const module = await parse(`const fn = (x) => compute(x)`)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("compute")
            expect(names).toContain("x")
        })

        it("traverses arrow function with block body", async () => {
            const module = await parse(dedent`
                const fn = (x) => {
                    return transform(x)
                }
            `)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("transform")
            expect(names).toContain("x")
        })

        it("traverses await expression", async () => {
            const module = await parse(dedent`
                async function f() {
                    await fetchData()
                }
            `)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("fetchData")
        })

        it("traverses yield expression", async () => {
            const module = await parse(dedent`
                function* gen() {
                    yield value
                }
            `)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("value")
        })

        it("traverses new expression", async () => {
            const module = await parse(`new MyClass(arg)`)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("MyClass")
            expect(names).toContain("arg")
        })

        it("traverses unary expression", async () => {
            const module = await parse(`!active`)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("active")
        })

        it("traverses update expression", async () => {
            const module = await parse(`counter++`)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("counter")
        })

        it("traverses sequence expression", async () => {
            const module = await parse(`(a, b, c)`)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("a")
            expect(names).toContain("b")
            expect(names).toContain("c")
        })

        it("traverses optional chaining member expression", async () => {
            const module = await parse(`obj?.prop`)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("obj")
            expect(names).toContain("prop")
        })

        it("traverses optional chaining call expression", async () => {
            const module = await parse(`fn?.()`)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("fn")
        })

        it("traverses assignment expression right-hand side", async () => {
            const module = await parse(`x = newValue`)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("newValue")
        })

        it("traverses ts-as expression", async () => {
            const module = await parse(`value as string`)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("value")
        })

        it("traverses ts non-null expression", async () => {
            const module = await parse(`maybeNull!`)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("maybeNull")
        })

        it("traverses literal types via any", async () => {
            const module = await parse(`const x = true`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("BooleanLiteral")
        })
    })

    describe("pattern traversal", () => {
        it("traverses object destructuring shorthand properties", async () => {
            const module = await parse(`const { a, b } = source`)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("a")
            expect(names).toContain("b")
            expect(names).toContain("source")
        })

        it("traverses object destructuring with rename (key-value pattern)", async () => {
            const module = await parse(`const { original: renamed } = source`)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("original")
            expect(names).toContain("source")
        })

        it("traverses array destructuring", async () => {
            const module = await parse(`const [first, second] = arr`)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("arr")
        })

        it("traverses rest element in destructuring", async () => {
            const module = await parse(`const { a, ...tail } = source`)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("a")
            expect(names).toContain("source")
        })

        it("traverses assignment pattern default values", async () => {
            const module = await parse(`const { x = defaultVal } = source`)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("defaultVal")
            expect(names).toContain("source")
        })
    })

    describe("TypeScript-specific traversal", () => {
        it("traverses type alias with union type", async () => {
            const module = await parse(`type MyType = string | number`)

            const kinds: string[] = []
            visit.module(
                module,
                {
                    tsKeywordType(node) {
                        kinds.push(node.kind)
                    },
                },
                null,
            )

            expect(kinds).toContain("string")
            expect(kinds).toContain("number")
        })

        it("traverses interface declaration body", async () => {
            const module = await parse(dedent`
                interface User {
                    name: string
                    age: number
                }
            `)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("User")
            expect(names).toContain("name")
            expect(names).toContain("age")
        })

        it("traverses generic type parameters", async () => {
            const module = await parse(dedent`
                function identity<T>(value: T): T {
                    return value
                }
            `)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("T")
            expect(names).toContain("value")
        })

        it("traverses enum declaration members", async () => {
            const module = await parse(dedent`
                enum Color {
                    Red,
                    Green,
                    Blue
                }
            `)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("Color")
            expect(names).toContain("Red")
            expect(names).toContain("Green")
            expect(names).toContain("Blue")
        })

        it("traverses ts satisfies expression", async () => {
            const module = await parse(`config satisfies Options`)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("config")
        })

        it("traverses conditional type", async () => {
            const module = await parse(`type R = T extends string ? A : B`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("TsConditionalType")
        })

        it("traverses mapped type", async () => {
            const module = await parse(`type Opt<T> = { [K in keyof T]?: T[K] }`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("TsMappedType")
        })
    })

    describe("function and class traversal", () => {
        it("traverses function declaration name and params", async () => {
            const module = await parse(dedent`
                function greet(name: string): string {
                    return greeting
                }
            `)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("greet")
            expect(names).toContain("greeting")
        })

        it("traverses function expression with identifier", async () => {
            const module = await parse(dedent`
                const fn = function named(x) {
                    return x
                }
            `)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("named")
        })

        it("traverses class declaration with method and property", async () => {
            const module = await parse(dedent`
                class Animal {
                    speak() {
                        return sound
                    }
                }
            `)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("Animal")
            expect(names).toContain("speak")
            expect(names).toContain("sound")
        })

        it("traverses class expression", async () => {
            const module = await parse(`const C = class Inner {}`)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("Inner")
        })
    })

    describe("module declaration traversal", () => {
        it("traverses named import specifiers", async () => {
            const module = await parse(`import { foo, bar as baz } from "module"`)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("foo")
            expect(names).toContain("bar")
            expect(names).toContain("baz")
        })

        it("traverses default import specifier", async () => {
            const module = await parse(`import React from "react"`)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("React")
        })

        it("traverses namespace import specifier", async () => {
            const module = await parse(`import * as NS from "module"`)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("NS")
        })

        it("traverses export declaration", async () => {
            const module = await parse(`export const exportedValue = 42`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("ExportDeclaration")
        })

        it("traverses export named declaration with re-export", async () => {
            const module = await parse(dedent`
                const x = 1
                export { x as y }
            `)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("x")
            expect(names).toContain("y")
        })

        it("traverses export default expression", async () => {
            const module = await parse(`export default myValue`)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("myValue")
        })

        it("traverses export default function declaration", async () => {
            const module = await parse(dedent`
                export default function myFunc() {
                    return result
                }
            `)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("myFunc")
            expect(names).toContain("result")
        })

        it("traverses export all from module", async () => {
            const module = await parse(`export * from "other-module"`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("ExportAllDeclaration")
        })

        it("traverses export named with re-export source", async () => {
            const module = await parse(`export { foo } from "other-module"`)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("foo")
        })

        it("traverses export namespace specifier", async () => {
            const module = await parse(`export * as ns from "other-module"`)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("ns")
        })

        it("traverses export default class expression", async () => {
            const module = await parse(`export default class MyClass {}`)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("MyClass")
        })
    })

    describe("TypeScript const assertion and type assertion", () => {
        it("traverses ts const assertion (as const)", async () => {
            const module = await parse(`const x = value as const`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("TsConstAssertion")
        })

        it("traverses ts type assertion (angle bracket syntax)", async () => {
            const module = await parse(`const x = <string>value`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("TsTypeAssertion")
        })

        it("traverses ts instantiation expression (fn<T>)", async () => {
            const module = await parse(`const f = identity<string>`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("TsInstantiation")
        })

        it("traverses ts qualified name in type position", async () => {
            const module = await parse(`type T = SomeNS.SomeType`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("TsQualifiedName")
        })

        it("traverses ts indexed access type", async () => {
            const module = await parse(`type T = Obj["key"]`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("TsIndexedAccessType")
        })

        it("traverses ts tuple type", async () => {
            const module = await parse(`type T = [string, number]`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("TsTupleType")
        })

        it("traverses ts literal type", async () => {
            const module = await parse(`type T = "hello"`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("TsLiteralType")
        })

        it("traverses ts type predicate via interface method signature", async () => {
            const module = await parse(dedent`
                interface Guard {
                    isStr(x: any): x is string
                }
            `)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("TsTypePredicate")
        })

        it("traverses ts infer type in conditional", async () => {
            const module = await parse(`type T = A extends infer R ? R : never`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("TsInferType")
        })

        it("traverses ts type operator (keyof)", async () => {
            const module = await parse(`type T = keyof MyType`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("TsTypeOperator")
        })

        it("traverses ts array type", async () => {
            const module = await parse(`type T = string[]`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("TsArrayType")
        })

        it("traverses ts union type", async () => {
            const module = await parse(`type T = string | number | boolean`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("TsUnionType")
        })

        it("traverses ts intersection type", async () => {
            const module = await parse(`type T = A & B`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("TsIntersectionType")
        })
    })

    describe("advanced class traversal", () => {
        it("traverses class with extends and implements", async () => {
            const module = await parse(dedent`
                class Dog extends Animal implements IPet {
                    bark() {
                        return sound
                    }
                }
            `)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("Dog")
            expect(names).toContain("Animal")
            expect(names).toContain("IPet")
            expect(names).toContain("bark")
        })

        it("traverses class constructor with parameter properties", async () => {
            const module = await parse(dedent`
                class Person {
                    constructor(private name: string, public age: number) {}
                }
            `)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("Constructor")
        })

        it("traverses class with index signature", async () => {
            const module = await parse(dedent`
                class C {
                    [key: string]: unknown
                }
            `)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("TsIndexSignature")
        })

        it("traverses class property", async () => {
            const module = await parse(dedent`
                class C {
                    name: string = initial
                }
            `)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("initial")
        })

        it("traverses class static block", async () => {
            const module = await parse(dedent`
                class C {
                    static {
                        init()
                    }
                }
            `)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("init")
        })

        it("traverses class with getter and setter", async () => {
            const module = await parse(dedent`
                const obj = {
                    get value() { return internal },
                    set value(v) { assign(v) }
                }
            `)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("internal")
            expect(names).toContain("assign")
        })

        it("traverses object method property", async () => {
            const module = await parse(dedent`
                const obj = {
                    greet() { return greeting }
                }
            `)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("greeting")
        })

        it("traverses super property expression in class method", async () => {
            const module = await parse(dedent`
                class Child extends Parent {
                    m() {
                        return super.getValue()
                    }
                }
            `)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("SuperPropExpression")
        })

        it("traverses this expression", async () => {
            const module = await parse(dedent`
                class C {
                    m() {
                        return this
                    }
                }
            `)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("ThisExpression")
        })

        it("traverses meta property (new.target)", async () => {
            const module = await parse(dedent`
                function f() {
                    return new.target
                }
            `)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("MetaProperty")
        })
    })

    describe("JSX traversal", () => {
        it("traverses JSX element with identifier name", async () => {
            const module = await parseTsx(`const el = <div className={styles}>Hello</div>`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("JSXElement")
            expect(nodeTypes).toContain("JSXOpeningElement")
        })

        it("traverses JSX fragment", async () => {
            const module = await parseTsx(`const el = <><span>A</span><span>B</span></>`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("JSXFragment")
        })

        it("traverses JSX member expression name", async () => {
            const module = await parseTsx(`const el = <Comp.Sub />`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("JSXMemberExpression")
        })

        it("traverses JSX expression container with empty expression", async () => {
            const module = await parseTsx(`const el = <div>{/* comment */}</div>`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("JSXExpressionContainer")
        })

        it("traverses JSX spread attribute", async () => {
            const module = await parseTsx(`const el = <div {...props} />`)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("props")
        })

        it("traverses JSX attribute with value", async () => {
            const module = await parseTsx(`const el = <input value={x} />`)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("x")
        })

        it("traverses JSX children including spread child", async () => {
            const module = await parseTsx(`const el = <div>{...items}</div>`)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("items")
        })

        it("traverses JSX namespaced name", async () => {
            const module = await parseTsx(`const el = <svg:circle />`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("JSXNamespacedName")
        })
    })

    describe("TS module/namespace declarations", () => {
        it("traverses ts module declaration", async () => {
            const module = await parse(dedent`
                declare module "some-module" {
                    export const x: string
                }
            `)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("TsModuleDeclaration")
        })

        it("traverses ts namespace declaration", async () => {
            const module = await parse(dedent`
                namespace MyNS {
                    export const val = 1
                }
            `)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("TsModuleDeclaration")
        })
    })

    describe("literal types", () => {
        it("traverses null literal", async () => {
            const module = await parse(`const x = null`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("NullLiteral")
        })

        it("traverses bigint literal", async () => {
            const module = await parse(`const x = 1n`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("BigIntLiteral")
        })

        it("traverses regexp literal", async () => {
            const module = await parse(`const r = /hello/g`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("RegExpLiteral")
        })
    })

    describe("interface type elements", () => {
        it("traverses call signature in interface", async () => {
            const module = await parse(dedent`
                interface Callable {
                    (x: number): string
                }
            `)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("TsCallSignatureDeclaration")
        })

        it("traverses construct signature in interface", async () => {
            const module = await parse(dedent`
                interface Constructable {
                    new (x: number): MyClass
                }
            `)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("TsConstructSignatureDeclaration")
        })

        it("traverses property signature in interface", async () => {
            const module = await parse(dedent`
                interface HasProp {
                    name: string
                }
            `)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("TsPropertySignature")
        })

        it("traverses getter signature in interface", async () => {
            const module = await parse(dedent`
                interface WithGetter {
                    get value(): string
                }
            `)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("TsGetterSignature")
        })

        it("traverses setter signature in interface", async () => {
            const module = await parse(dedent`
                interface WithSetter {
                    set value(v: string)
                }
            `)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("TsSetterSignature")
        })

        it("traverses index signature in interface", async () => {
            const module = await parse(dedent`
                interface Dict {
                    [key: string]: unknown
                }
            `)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("TsIndexSignature")
        })
    })

    describe("additional statement and expression coverage", () => {
        it("traverses break with label", async () => {
            const module = await parse(dedent`
                outer: for (const x of xs) {
                    if (cond) break outer
                }
            `)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("outer")
            expect(names).toContain("cond")
        })

        it("traverses super computed property expression", async () => {
            const module = await parse(dedent`
                class C extends B {
                    m() {
                        return super[key]
                    }
                }
            `)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("key")
        })

        it("traverses object shorthand property (Identifier in property)", async () => {
            const module = await parse(`const o = { x, y }`)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("x")
            expect(names).toContain("y")
        })

        it("traverses computed property name in object", async () => {
            const module = await parse(`const o = { [key]: value }`)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("key")
            expect(names).toContain("value")
        })

        it("traverses assignment pattern in function params", async () => {
            const module = await parse(dedent`
                function f(x = defaultVal) {
                    return x
                }
            `)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("defaultVal")
        })

        it("traverses for-in with pattern left side", async () => {
            const module = await parse(dedent`
                for (key in obj) {
                    use(key)
                }
            `)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("key")
            expect(names).toContain("obj")
        })

        it("traverses empty class member statement", async () => {
            const module = await parse(dedent`
                class C {
                    ;
                    m() {}
                }
            `)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("EmptyStatement")
        })

        it("traverses ts import equals declaration", async () => {
            const module = await parse(`import foo = require("some-module")`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("TsImportEqualsDeclaration")
        })

        it("traverses export default interface declaration", async () => {
            const module = await parse(dedent`
                export default interface MyInterface {
                    x: string
                }
            `)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("TsInterfaceDeclaration")
        })
    })

    describe("additional export/import declarations", () => {
        it("traverses export assignment (export = value)", async () => {
            const module = await parse(`export = myValue`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("TsExportAssignment")
        })

        it("traverses namespace export declaration (export as namespace)", async () => {
            const module = await parse(`export as namespace MyNS`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("TsNamespaceExportDeclaration")
        })

        it("traverses import equals with namespace reference (non-require)", async () => {
            const module = await parse(`import foo = SomeNamespace`)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("foo")
            expect(names).toContain("SomeNamespace")
        })
    })

    describe("additional statement coverage", () => {
        it("traverses for-of with expression (non-declaration) left", async () => {
            const module = await parse(dedent`
                for (x of arr) {
                    use(x)
                }
            `)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("x")
            expect(names).toContain("arr")
        })
    })

    describe("additional expression coverage", () => {
        it("traverses generic call expression with type arguments", async () => {
            const module = await parse(`fn<string>(arg)`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("TsTypeParameterInstantiation")
        })

        it("traverses generic new expression with type arguments", async () => {
            const module = await parse(`new Foo<string>(arg)`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("TsTypeParameterInstantiation")
        })

        it("traverses super() call in constructor", async () => {
            const module = await parse(dedent`
                class C extends B {
                    constructor() { super(arg) }
                }
            `)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("arg")
        })

        it("traverses dynamic import() expression", async () => {
            const module = await parse(`import("./module")`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("CallExpression")
        })

        it("traverses arrow function with return type annotation", async () => {
            const module = await parse(`const f = (): string => value`)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("value")
        })

        it("traverses arrow function with type parameters", async () => {
            const module = await parse(`const f = <T>(x: T): T => x`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("TsTypeParameterDeclaration")
        })

        it("traverses tagged template expression with type parameters", async () => {
            const module = await parse("fn<string>`hello ${world}`")

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("world")
        })

        it("traverses numeric property key in object literal", async () => {
            const module = await parse(`const o = { 0: val }`)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("val")
        })

        it("traverses getter property with return type annotation", async () => {
            const module = await parse(dedent`
                const obj = {
                    get value(): string { return internal }
                }
            `)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("internal")
        })

        it("traverses array destructuring with rest element", async () => {
            const module = await parse(`const [a, ...rest] = arr`)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("arr")
        })
    })

    describe("additional class coverage", () => {
        it("traverses class with type parameters and generic superclass", async () => {
            const module = await parse(dedent`
                class C<T> extends Base<string> implements IPet<T> {
                    m() { return value }
                }
            `)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("C")
            expect(names).toContain("Base")
            expect(names).toContain("IPet")
        })

        it("traverses constructor with plain (non-access-modified) parameters", async () => {
            const module = await parse(dedent`
                class C {
                    constructor(x: string, y: number) {}
                }
            `)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("Constructor")
        })

        it("traverses constructor parameter property with default value", async () => {
            const module = await parse(dedent`
                class C {
                    constructor(private x = defaultVal) {}
                }
            `)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("defaultVal")
        })
    })

    describe("additional interface/type signature coverage", () => {
        it("traverses interface with type parameters and extends", async () => {
            const module = await parse(dedent`
                interface IFoo<T> extends IBar<T>, IBaz {
                    x: string
                }
            `)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("IFoo")
            expect(names).toContain("IBar")
            expect(names).toContain("IBaz")
        })

        it("traverses generic call signature in interface", async () => {
            const module = await parse(dedent`
                interface I {
                    <T>(x: T): void
                }
            `)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("TsCallSignatureDeclaration")
            expect(nodeTypes).toContain("TsTypeParameterDeclaration")
        })

        it("traverses generic construct signature in interface", async () => {
            const module = await parse(dedent`
                interface I {
                    new <T>(): T
                }
            `)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("TsConstructSignatureDeclaration")
            expect(nodeTypes).toContain("TsTypeParameterDeclaration")
        })

        it("traverses generic method signature in interface", async () => {
            const module = await parse(dedent`
                interface I {
                    fn<T>(x: T): T
                }
            `)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("TsMethodSignature")
            expect(nodeTypes).toContain("TsTypeParameterDeclaration")
        })

        it("traverses function type with array/rest/object pattern parameters", async () => {
            const module = await parse(dedent`
                type F1 = ([a, b]: [string, number]) => void
                type F2 = ({ x }: { x: string }) => void
                type F3 = (...args: string[]) => void
            `)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("ArrayPattern")
            expect(nodeTypes).toContain("ObjectPattern")
            expect(nodeTypes).toContain("RestElement")
        })
    })

    describe("additional TS type nodes", () => {
        it("traverses TS function type", async () => {
            const module = await parse(`type Fn = (x: string) => number`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("TsFunctionType")
        })

        it("traverses TS constructor type", async () => {
            const module = await parse(`type Ctor = new (x: string) => MyClass`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("TsConstructorType")
        })

        it("traverses TS parenthesized type", async () => {
            const module = await parse(`type T = (string | number)[]`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("TsParenthesizedType")
        })

        it("traverses TS tuple type with rest type element", async () => {
            const module = await parse(`type T = [string, ...number[]]`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("TsTupleType")
            expect(nodeTypes).toContain("TsRestType")
        })

        it("traverses TS type literal", async () => {
            const module = await parse(`type T = { x: string; y: number }`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("TsTypeLiteral")
        })

        it("traverses TS type query (typeof)", async () => {
            const module = await parse(`type T = typeof myValue`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("TsTypeQuery")
        })

        it("traverses TS template literal type", async () => {
            const module = await parse("type T = `hello-${string}`")

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("TsLiteralType")
        })
    })

    describe("TS type coverage", () => {
        it("traverses TS this type (in method return type)", async () => {
            const module = await parse(dedent`
                interface Builder {
                    add(x: string): this
                }
            `)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("TsThisType")
        })

        it("traverses TS optional type in tuple", async () => {
            const module = await parse(`type T = [string?, number?]`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("TsOptionalType")
        })

        it("traverses named tuple element", async () => {
            const module = await parse(`type T = [name: string, age: number]`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("TsTupleType")
            expect(nodeTypes).toContain("TsKeywordType")
        })

        it("traverses TS import type", async () => {
            const module = await parse(`type T = import("./module").MyType`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("TsImportType")
        })

        it("traverses TS function type with type parameters", async () => {
            const module = await parse(`type Fn = <T>(x: T) => T`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("TsFunctionType")
            expect(nodeTypes).toContain("TsTypeParameterDeclaration")
        })

        it("traverses TS constructor type with type parameters", async () => {
            const module = await parse(`type Ctor = new <T>() => T`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("TsConstructorType")
            expect(nodeTypes).toContain("TsTypeParameterDeclaration")
        })

        it("traverses TS type reference with type parameters", async () => {
            const module = await parse(`type T = Array<string>`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("TsTypeReference")
            expect(nodeTypes).toContain("TsTypeParameterInstantiation")
        })

        it("traverses mapped type with name type (as clause)", async () => {
            const module = await parse(`type T = { [K in keyof M as K extends string ? K : never]: M[K] }`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("TsMappedType")
            expect(nodeTypes).toContain("TsConditionalType")
        })

        it("traverses TS type alias with default type parameter", async () => {
            const module = await parse(`type Fn<T = string> = T`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("TsTypeParameterDeclaration")
        })

        it("traverses TS literal types: numeric, boolean, bigint", async () => {
            const module = await parse(`type T = 42 | true | 1n`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("TsLiteralType")
            expect(nodeTypes).toContain("NumericLiteral")
            expect(nodeTypes).toContain("BooleanLiteral")
            expect(nodeTypes).toContain("BigIntLiteral")
        })

        it("traverses TS this type in type predicate", async () => {
            const module = await parse(dedent`
                interface Validator {
                    check(x: any): this is string
                }
            `)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("TsTypePredicate")
            expect(nodeTypes).toContain("TsThisType")
        })

        it("traverses enum with string member values", async () => {
            const module = await parse(`enum Color { Red = "red", Green = "green" }`)

            const names: string[] = []
            visit.module(module, collectIdentifiers(names), null)

            expect(names).toContain("Color")
            expect(names).toContain("Red")
            expect(names).toContain("Green")
        })

        it("traverses nested namespace declaration", async () => {
            const module = await parse(dedent`
                namespace A {
                    namespace B {
                        export const x = 1
                    }
                }
            `)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("TsModuleDeclaration")
        })

        it("traverses typeof import type expression", async () => {
            const module = await parse(`type T = typeof import("./module")`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("TsTypeQuery")
        })

        it("traverses TS import type with type arguments", async () => {
            const module = await parse(`type T = import("./module").MyGeneric<string>`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("TsImportType")
            expect(nodeTypes).toContain("TsTypeParameterInstantiation")
        })

        it("traverses namespace with dotted name (namespace A.B syntax)", async () => {
            const module = await parse(dedent`
                namespace A.B {
                    export const x = 1
                }
            `)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("TsModuleDeclaration")
        })

        it("traverses bigint literal type", async () => {
            const module = await parse(`type T = 1n`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("BigIntLiteral")
        })
    })

    describe("additional JSX coverage", () => {
        it("traverses JSX attribute with string literal value", async () => {
            const module = await parseTsx(`const el = <div className="hello" />`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("JSXAttribute")
            expect(nodeTypes).toContain("StringLiteral")
        })

        it("traverses JSX attribute with JSX element value", async () => {
            const module = await parseTsx(`const el = <div label=<span>text</span> />`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("JSXElement")
        })

        it("traverses JSX element containing a fragment child", async () => {
            const module = await parseTsx(`const el = <div><></></div>`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("JSXFragment")
        })

        it("traverses nested JSX member expression name (A.B.C)", async () => {
            const module = await parseTsx(`const el = <A.B.C />`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("JSXMemberExpression")
        })

        it("traverses JSX element with type arguments", async () => {
            const module = await parseTsx(`const el = <Comp<string> />`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("TsTypeParameterInstantiation")
        })

        it("traverses JSX attribute with namespaced name", async () => {
            const module = await parseTsx(`const el = <div ns:attr="val" />`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("JSXNamespacedName")
        })

        it("traverses JSX attribute with fragment value", async () => {
            const module = await parseTsx(`const el = <div attr=<></> />`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("JSXFragment")
            expect(nodeTypes).toContain("JSXAttribute")
        })
    })

    describe("additional enum and property coverage", () => {
        it("traverses enum with string literal member name (declare enum)", async () => {
            const module = await parse(dedent`
                declare enum E {
                    "str-key" = 1
                }
            `)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("TsEnumDeclaration")
        })
    })

    describe("private class members", () => {
        it("traverses class with private property and private method", async () => {
            const module = await parse(dedent`
                class Foo {
                    #x = 1
                    #method() { return this.#x }
                }
            `)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("PrivateProperty")
            expect(nodeTypes).toContain("PrivateMethod")
            expect(nodeTypes).toContain("PrivateName")
        })
    })

    describe("export specifier with string literal name", () => {
        it("traverses export with string literal in specifier orig", async () => {
            const module = await parse(`export { "foo" as bar } from "./module"`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("StringLiteral")
            expect(nodeTypes).toContain("ExportSpecifier")
        })
    })

    describe("BigInt property name", () => {
        it("traverses object literal with BigInt property key", async () => {
            const module = await parse(`const o = { 1n: val }`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("BigIntLiteral")
        })
    })

    describe("TsTypeQuery with type arguments", () => {
        it("traverses typeof expression with type arguments", async () => {
            const module = await parse(`type T = typeof Array<string>`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("TsTypeQuery")
            expect(nodeTypes).toContain("TsTypeParameterInstantiation")
        })
    })

    describe("class and parameter decorators", () => {
        it("traverses class with decorator", async () => {
            const module = await parseWithDecorators(`@decorator class Foo {}`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("Decorator")
            expect(nodeTypes).toContain("ClassDeclaration")
        })

        it("traverses class property with decorator", async () => {
            const module = await parseWithDecorators(dedent`
                class Foo {
                    @dec x = 1
                }
            `)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("Decorator")
            expect(nodeTypes).toContain("ClassProperty")
        })

        it("traverses function parameter with decorator", async () => {
            const module = await parseWithDecorators(`function f(@dec x: string) {}`)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("Decorator")
            expect(nodeTypes).toContain("Parameter")
        })

        it("traverses constructor parameter property with decorator", async () => {
            const module = await parseWithDecorators(dedent`
                class Foo {
                    constructor(@dec private x: string) {}
                }
            `)

            const nodeTypes: string[] = []
            visit.module(
                module,
                {
                    any(node, context) {
                        nodeTypes.push((node as { type: string }).type)
                        context.descend(context.context)
                    },
                },
                null,
            )

            expect(nodeTypes).toContain("Decorator")
            expect(nodeTypes).toContain("TsParameterProperty")
        })
    })
})