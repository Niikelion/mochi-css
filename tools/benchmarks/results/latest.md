# CSS-in-JS Benchmark

**Date**: 2026-05-14
**Fixture**: Mock Mochi homepage — Navbar, Hero, Stats, Features, CodeShowcase, ApiCarousel, ComponentExplorer, Cta, Footer
**Machine**: Intel(R) Core(TM) i7-14700K (28 cores, 68GB RAM)

## Results

| Library | Build Time | JS Bundle (gz) | CSS Output (gz) | FCP | TBT | CLS | Notes |
|---|---|---|---|---|---|---|---|
| `mochi-vanilla-react` | 1.6 s | 61.4 kB | 2.1 kB | 1.9 s | 0 ms | 0.000 |  |
| `mochi-stitches` | 1.6 s | 69.6 kB | 1.8 kB | 2.2 s | 0 ms | 0.000 |  |
| `stitches` | 1.5 s | 67.4 kB | 0 kB | 2.0 s | 0 ms | 0.000 |  |
| `vanilla-extract` | 2.3 s | 60.9 kB | 1.6 kB | 1.9 s | 0 ms | 0.000 |  |
| `panda` | 2.4 s | 72.0 kB | 6.1 kB | 2.3 s | 0 ms | 0.000 |  |
| `tailwind` | 1.6 s | 60.6 kB | 3.4 kB | 1.9 s | 0 ms | 0.000 |  |

## Notes

- **Build Time**: Cold build (dist/ cleared). Stitches and vanilla-extract include a codegen pre-step; Panda includes `panda codegen` + `panda cssgen` pre-steps.
- **JS Bundle**: Gzipped sum of all `.js` files in `dist/assets/`. This is the CSS-in-JS runtime overhead delivered to the browser.
- **CSS Output**: Gzipped sum of all `.css` files in `dist/assets/`. `@stitches/react` injects styles at runtime — no CSS file is produced, so this will be 0.
- **FCP**: First Contentful Paint — time until the browser renders the first text or image.
- **TBT**: Total Blocking Time — sum of blocking time between FCP and TTI; measures main-thread contention.
- **CLS**: Cumulative Layout Shift. All metrics measured via Playwright (Chromium headless) with CDP throttling: Slow 4G (~1.6 Mbps, 150 ms RTT) + 8× CPU slowdown applied to localhost.
- `tailwindcss` produces no JS bundle — all styles are utility classes in the CSS file.
