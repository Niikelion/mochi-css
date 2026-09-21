# @mochi-css/pdf

Author PDFs as React components, preview them live, and export them with real browser rendering.

Pages are real DOM boxes styled with [`@mochi-css/vanilla-react`](../vanilla-react). The preview you
edit and the PDF you ship are produced by the same engine, so what you see is what gets printed —
there is no second layout engine to disagree with the browser.

## Install

```sh
yarn add @mochi-css/pdf
```

`playwright` is needed only to export (`@mochi-css/pdf/export`) and `vite` only for the dev preview
(`@mochi-css/pdf/vite`). Both are optional peer dependencies.

```sh
yarn add -D playwright && yarn playwright install chromium
```

## Writing a document

```tsx
import { Document, Page } from "@mochi-css/pdf"

export default function Invoice() {
    return (
        <Document size="a4" margin="20mm">
            <Page>
                <h1>Invoice #421</h1>
            </Page>
            <Page>
                <p>Terms and conditions…</p>
            </Page>
        </Document>
    )
}
```

`<Document>` sets the defaults every `<Page>` inherits, and emits the `@page` rule that sizes the
printed sheet. Any `<Page>` can override `size`, `orientation` or `margin` on its own.

Sizes are `a3`, `a4`, `a5`, `letter`, `legal`, `tabloid`, or explicit dimensions
(`{ width: "120mm", height: "200mm" }`). Margins take one value or per-side values; bare numbers
mean pixels.

## Flowing content across pages

`<AutoFlow>` paginates instead of making you place every page by hand:

```tsx
import { AutoFlow, Document, KeepTogether } from "@mochi-css/pdf"

;<Document size="a4" margin="20mm">
    <AutoFlow>
        <h1>Annual report</h1>
        {sections.map(section => (
            <KeepTogether key={section.id}>
                <h2>{section.title}</h2>
                <p>{section.body}</p>
            </KeepTogether>
        ))}
    </AutoFlow>
</Document>
```

The content is laid out once in an off-screen probe page and measured, so the breaks come from real
browser layout rather than an estimate. Breaks are taken at the finest point the markup allows, and
ancestors are rewrapped — a table split across pages is a real table on both, not loose rows.

A paragraph too tall for one page breaks between its own lines and continues on the next, using the
line boxes the browser already produced. No text is lost or repeated across the break.

Content is never split when it is marked `break-inside: avoid`, either through `<KeepTogether>` or
plain CSS. Pagination re-runs when content changes and when late webfonts or images shift the
layout.

Three limits worth knowing:

- Only a block whose content is a single run of text breaks mid-block. One containing inline markup
  (`<strong>`, a link) is treated as one unit, so if it is taller than a page it is placed alone and
  allowed to overflow.
- A component whose rendered DOM does not map one-to-one onto its React children — one returning a
  fragment, for example — is treated as unsplittable. Breaking it would mean guessing which element
  matched which child, so it is left whole instead.
- There is no widow and orphan control yet, so a break can leave a single line of a paragraph alone
  at the foot or head of a page.

## Previewing with hot reload

```ts
// vite.config.ts
import { defineConfig } from "vite"
import { mochiCss } from "@mochi-css/vite"
import { mochiPdfPreview } from "@mochi-css/pdf/vite"

export default defineConfig({
    plugins: [mochiCss(), mochiPdfPreview({ entry: "/src/invoice.tsx" })],
})
```

The preview is served at `/__mochi-pdf/preview` and shows the document as a stack of page-shaped
boxes. It is an ordinary page rendering ordinary components, so edits hot reload through React Fast
Refresh, repaginating as you type.

`entry` points at a module whose default export is the document. Run the preview plugin alongside
`@mochi-css/vite`, which does the CSS extraction — the preview plugin does not.

## Exporting

```ts
import { renderToPdf } from "@mochi-css/pdf/export"

await renderToPdf("http://localhost:5173/__mochi-pdf/preview", { outputPath: "invoice.pdf" })
```

`renderToPdf` drives a page you already serve rather than re-rendering the document in isolation,
so the export uses the same CSS your app does. It waits for the document to appear, for fonts to
load, and for pagination to stop changing before printing.

Exporting several documents? Pass a `browser` to reuse one instead of launching Chromium per call —
you then own closing it.

```ts
import { chromium } from "playwright"

const browser = await chromium.launch()
try {
    for (const doc of documents) {
        await renderToPdf(doc.url, { browser, outputPath: doc.out })
    }
} finally {
    await browser.close()
}
```

## API

| Export | From | Purpose |
| --- | --- | --- |
| `Document` | `@mochi-css/pdf` | Document root; page defaults and the `@page` rule |
| `Page` | `@mochi-css/pdf` | One page |
| `AutoFlow` | `@mochi-css/pdf` | Flows content across as many pages as it needs |
| `KeepTogether` | `@mochi-css/pdf` | Marks content as unsplittable |
| `PAGE_SIZES`, `resolvePageSize`, `resolvePageMargin` | `@mochi-css/pdf` | Page geometry helpers |
| `mochiPdfPreview` | `@mochi-css/pdf/vite` | Dev preview plugin |
| `renderToPdf` | `@mochi-css/pdf/export` | Renders a served document to a PDF |
