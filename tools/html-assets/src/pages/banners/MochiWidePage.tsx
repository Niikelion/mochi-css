import { BannerContainer } from "../../components/BannerContainer.tsx";
import {
    gridBackground,
    Layout,
    LeftContent,
    MiddleContent,
    RightContent,
} from "../../components/banner";
import { styled } from "@mochi-css/vanilla-react";

const Left = styled(Layout.Left, {
    placeContent: "center",
    placeItems: "center",
});

const GridWrapper = styled("section", {
    gridColumn: "2 / 4",
    display: "grid",
    gridTemplateColumns: "subgrid",
    columnGap: 170,
    ...gridBackground({ cell: 170 }),
});

const Middle = styled(Layout.Middle, {
    gridArea: "auto",
});

const Right = styled(Layout.Right, {
    gridArea: "auto",
    display: "flex",
    placeItems: "center",
    placeContent: "center",
});

export default function MochiWidePage() {
    return (
        <BannerContainer width={2560} height={640}>
            <Layout.Root>
                <Left>
                    <LeftContent />
                </Left>
                <GridWrapper>
                    <Middle>
                        <MiddleContent />
                    </Middle>
                    <Right>
                        <RightContent />
                    </Right>
                </GridWrapper>
            </Layout.Root>
        </BannerContainer>
    );
}
