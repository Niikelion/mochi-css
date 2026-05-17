# @mochi-css/benchmarks

Benchmarks comparing build time, bundle size, and runtime performance of popular CSS-in-JS libraries against Mochi.css.

## Libraries compared

| Library               | Description                                                    |
|-----------------------|----------------------------------------------------------------|
| `mochi-vanilla-react` | Mochi.css with `@mochi-css/vanilla-react`                      |
| `mochi-stitches`      | Mochi.css with the Stitches.js adapter (`@mochi-css/stitches`) |
| `stitches`            | `@stitches/react` (runtime CSS-in-JS)                          |
| `vanilla-extract`     | `@vanilla-extract/css` (build-time CSS-in-JS)                  |
| `panda`               | PandaCSS                                                       |
| `css-modules`         | Plain CSS Modules                                              |

## Fixture

A mock Mochi homepage with nine sections: Navbar, Hero, Stats, Features, CodeShowcase, ApiCarousel, ComponentExplorer, Cta, and Footer.
Each section is styled using the library under test.
The fixture is generated via codegen so all implementations are structurally equivalent.

## Metrics

| Metric         | Description                                                                                                                      |
|----------------|----------------------------------------------------------------------------------------------------------------------------------|
| **Build time** | Cold build with `dist/` cleared. Libraries that require a codegen pre-step (Stitches, vanilla-extract, Panda) include that time. |
| **JS bundle**  | Gzipped sum of all `.js` files in `dist/assets/`. Represents CSS-in-JS runtime overhead shipped to the browser.                  |
| **CSS output** | Gzipped sum of all `.css` files in `dist/assets/`. Stitches injects styles at runtime so its CSS output is 0.                    |
| **FCP**        | First Contentful Paint — time until the browser renders first text or image.                                                     |
| **TBT**        | Total Blocking Time — sum of main-thread blocking time between FCP and TTI.                                                      |
| **CLS**        | Cumulative Layout Shift.                                                                                                         |

All browser metrics are measured with Playwright (Chromium headless) using CDP throttling: Slow 4G (~1.6 Mbps, 150 ms RTT) + 8x CPU slowdown applied to localhost.

## How implementations are generated

`mochi-vanilla-react` is the canonical, handwritten source implementation.
All other implementations are derived from it automatically so that every library renders structurally identical output.

### Codegen

`codegen/index.ts` reads the `mochi-vanilla-react/src/` tree using SWC and produces a target-specific source tree for each library:

- **Shared layout files** (`App.tsx`, section `.tsx` files, `tokens.ts`, `main.tsx`) are copied verbatim — the JSX structure and token values are identical across all implementations.
- **Style files** (`.styled.ts` files and component `.tsx` files) are parsed with SWC to extract `styled()` and `css()` calls including their full style objects.
  The extracted style data is then handed to a per-library generator that re-emits equivalent code using that library's API.

Each library has its own generator in `codegen/generators/`.
The generators translate the Mochi style objects into the target library's syntax (e.g., vanilla-extract's `style()`, Panda's `css()`, Stitches' `styled()`),
preserving property values, local CSS variables, token references, and animation imports.

To regenerate a specific implementation:

```bash
yarn workspace @mochi-css/benchmarks codegen  # regenerates all
```

Or for a single target:

```bash
cd tools/benchmarks && npx tsx codegen/index.ts stitches
```

### Visual and DOM parity verification

After building all implementations, Playwright parity tests in `tests/parity.spec.ts` verify that every implementation produces the same output as `mochi-vanilla-react`:

- **DOM parity**: the full page DOM is normalized (class names, inline styles, `id`, and `data-*` attributes are stripped) and compared textually against the `mochi-vanilla-react` baseline. 
  Any structural divergence fails the test.
- **Screenshot parity**: a full-page screenshot at 1280×900 is taken for each implementation and compared against a stored `baseline.png` (captured from `mochi-vanilla-react`).
  A maximum of 2% pixel difference is allowed to account for subpixel rendering variation across platforms.

To run the parity tests (implementations must already be built and served on their respective ports):

```bash
yarn workspace @mochi-css/benchmarks test
```

To update the baseline screenshot after an intentional fixture change:

```bash
cd tools/benchmarks && npx playwright test --update-snapshots --grep "mochi-vanilla-react — baseline"
```

> Only pass `--update-snapshots` together with `--grep "mochi-vanilla-react — baseline"`. Without the grep filter, all implementations' screenshots would overwrite the baseline.

## Running benchmarks

From the repo root:

```bash
yarn workspace @mochi-css/benchmarks benchmark
```

Results are written to `results/latest.json` and `results/latest.md`.

To regenerate just the Markdown report from an existing JSON result:

```bash
yarn workspace @mochi-css/benchmarks report
```

## Latest results

See [`results/latest.md`](results/latest.md) for the most recent run.
