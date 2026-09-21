import type { Plugin } from "vite"
import {
    DEFAULT_PREVIEW_ROUTE,
    RESOLVED_PREVIEW_ID,
    VIRTUAL_PREVIEW_ID,
    isPreviewRequest,
    previewHtml,
    previewModule,
} from "./preview"

export type MochiPdfPreviewOptions = {
    /** Module whose default export is the document component. Default: `/src/document.tsx`. */
    entry?: string
    /** Route the preview is served from. Default: `/__mochi-pdf/preview`. */
    route?: string
}

/**
 * Serves a live preview of a `<Document>` as a stack of page-shaped boxes.
 *
 * The preview is an ordinary page rendering ordinary components, so editing the document hot
 * reloads through React Fast Refresh like any other module — and because the same markup is what
 * gets printed, what it shows is what `renderToPdf` produces.
 *
 * It does not extract CSS; run it alongside `@mochi-css/vite`, which does.
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import { defineConfig } from "vite"
 * import { mochiCss } from "@mochi-css/vite"
 * import { mochiPdfPreview } from "@mochi-css/pdf/vite"
 *
 * export default defineConfig({
 *     plugins: [mochiCss(), mochiPdfPreview({ entry: "/src/invoice.tsx" })],
 * })
 * ```
 */
export function mochiPdfPreview(options: MochiPdfPreviewOptions = {}): Plugin {
    const entry = options.entry ?? "/src/document.tsx"
    const route = options.route ?? DEFAULT_PREVIEW_ROUTE

    return {
        name: "mochi-pdf-preview",

        resolveId(id) {
            return id === VIRTUAL_PREVIEW_ID ? RESOLVED_PREVIEW_ID : undefined
        },

        load(id) {
            return id === RESOLVED_PREVIEW_ID ? previewModule(entry) : undefined
        },

        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                if (!isPreviewRequest(req.url, route)) {
                    next()
                    return
                }

                server
                    .transformIndexHtml(req.url ?? route, previewHtml())
                    .then((html) => {
                        res.setHeader("Content-Type", "text/html")
                        res.end(html)
                    })
                    .catch((error: unknown) => {
                        next(error)
                    })
            })
        },
    }
}

export { DEFAULT_PREVIEW_ROUTE, VIRTUAL_PREVIEW_ID } from "./preview"
