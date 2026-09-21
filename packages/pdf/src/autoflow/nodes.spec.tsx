import { Children, isValidElement, type ReactElement, type ReactNode } from "react"
import { describe, it, expect } from "vitest"
import { elementChildren, rebuild } from "./nodes"

const childrenOf = (node: ReactElement): unknown[] =>
    Children.toArray((node.props as { children?: ReactNode }).children)

describe("elementChildren", () => {
    it("returns null for a node that is not an element", () => {
        expect(elementChildren("text")).toBeNull()
    })

    it("returns null for an element without children", () => {
        expect(elementChildren(<hr />)).toBeNull()
    })

    it("flattens the children of an element", () => {
        const result = elementChildren(
            <ul>
                <li>a</li>
                <li>b</li>
            </ul>,
        )
        expect(result).toHaveLength(2)
    })
})

describe("rebuild", () => {
    const nodes = [<p key="a">a</p>, <p key="b">b</p>, <p key="c">c</p>]

    it("keeps the listed top level nodes and drops the rest", () => {
        const result = rebuild(nodes, [[0], [2]])
        expect(result).toEqual([nodes[0], nodes[2]])
    })

    it("orders nodes by their position, not by the order of the paths", () => {
        const result = rebuild(nodes, [[2], [0]])
        expect(result).toEqual([nodes[0], nodes[2]])
    })

    it("rewraps a split list so each page holds a real list", () => {
        const list = (
            <ul className="items">
                <li>one</li>
                <li>two</li>
                <li>three</li>
            </ul>
        )

        const [head] = rebuild(
            [list],
            [
                [0, 0],
                [0, 1],
            ],
        )
        const [tail] = rebuild([list], [[0, 2]])

        if (!isValidElement(head) || !isValidElement(tail)) throw new Error("expected elements")
        expect(head.type).toBe("ul")
        expect(tail.type).toBe("ul")
        expect((head.props as { className?: string }).className).toBe("items")
        expect(childrenOf(head)).toHaveLength(2)
        expect(childrenOf(tail)).toHaveLength(1)
    })

    it("keeps a node whole when its path stops at it", () => {
        const list = (
            <ul>
                <li>one</li>
                <li>two</li>
            </ul>
        )
        expect(rebuild([list], [[0]])).toEqual([list])
    })
})
