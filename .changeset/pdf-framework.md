---
"@mochi-css/pdf": minor
"@mochi-css/tsuki": patch
---

Add `@mochi-css/pdf`, a framework for authoring PDF documents as React components.

Documents are built from `<Document>` and `<Page>`, which render as real fixed-size boxes styled
through `@mochi-css/vanilla-react`, so the on-screen preview is the same rendering that gets
printed rather than an approximation of it.

`<AutoFlow>` flows content across as many pages as it needs instead of requiring one `<Page>` per
page. Its content is laid out once in an off-screen probe page and measured against real browser
layout, so the break points match what the exported PDF produces. Breaks are taken at the finest
point the markup allows: a list or table split across pages is rewrapped so each page holds a real
list or table rather than loose rows. Content marked `break-inside: avoid` — directly or via the
`<KeepTogether>` helper — is never split, and a node whose rendered DOM does not map onto its React
children is left whole rather than split at a guessed boundary.
