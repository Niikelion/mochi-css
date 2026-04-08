import MochiWideBanner from '../../components/MochiWideBanner'
import { BannerContainer } from "../../components/BannerContainer.tsx"

export default function MochiWidePage() {
    return (
        <BannerContainer width={2560} height={640}>
            <MochiWideBanner />
        </BannerContainer>
    )
}
