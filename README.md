![Mochi.css banner](assets/mochi-standard.png)

# Zero-runtime CSS-in-JS solution with build-time style extraction

Mochi.css brings the ergonomics of CSS-in-JS without paying the significant runtime cost.
Styles are statically extracted at build time through a PostCSS plugin,
making your shipped bundle smaller, predictable, and framework-agnostic.

<div align="center">

[![Patreon](https://img.shields.io/badge/Patreon-F96854?style=for-the-badge&logo=patreon&logoColor=white)](https://www.patreon.com/Niikelion)

</div>

---

## ✨ Features

- **Zero runtime** – no style logic in your final bundle
- **Build-time CSS extraction** – using a PostCSS plugin
- **Style variants** – create variants for your styles with ease
- **Nested selectors** – use sub-selectors in your styles
- **Media queries** – make your styles responsive
- **Great type support** – TypeScript-first DX
- **Minimal restrictions** – define styles anywhere your code allows
- **Tooling agnostic** – works with anything that supports PostCSS
- **CSS splitting** – improve your load times using tree-shaking

---

## 📦 Installation

```bash
npx @mochi-css/tsuki
```

---

## 🚀 Quick Start

After running `tsuki` should have all the plugins installed.

Create `src/globals.css` file and import it in your project.
After that, you can go wild with your styles!

```tsx
import { styled } from "@mochi-css/react";

const Title = styled("h1", {
  fontSize: 32,
  lineHeight: 36,
});

export default function App() {
  return <Title>Hello Mochi</Title>;
}
```

At build time, the PostCSS plugin extracts the styles into a static `.css` file.
No runtime style injection or providers are required.

---

## 📚 Documentation

Detailed documentation about different parts of Mochi.css can be found here:

- [**@mochi-css/vanilla**](packages/vanilla/README.md) - core package that provides styling functions
- [**@mochi-css/config**](packages/config/README.md) - configuration definition; read to learn more about available options
- [**@mochi-css/tsuki**](packages/tsuki/README.md) - installer for Mochi.css
- [**@mochi-css/postcss**](packages/postcss/README.md) - postcss plugin
- [**@mochi-css/next**](packages/next/README.md) - Next.js plugin
- [**@mochi-css/vite**](packages/vite/README.md) - Vite plugin
- [**@mochi-css/esbuild**](packages/esbuild/README.md) - esbuild plugin
- [**@mochi-css/builder**](packages/builder/README.md) - utilities for extracting styles from source code and generating CSS from them

---

## 🌱 Project Status

**Early release** – starting with version 3, new features and improvements will be added while preserving code compatibility within the same major version.
This guarantees that package upgrades within the same major version will not break your code,
as long as you don't rely on bugs existing in the previous versions.
If you want to upgrade to the next major version, please read release notes and migration guides to ensure a smooth transition.

Benchmarks comparing bundle size and runtime overhead against other CSS-in-JS libraries are available in [`tools/benchmarks/`](tools/benchmarks/README.md).
Run `yarn workspace @mochi-css/benchmarks benchmark` from the repo root to reproduce results on your machine.

### Latest benchmark results

Fixture: mock Mochi homepage (Navbar, Hero, Stats, Features, CodeShowcase, ApiCarousel, ComponentExplorer, Cta, Footer).
Measured on an Intel Core i7-14700K with Slow 4G throttling (1.6 Mbps, 150 ms RTT) and 8x CPU slowdown.

| Library               | Build time | JS bundle (gz) | CSS output (gz) | FCP   |
|-----------------------|------------|----------------|-----------------|-------|
| `mochi-vanilla-react` | 1.6 s      | 61.4 kB        | 2.1 kB          | 1.9 s |
| `mochi-stitches`      | 1.6 s      | 69.6 kB        | 1.8 kB          | 2.2 s |
| `vanilla-extract`     | 2.3 s      | 60.9 kB        | 1.6 kB          | 1.9 s |
| `stitches`            | 1.5 s      | 67.4 kB        | 0 kB *          | 2.0 s |
| `panda`               | 2.4 s      | 72.0 kB        | 6.1 kB          | 2.3 s |
| `tailwind`            | 1.6 s      | 60.6 kB        | 3.4 kB          | 1.9 s |

* Stitches.js injects styles at runtime — no CSS file is produced.

---

## 🛠 Planned features

| Feature                      | Status         | Notes                                                                                                                                                  |
|------------------------------|----------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Mochi.css/mango**          | 🕒 Queued      | Theming library built on top of Mochi.css/vanilla                                                                                                      |
| **Partial PandaCSS adapter** | 🕒 Queued      | Drop-in replacement for `styled` and `cva` from PandaCSS. Other features may not be supported due to different architectures of PandaCSS and Mochi.css |
| **CSS optimization**         | 🚧 In Progress | Perform simple optimizations on the generated code                                                                                                     |
| **Mochi.css/bento**          | 🚧 In Progress | Layouting library providing primitives for shaping your ui                                                                                             |
| **Blog example app**         | 🕒 Queued      | My(Niikelion) personal blog built with Mochi.css provided as an example of a small, functional app                                                     |
| **Japanese learning app**    | 🕒 Queued      | Example japanese learning website. Content will not be included in the source code                                                                     |

Status legend

🚧 In Progress – actively being worked on

🕒 Queued – planned, not yet in development

---

## 🤝 Contributing

Contributions, feedback, and ideas are welcome!
Please open issues and PRs to help shape Mochi.css.

You can also support me on [my Patreon](https://www.patreon.com/Niikelion).

---

## 📄 License

[MIT](LICENSE.md)
