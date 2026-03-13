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
