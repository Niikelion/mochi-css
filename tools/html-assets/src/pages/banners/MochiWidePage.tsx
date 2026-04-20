import { BannerContainer } from "../../components/BannerContainer.tsx"
import { gridBackground, Layout, LeftContent, RightContent } from "../../components/banner"
import { styled } from "@mochi-css/vanilla-react"

const Left = styled(Layout.Left, {
    placeContent: "center",
    placeItems: "center"
})

const GridWrapper = styled("section", {
    display: "grid",
    gridTemplateColumns: "subgrid",
    ...gridBackground({ cell: 170 }),
})

const Right = styled(Layout.Right, {
    display: "flex",
    placeItems: "center",
    placeContent: "center",
})

export default function MochiWidePage() {
    return (
        <BannerContainer width={2560} height={640}>
            <Layout.Root>
                <Left>
                    <LeftContent />
                </Left>
                <GridWrapper>
                    <Right>
                        <RightContent />
                    </Right>
                </GridWrapper>
            </Layout.Root>
        </BannerContainer>
    )
}
