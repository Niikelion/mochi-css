import BannerLeft from './BannerLeft'
import BannerGrid from './BannerGrid'
import { BannerStandard, VertText } from './styles'
import { MochiBanner as _Banner } from "./banner"

export default function MochiBanner() {
    return <_Banner />

    return (
        <BannerStandard>
            <BannerLeft />
            <BannerGrid />
            <VertText>スタイルの道</VertText>
        </BannerStandard>
    )
}
