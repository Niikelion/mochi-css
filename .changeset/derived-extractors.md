---
"@mochi-css/builder": minor
---

Add derived extractor support.
`StyleExtractor` now accepts an optional `derivedExtractors` map, enabling extractors that return child extractors (e.g. a `createTheme()` that yields a scoped `css` function).
Return values must be destructured with an object pattern; cross-file derived extractors are discovered automatically.