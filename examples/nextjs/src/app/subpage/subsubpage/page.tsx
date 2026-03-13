import { styled } from "@mochi-css/react"

const Box = styled("div", {
    backgroundColor: "red",
    color: "white",
    width: 200,
    height: 200
})

export default function Subpage() {
    return <Box>Test</Box>
}
