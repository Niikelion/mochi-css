import { createRef, forwardRef, type ComponentPropsWithoutRef } from "react"
import { styled } from "@mochi-css/vanilla-react"

const Button = styled("button", { variants: { tone: { loud: { color: "red" }, quiet: { color: "blue" } } } })
const buttonRef = createRef<HTMLButtonElement>()
;<Button ref={buttonRef} tone="loud" onClick={(event) => event.currentTarget.focus()}>
    button
</Button>
;<Button
    ref={(node) => {
        node?.focus()
    }}
    tone="quiet"
/>
// @ts-expect-error Invalid variant must remain rejected.
;<Button tone="missing" />
// @ts-expect-error Refs must match the target element.
;<Button ref={createRef<HTMLDivElement>()} />
const Input = forwardRef<HTMLInputElement, ComponentPropsWithoutRef<"input">>((props, ref) => (
    <input {...props} ref={ref} />
))
const StyledInput = styled(Input, { color: "red" })
;<StyledInput ref={createRef<HTMLInputElement>()} defaultValue="hello" />
const Nested = styled(Button, { padding: 4 })
;<Nested ref={buttonRef} tone="loud" />
const selector: string = Nested.selector
void selector
