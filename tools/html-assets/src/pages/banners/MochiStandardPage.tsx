import { BannerContainer } from "../../components/BannerContainer"
import { LeftContent, RightContent, Layout } from "../../components/banner"
import { gridBackground } from "../../components/banner"
import { styled } from "@mochi-css/vanilla-react"

const Left = styled(Layout.Left, {
    placeContent: "center",
    placeItems: "center"
})

const Right = styled(Layout.Right, {
    display: "flex",
    placeItems: "center",
    placeContent: "center",
    ...gridBackground({ cell: 170 }),
})

export default function MochiStandardPage() {
    return (
        <BannerContainer width={1280} height={640}>
            <Layout.Root>
                <Left>
                    <LeftContent />
                </Left>
                <Right>
                    <RightContent />
                </Right>
            </Layout.Root>
        </BannerContainer>
    )
}
