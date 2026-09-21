---
"@mochi-css/pdf": minor
"@mochi-css/tsuki": patch
---

Add `@mochi-css/pdf`, a framework for authoring PDF documents as React components.

Documents are built from `<Document>` and `<Page>`, which render as real fixed-size boxes styled
through `@mochi-css/vanilla-react`. `<Document>` also emits the `@page` rule that sizes the printed
sheet, so the preview, printing from the browser and exporting all produce the same result rather
than three approximations of each other.

`<AutoFlow>` flows content across as many pages as it needs instead of requiring one `<Page>` per
page. Its content is laid out once in an off-screen probe page and measured against real browser
layout, so the break points match what the exported PDF produces. Breaks are taken at the finest
point the markup allows: a list or table split across pages is rewrapped so each page holds a real
list or table rather than loose rows, and a paragraph too tall for one page breaks between its own
line boxes and continues on the next without losing or repeating text, never stranding fewer than
two lines on either side of the break. Content marked
`break-inside: avoid` — directly or via the `<KeepTogether>` helper — is never split, and a node
whose rendered DOM does not map onto its React children is left whole rather than split at a
guessed boundary.

`<Document>` takes `header` and `footer` slots that repeat on every page, either as fixed content or
as a function receiving the page's number and the document's total. Running content takes its space
from the page, so flowed content reflows into what is left rather than being drawn over.

`@mochi-css/pdf/export` adds `renderToPdf`, which drives a page you already serve through headless
Chromium, waiting for fonts and for pagination to settle before printing. `@mochi-css/pdf/vite` adds
`mochiPdfPreview`, a dev-server plugin serving the document as a stack of page-shaped boxes that
repaginates on hot reload. `playwright` and `vite` are optional peer dependencies, needed only by
the entry point that uses them.
