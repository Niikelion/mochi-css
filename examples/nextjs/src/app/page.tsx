import {styled, css, createToken, CssLength} from "@mochi-js/styling";

function foo() {
    const css = (_: object) => {}
    css({ test: 4 })
}

const height = createToken<CssLength>("height")

function bar() {
    css({ height: height })
}

const Title = styled("div", {
    height: 20,
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
