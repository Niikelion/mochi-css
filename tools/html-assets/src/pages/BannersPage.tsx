import { Link } from "wouter"
import { BANNERS } from '../components/banners.config'
import { styled } from "@mochi-css/vanilla-react"
import { css, createToken } from "@mochi-css/vanilla"

const ratio = createToken("aspectRatio")

const actionStyle = css({ fontSize: '14px' })

const PageMain = styled('main', {
    padding: '32px',
    maxWidth: 1200,
    margin: '0 auto',
})

const PageTitle = styled('h1', {
    marginBottom: '24px',
})

const BannerList = styled('div', {
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
})

const BannerHeader = styled('div', {
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'baseline',
    gap: '12px',
})

const BannerTitle = styled('h2', {
    margin: 0,
})

const BannerDescription = styled('span', {
    color: '#888',
    fontSize: '14px',
})

const BannerActions = styled('span', {
    marginLeft: 'auto',
    display: 'flex',
    gap: '8px',
})

const BannerLink = styled(Link, actionStyle)
const BannerDownload = styled('a', actionStyle)

const Frame = styled('iframe', {
    width: '100%',
    aspectRatio: ratio.value,
    border: 'none',
    display: 'block',
})

export default function BannersPage() {
    return (
        <PageMain>
            <PageTitle>Banners</PageTitle>
            <BannerList>
                {BANNERS.map((banner) => (
                    <div key={banner.id}>
                        <BannerHeader>
                            <BannerTitle>{banner.title}</BannerTitle>
                            <BannerDescription>{banner.description}</BannerDescription>
                            <BannerActions>
                                <BannerLink href={banner.route}>Open ↗</BannerLink>
                                <BannerDownload href={`/dist/banners/${banner.id}.png`} download>
                                    PNG ↓
                                </BannerDownload>
                            </BannerActions>
                        </BannerHeader>
                        <Frame
                            src={banner.route}
                            title={banner.title}
                            style={{ [ratio.variable]: `${banner.width} / ${banner.height}` }}
                        />
                    </div>
                ))}
            </BannerList>
        </PageMain>
    )
}
