import { styled } from "@mochi-css/vanilla-react"
import { createToken } from "@mochi-css/vanilla"
import type { FC, ReactNode } from "react"

const Root = styled("main", {
    width: "100vw",
    height: "100vh",
    overflow: "hidden",
})

const bannerWidth = createToken("bannerWidth")
const bannerHeight = createToken("bannerHeight")

const Wrapper = styled("div", {
    width: bannerWidth.value,
    height: bannerHeight.value,
    transform: `scale(min(calc(100vw / ${bannerWidth.value}), calc(100vh / ${bannerHeight.value})))`,
    transformOrigin: "top left"
})

export type BannerContainerProps = {
    width: number
    height: number
    children?: ReactNode
}
export const BannerContainer: FC<BannerContainerProps> = ({ width, height, children }) => {
    return <Root>
        <Wrapper style={{ [`${bannerWidth}`]: `${width}px`, [`${bannerHeight}`]: `${height}px` }}>
            {children}
        </Wrapper>
    </Root>
}
