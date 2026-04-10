import { JP } from "./Text.tsx"
import { styled } from "@mochi-css/vanilla-react"
import { BoxModel } from "./BoxModel.tsx"

const Box = styled(BoxModel, {
    position: "relative",
    height: "85%",
    [`& ${JP.selector}`]: {
        position: "absolute",
        right: 20,
        top: "50%",
        transform: 'translateY(-50%)',
        fontSize: "200%"
    }
})

export const RightContent = () => (
    <Box>
        <JP vertical color="dim">スタイルの道</JP>
    </Box>
)
