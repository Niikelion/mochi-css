export const VIRTUAL_PREVIEW_ID = "virtual:mochi-pdf/preview"
export const RESOLVED_PREVIEW_ID = "\0virtual:mochi-pdf/preview"
export const DEFAULT_PREVIEW_ROUTE = "/__mochi-pdf/preview"

/** Entry module that mounts the document into the preview shell. */
export function previewModule(entry: string): string {
    return `import { createElement } from "react"
import { createRoot } from "react-dom/client"
import DocumentComponent from ${JSON.stringify(entry)}

const container = document.getElementById("mochi-pdf-root")
if (container) createRoot(container).render(createElement(DocumentComponent))
`
}

/** Shell page the preview is served from. Vite injects its client into it for HMR. */
export function previewHtml(): string {
    return `<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>PDF preview</title>
        <style>
            /* Only on screen: a printed sheet must not inherit the preview backdrop. */
            @media screen {
                body { margin: 0; background: #5b5b5b; }
            }
        </style>
    </head>
    <body>
        <div id="mochi-pdf-root"></div>
        <script type="module" src="/@id/__x00__${VIRTUAL_PREVIEW_ID}"></script>
    </body>
</html>
`
}

/** Whether `url` addresses the preview route, ignoring any query string. */
export function isPreviewRequest(url: string | undefined, route: string): boolean {
    if (url === undefined) return false
    const [pathname] = url.split("?")
    return pathname === route || pathname === `${route}/`
}
