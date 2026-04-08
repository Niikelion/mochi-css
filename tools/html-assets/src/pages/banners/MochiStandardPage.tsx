import MochiBanner from '../../components/MochiBanner'
import { BannerContainer } from "../../components/BannerContainer.tsx"

export default function MochiStandardPage() {
    return (
        <BannerContainer width={1280} height={640}>
            <MochiBanner />
        </BannerContainer>
    )
}
