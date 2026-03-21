<p align="center">
  <img width="256" height="256" src="assets/mochi-vanilla256.png" alt="mochi-css logo">
</p>

<div align="center">

# 🧁 Mochi-CSS 🧁
[![Patreon](https://img.shields.io/badge/Patreon-F96854?style=for-the-badge&logo=patreon&logoColor=white)](https://www.patreon.com/Niikelion)

</div>

**A near zero-runtime CSS-in-JS solution with build-time style extraction**

Mochi-CSS brings the ergonomics of CSS-in-JS without paying the substantial runtime cost.
Styles are statically extracted at build time through a PostCSS plugin,
making your shipped bundle smaller, predictable, and framework-agnostic.

---

## ✨ Features

- **Near zero runtime** - no style injection logic in your final bundle
- **Build-time CSS extraction** - using a PostCSS plugin
- **Style variants** - create variants for your styles with ease
- **Nested selectors** - use sub-selectors in you styles
- **Media queries** - make your styles responsive
- **Great type support** - TypeScript-first DX
- **Minimal restrictions** - define styles anywhere your code allows
- **Tooling agnostic** - works with anything that supports PostCSS
- **CSS splitting** - improve your load times utilizing tree-shaking

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
No runtime style injection or providers required.

---

## 📚 Documentation

Detailed documentation about different parts of Mochi-CSS can be found here:

- [**@mochi-css/vanilla**](packages/vanilla/README.md) - core package that provides styling functions
- [**@mochi-css/config**](packages/config/README.md) - configuration definition; read to learn more about available options
- [**@mochi-css/tsuki**](packages/tsuki/README.md) - installer for Mochi-CSS
- [**@mochi-css/postcss**](packages/postcss/README.md) - postcss plugin
- [**@mochi-css/next**](packages/next/README.md) - Next.JS plugin
- [**@mochi-css/vite**](packages/vite/README.md) - Vite plugin
- [**@mochi-css/builder**](packages/builder/README.md) - utilities for extracting styles from source code and generating CSS from them

---

## 🚧 Project Status

**Early release** - starting with version 3, new features and improvements will be added while preserving code compatibility within the same major version.
This guarantees, that package upgrades within the same major version will not break your code, as long as you don't rely on bugs existing in the previous versions.
If you want to upgrade to the next major version, please read release notes and migration guides to ensure smooth transition.

Benchmarks and performance comparisons will be released at a later stage.

---

## 🛠 Planned features

| Feature                      | Status         | Notes                                                                                                                                                  |
|------------------------------|----------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Benchmarks**               | 🕒 Queued      | Compare bundle/runtime size with other CSS-in-JS libraries                                                                                             |
| **Mochi-CSS/mango**          | 🕒 Queued      | Theming library built on top of Mochi-CSS/vanilla                                                                                                      |
| **Stitches.js adapter**      | 🚧 In Progress | Drop-in replacement for `css`, `styled`, `globalCss` and `createTheme` from Stiches.js that runs on Mochi-CSS                                          |
| **Partial PandaCSS adapter** | 🕒 Queued      | Drop-in replacement for `styled` and `cva` from PandaCSS. Other features may not be supported due to different architectures of PandaCSS and Mochi-CSS |
| **Standalone css building**  | 🚧 In Progress | Extract and bundle static styles from a library                                                                                                        |
| **CSS optimization**         | 🕒 Queued      | Perform simple optimizations on the generated code                                                                                                     |
| **Mochi-CSS/bento**          | 🕒 Queued      | Layouting library providing primitives for shaping your ui                                                                                             |
| **Blog example app**         | 🕒 Queued      | My(Niikelion) personal blog built with Mochi-CSS provided as an example of a small, functional app                                                     |
| **Japanese learning app**    | 🕒 Queued      | Example japanese learning website. Content will not be included in the source code                                                                     |

Status legend

🚧 In Progress - actively being worked on
🕒 Queued - planned, not yet in development

---

## 🤝 Contributing

Contributions, feedback, and ideas are welcome!
Please open issues and PRs to help shape Mochi-CSS.

You can also support me on [my Patreon](https://www.patreon.com/Niikelion).

---

## 📄 License

[MIT](LICENSE.md)
