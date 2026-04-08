import { chromium } from 'playwright'
import { preview, type PreviewServer } from 'vite'
import { mkdir } from 'node:fs/promises'
import { BANNERS } from '../src/components/banners.config'

const PORT = 4444
const BASE_URL = `http://localhost:${PORT}`
const OUT_DIR = 'dist/banners'

function parseArgs() {
    const args = process.argv.slice(2)
    const idFlag = args.indexOf('--id')
    const id = idFlag !== -1 ? args[idFlag + 1] : undefined
    const noServer = args.includes('--no-server')
    return { id, noServer }
}

function startServer(): Promise<PreviewServer> {
    return preview({ preview: { port: PORT, open: false }, configFile: false })
}

async function main() {
    const { id, noServer } = parseArgs()

    const banners = id ? BANNERS.filter((b) => b.id === id) : BANNERS
    if (banners.length === 0) {
        console.error(`No banner found with id "${id ?? ''}"`)
        process.exit(1)
    }

    let server: PreviewServer | undefined
    if (!noServer) {
        console.log('Starting vite preview...')
        server = await startServer()
        console.log(`Server ready at ${BASE_URL}`)
    }

    await mkdir(OUT_DIR, { recursive: true })

    const browser = await chromium.launch()
    const page = await browser.newPage()

    try {
        for (const banner of banners) {
            const url = `${BASE_URL}${banner.route}`
            console.log(`Capturing ${banner.id} (${banner.width}×${banner.height})...`)
            await page.setViewportSize({ width: banner.width, height: banner.height })
            await page.goto(url, { waitUntil: 'networkidle' })
            await page.evaluate(() => document.fonts.ready)
            const path = `${OUT_DIR}/${banner.id}.png`
            await page.screenshot({ path, fullPage: false })
            console.log(`  → ${path}`)
        }
    } finally {
        console.log("Closing browser...")
        await page.close()
        await browser.close()
        if (server) {
            console.log("Closing server...")
            await server.close()
        }
        console.log("Done!")
    }
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
