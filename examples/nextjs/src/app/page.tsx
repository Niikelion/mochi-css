import {styled, css, createToken} from "@mochi-css/vanilla";

function foo() {
    const css = (_: object) => {}
    css({ test: 4 })
}

const height = createToken("height")

function bar() {
    css({ height: height })
}

const Title = styled("div", {
    height: 20,
    "@(max-width: 100px)": {
        height: 10
    },
    variants: {
        color: {
            red: {
                color: "red"
            },
            green: {
                color: "green"
            }
        }
    },
    defaultVariants: {
        color: "red"
    }
})

export default function Home() {
    foo()
    bar()

    return (
        <div>
            <Title>Test</Title>
            <Title color="green">Test</Title>
        </div>
    )
}
