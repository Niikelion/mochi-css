import type { FC } from "react"
import { EN, JP } from "./Text.tsx"
import { styled } from "@mochi-css/vanilla-react"
import { Colors } from "./colors.ts"

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

export const LeftContent: FC = () => (
    <LeftGrid>
        <JP vertical color="dim" style={{ gridArea: "side" }}>もちスタイル</JP>
        <Wordmark style={{ gridArea: "top" }}>Mochi<span>.css</span></Wordmark>
        <Rule style={{ gridArea: "divider" }} />
        <Tagline style={{ gridArea: "bottom" }}>
            css-in-js &nbsp;—&nbsp; <strong>near zero runtime</strong><br />build-time extraction
        </Tagline>
    </LeftGrid>
)
