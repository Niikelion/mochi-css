<p align="center">
  <img width="256" height="256" src="assets/mochi-vanilla256.png" alt="mochi-css logo">
</p>

<div align="center">

# 🧁 Mochi-CSS 🧁
[![Patreon](https://img.shields.io/badge/Patreon-F96854?style=for-the-badge&logo=patreon&logoColor=white)](https://www.patreon.com/Niikelion)

</div>

**A near zero-runtime CSS-in-JS solution with build-time style extraction**

Mochi-CSS brings the ergonomics of CSS-in-JS without paying the substantial runtime cost.
Styles are statically extracted at build time through a PostCSS plugin, making your shipped bundle smaller, predictable, and framework-agnostic.

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

---

## 📦 Installation

```bash
npm i @mochi-css/vanilla
npm i @mochi-css/postcss --save-dev
```

---

## 🚀 Quick Start

Add the Mochi-CSS PostCSS plugin to your `postcss.config.js`:
```js
module.exports = {
  plugins: {
    '@mochi-css/postcss': {}
  }
}
```

Create `src/globals.css` file and import it in your project.
After that, you can go wild with your styles!

```tsx
import { styled } from "@mochi-css/vanilla";

const Title = styled("h1", {
  fontSize: 32,
  lineHeight: 36,
});

export default function App() {
  return <Title>Hello Mochi</Title>;
}
```

At build time, the PostCSS plugin extracts the styles into a static `.css` file. No runtime style injection or providers required.

---

## 📚 Documentation

Detailed documentation about different parts of Mochi-CSS can be found here:

- [**@mochi-css/vanilla**](packages/vanilla/README.md) - core package that provides styling functions
- [**@mochi-css/postcss**](packages/postcss/README.md) - postcss plugin
- [**@mochi-css/builder**](packages/builder/README.md) - utilities for extracting styles from source code and generating CSS from them
- [**@mochi-css/tsuki**](packages/tsuki/README.md) - installer for Mochi-CSS

---

## 🚧 Project Status

**Beta** - media query syntax and builder APIs may change. Rest of the features is stable.

Benchmarks and performance comparisons will be released at a later stage.

---

## 🛠 Roadmap

| Feature                        | Status         | Notes                                                                                                                                                  |
|--------------------------------|----------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Benchmarks**                 | 🕒 Queued      | Compare bundle/runtime size with other CSS-in-JS libraries                                                                                             |
| **Tree-shaking**               | 🕒 Queued      | Support injecting css outside globals.css file, making it possible for the frameworks like NextJS to tree-shake generated styles                       |
| **Mochi-CSS/mango**            | 🕒 Queued      | Theming library built on top of Mochi-CSS/vanilla                                                                                                      |
| **Stitches.js feature parity** | 🚧 In Progress | Implement all of the features of stitches.js to allow for seamless transition                                                                          |
| **Stitches.js adapter**        | 🕒 Queued      | Drop-in replacement for `css`, `styled`, `globalCss` and `createTheme` from Stiches.js that runs on Mochi-CSS                                          |
| **Partial PandaCSS adapter**   | 🕒 Queued      | Drop-in replacement for `styled` and `cva` from PandaCSS. Other features may not be supported due to different architectures of PandaCSS and Mochi-CSS |
| **Standalone css building**    | 🕒 Queued      | Extract and bundle static styles from a library                                                                                                        |
| **CSS optimization**           | 🕒 Queued      | Perform simple optimizations on the generated code                                                                                                     |

Status legend

🚧 In Progress — actively being worked on  
🕒 Queued — planned, not yet in development

---

## 🤝 Contributing

Contributions, feedback, and ideas are welcome! Please open issues and PRs to help shape Mochi-CSS.

You can also support me on [my Patreon](https://www.patreon.com/Niikelion).

---

## 📄 License

[MIT](LICENSE.md)
