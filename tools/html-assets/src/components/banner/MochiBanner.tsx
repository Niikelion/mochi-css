import { Layout } from "./Layout.ts"
import { styled } from "@mochi-css/vanilla-react"
import { EN, JP } from "./Text.tsx"
import { Colors } from "./colors.ts"
import { BoxModel } from "./BoxModel.tsx"
import { gridBackground } from "./gridBackground"

const Root = styled(Layout.Root, {
    width: 1280,
    height: 640
})

const Left = styled(Layout.Left, {
    placeContent: "center",
    placeItems: "center"
})

const LeftGrid = styled("section", {
    display: "grid",
    gridTemplateAreas: `"side top" "side divider" "side bottom"`,
    gridTemplateRows: "auto 1fr auto",
    columnGap: "10px",
    rowGap: "20px"
})

const Wordmark = styled(EN, {
    textBox: "trim-both cap alphabetic",
    fontWeight: 700,
    fontSize: '88px',
    padding: "4px 0",
    '& span': {
        color: '#c9a84c',
        fontWeight: 300,
        fontSize: '0.42em',
        letterSpacing: '0.05em',
        paddingLeft: '0.12em',
    },
})

const Rule = styled('div', {
    width: '72px',
    height: 1,
    alignSelf: "center",
    backgroundColor: Colors.dim,
})

const Tagline = styled('p', {
    fontWeight: 300,
    fontSize: '13px',
    color: '#5a5040',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    margin: 0,
    '& strong': {
        color: '#c9a84c',
        fontWeight: 400,
    },
})

const Right = styled(Layout.Right, {
    display: "flex",
    placeItems: "center",
    placeContent: "center",
    ...gridBackground({ cell: 170 }),
})

const JPSelector = JP.selector

const Box = styled(BoxModel, {
    position: "relative",
    height: "85%",
    [`& ${JPSelector}`]: {
        position: "absolute",
        right: 0,
        top: "50%",
        transform: 'translateY(-50%)',
    }
})

export const MochiBanner = () => {
    return (
        <Root>
            <Left>
                <LeftGrid>
                    <JP vertical color="dim" style={{ gridArea: "side" }}>もちスタイル</JP>
                    <Wordmark style={{ gridArea: "top" }}>Mochi<span>.css</span></Wordmark>
                    <Rule style={{ gridArea: "divider" }} />
                    <Tagline style={{ gridArea: "bottom" }}>
                        css-in-js &nbsp;—&nbsp; <strong>near zero runtime</strong><br />build-time extraction
                    </Tagline>
                </LeftGrid>
            </Left>
            <Right>
                <Box>
                    <JP vertical>スタイルの道</JP>
                </Box>
            </Right>
        </Root>
    )
}
