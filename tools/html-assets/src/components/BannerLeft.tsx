import { JpVertLeft, LeftSection, Rule, Tagline, Wordmark } from './styles'

export default function BannerLeft() {
    return (
        <LeftSection>
            <div style={{ display: 'flex', alignItems: 'stretch' }}>
                <JpVertLeft>もちスタイル</JpVertLeft>
                <div>
                    <Wordmark>Mochi<span>.css</span></Wordmark>
                    <Rule />
                    <Tagline>css-in-js &nbsp;—&nbsp; <strong>near zero runtime</strong><br />build-time extraction</Tagline>
                </div>
            </div>
        </LeftSection>
    )
}
