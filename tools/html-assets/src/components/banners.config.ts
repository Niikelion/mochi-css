export interface BannerMeta {
    id: string
    title: string
    description: string
    route: string
    width: number
    height: number
}

export const BANNERS: BannerMeta[] = [
    {
        id: 'mochi-standard',
        title: 'Standard Banner',
        description: '2:1 — GitHub README, project pages',
        route: '/banners/mochi-standard',
        width: 1280,
        height: 640,
    },
    {
        id: 'mochi-wide',
        title: 'Wide Banner',
        description: '4:1 — Twitter/X header, site hero',
        route: '/banners/mochi-wide',
        width: 2560,
        height: 640,
    },
]
