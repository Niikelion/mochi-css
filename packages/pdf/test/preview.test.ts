import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import type { AddressInfo } from "node:net"
import { createServer, type ViteDevServer } from "vite"
import { mochiPdfPreview } from "../src/vite/index"

const fixtureRoot = join(dirname(fileURLToPath(import.meta.url)), "fixture")

let server: ViteDevServer
let origin: string

beforeAll(async () => {
    server = await createServer({
        root: fixtureRoot,
        logLevel: "silent",
        server: { port: 0 },
        esbuild: { jsx: "automatic" },
        // Nothing here executes the served modules, so scanning and prebundling dependencies
        // only delays startup — and leaves an esbuild run that shutdown then has to wait on.
        optimizeDeps: { noDiscovery: true, include: [] },
        plugins: [mochiPdfPreview({ entry: "/main.tsx" })],
    })
    await server.listen()

    const address = server.httpServer?.address() as AddressInfo | null
    if (address === null) throw new Error("preview server did not start")
    origin = `http://localhost:${address.port}`
}, 60_000)

afterAll(async () => {
    await server?.close()
})

describe("mochiPdfPreview", () => {
    it("serves the preview shell on its route", async () => {
        const res = await fetch(`${origin}/__mochi-pdf/preview`)

        expect(res.ok).toBe(true)
        expect(res.headers.get("content-type")).toContain("text/html")
        expect(await res.text()).toContain("mochi-pdf-root")
    })

    it("injects the vite client, so the preview hot reloads", async () => {
        const html = await (await fetch(`${origin}/__mochi-pdf/preview`)).text()
        expect(html).toContain("/@vite/client")
    })

    it("serves a virtual entry that mounts the configured document", async () => {
        const res = await fetch(`${origin}/@id/__x00__virtual:mochi-pdf/preview`)

        expect(res.ok).toBe(true)
        const source = await res.text()
        expect(source).toContain("createRoot")
        expect(source).toContain("/main.tsx")
    })

    it("leaves other routes to the rest of the server", async () => {
        const res = await fetch(`${origin}/`)

        expect(res.ok).toBe(true)
        // The fixture's own index.html, not the preview shell.
        expect(await res.text()).not.toContain("mochi-pdf-root")
    })
})
