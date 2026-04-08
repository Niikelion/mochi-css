import BannerLeft from './BannerLeft'
import BannerGrid from './BannerGrid'
import { BannerStandard, VertText } from './styles'

export default function MochiBanner() {
    return (
        <BannerStandard>
            <BannerLeft />
            <BannerGrid />
            <VertText>スタイルの道</VertText>
        </BannerStandard>
    )
}
