import assert from "node:assert/strict"
import { createRequire } from "node:module"
import { Window } from "happy-dom"
import React, { Component, createElement as h, createRef, forwardRef } from "react"
import { styled } from "@mochi-css/vanilla-react"

const window = new Window()
Object.assign(globalThis, { window, document: window.document, HTMLElement: window.HTMLElement })
const { createRoot } = await import("react-dom/client")
const { flushSync } = await import("react-dom")
const { renderToString } = await import("react-dom/server")
const container = document.createElement("div")
document.body.append(container)
const root = createRoot(container)
const render = (element) => flushSync(() => root.render(element))

const Button = styled("button", { color: "red", variants: { tone: { loud: { color: "blue" } } } })
const ref = createRef()
let clicks = 0
render(h(Button, { ref, tone: "loud", className: "custom", onClick: () => clicks++ }, "click"))
assert.equal(ref.current, container.firstChild)
assert.equal(ref.current.textContent, "click")
assert.equal(ref.current.hasAttribute("tone"), false)
assert.ok(ref.current.className.includes("custom"))
assert.ok(ref.current.classList.length >= 3)
assert.equal(String(Button), Button.selector)
ref.current.click()
assert.equal(clicks, 1)

const Nested = styled(Button, { padding: 4 })
render(h(Nested, { ref }, "nested"))
assert.equal(ref.current, container.firstChild)
assert.equal(ref.current.textContent, "nested")

const Input = styled(
    forwardRef((props, ref) => h("input", { ...props, ref })),
    { color: "red" },
)
const callbacks = []
render(
    h(Input, {
        ref: (value) => {
            callbacks.push(value)
        },
        defaultValue: "input",
    }),
)
assert.equal(callbacks.at(-1), container.firstChild)
assert.equal(container.firstChild.value, "input")
render(null)
assert.equal(callbacks.at(-1), null)

class Target extends Component {
    render() {
        return h("div", this.props)
    }
}
const StyledClass = styled(Target, { color: "blue" })
render(h(StyledClass, { ref }))
assert.ok(ref.current instanceof Target)
render(null)
assert.equal(ref.current, null)

// React 19's ref-as-prop targets and callback cleanup must keep working too.
if (React.version.startsWith("19.")) {
    const Modern = styled((props) => h("input", props), { color: "red" })
    let cleaned = false
    render(
        h(Modern, {
            ref: (node) => {
                assert.equal(node.tagName, "INPUT")
                return () => {
                    cleaned = true
                }
            },
        }),
    )
    render(null)
    assert.equal(cleaned, true)
}
assert.match(renderToString(h(Button, { tone: "loud" }, "server")), /server/)
const { styled: cjsStyled } = createRequire(import.meta.url)("@mochi-css/vanilla-react")
render(h(cjsStyled("button", { color: "red" }), { ref }, "commonjs"))
assert.equal(ref.current, container.firstChild)
flushSync(() => root.unmount())
assert.equal(ref.current, null)
await window.happyDOM.close()
console.log(`React ${React.version}: refs, events, variants, nesting, SSR, and CJS passed`)
