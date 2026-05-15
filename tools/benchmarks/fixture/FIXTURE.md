# Benchmark Fixture: Mock Mochi Homepage

Each implementation must render an identical page using its CSS-in-JS library. The parity test verifies structural DOM equivalence.

## Brand Tokens

| Token | Value |
|---|---|
| Background | `#131110` |
| Text | `#e8e0cc` |
| Gold accent | `#c9a84c` |
| Dim | `#6b5e3a` |
| Font | `'IBM Plex Mono', monospace` |

## Required Components

All components must accept the same props and render the same HTML element.

| Component | HTML tag | Variants |
|---|---|---|
| `Button` | `<button>` | `variant`: solid/outline/ghost · `size`: sm/md/lg |
| `Card` | `<div>` | `variant`: default/elevated/bordered |
| `Badge` | `<span>` | `color`: gold/dim/white · `size`: sm/md |
| `Heading` | tag passed as prop (h1/h2/h3) | `size`: sm/md/lg · `color`: default/gold/dim |

Variant props MUST NOT be forwarded to the DOM (they must not appear as HTML attributes).

## Page Sections (in order)

### 1. Navbar (`<nav>`)
```
<span>mochi.css</span>
<div>
  <a href="#">Docs</a>
  <a href="#">Examples</a>
  <a href="#">GitHub</a>
</div>
<button>Get Started</button>
```

### 2. Hero (`<section>`)
```
<h1>CSS-in-JS without the runtime</h1>
<p>Mochi extracts your styles at build time. Zero runtime overhead. Full type safety.</p>
<div>
  <button>Get Started</button>
  <button>View on GitHub</button>
</div>
```

### 3. Stats (`<section>`)
```
<div>  (grid wrapper)
  <div><span>0 kB</span><span>Runtime overhead</span></div>
  <div><span>100%</span><span>Type safe</span></div>
  <div><span>Build time</span><span>Extraction</span></div>
</div>
```

### 4. Features (`<section>`)
```
<h2>Why Mochi?</h2>
<div>  (grid wrapper)
  <div><h3>Near zero runtime</h3><p>Styles are extracted at build time. No JavaScript parsing CSS in the browser.</p></div>
  <div><h3>TypeScript native</h3><p>Full type safety for your styles, variants, and design tokens.</p></div>
  <div><h3>Stitches compatible</h3><p>Migrate from Stitches with minimal changes. Same API, better performance.</p></div>
  <div><h3>Framework agnostic</h3><p>Works with Vite, Next.js, and more. Bring your own framework.</p></div>
</div>
```

### 5. Code (`<section>`)
```
<h2>Simple by design</h2>
<pre><code>...snippet...</code></pre>
```

The code snippet must be:
```
const Button = styled('button', {
  padding: '8px 16px',
  borderRadius: 4,
  variants: {
    variant: {
      solid: { background: '#c9a84c' },
      ghost: { background: 'transparent' },
    },
  },
})
```

### 6. Testimonials (`<section>`)
```
<h2>Trusted by developers</h2>
<div>  (grid wrapper)
  <div><span>Featured</span><p>"Fast builds, zero runtime cost — exactly what we needed."</p><span>— Alex Chen, Frontend Lead</span></div>
  <div><span>Community</span><p>"The Stitches-compatible API made migration a breeze."</p><span>— Maria Santos, Staff Engineer</span></div>
  <div><span>Open Source</span><p>"Type-safe styles with compile-time extraction. Finally."</p><span>— James Park, OSS Contributor</span></div>
</div>
```

### 7. CTA (`<section>`)
```
<h2>Ready to get started?</h2>
<p>Install with your package manager and start writing styles in minutes.</p>
<div>
  <button>Install now</button>
  <button>Read the docs</button>
  <button>View examples</button>
</div>
```

### 8. Footer (`<footer>`)
```
<span>mochi.css — CSS-in-JS at build time</span>
<div>
  <a href="#">GitHub</a>
  <a href="#">Docs</a>
  <a href="#">Changelog</a>
</div>
```

## Full Page DOM (after normalization)

After parity normalization (class/style/id/data-* stripped, head/script/style elements removed), all implementations must produce exactly:

```html
<body>
  <div>
    <nav>
      <span>mochi.css</span>
      <div><a href="#">Docs</a><a href="#">Examples</a><a href="#">GitHub</a></div>
      <button>Get Started</button>
    </nav>
    <section>
      <h1>CSS-in-JS without the runtime</h1>
      <p>Mochi extracts your styles at build time. Zero runtime overhead. Full type safety.</p>
      <div><button>Get Started</button><button>View on GitHub</button></div>
    </section>
    <section>
      <div>
        <div><span>0 kB</span><span>Runtime overhead</span></div>
        <div><span>100%</span><span>Type safe</span></div>
        <div><span>Build time</span><span>Extraction</span></div>
      </div>
    </section>
    <section>
      <h2>Why Mochi?</h2>
      <div>
        <div><h3>Near zero runtime</h3><p>Styles are extracted at build time. No JavaScript parsing CSS in the browser.</p></div>
        <div><h3>TypeScript native</h3><p>Full type safety for your styles, variants, and design tokens.</p></div>
        <div><h3>Stitches compatible</h3><p>Migrate from Stitches with minimal changes. Same API, better performance.</p></div>
        <div><h3>Framework agnostic</h3><p>Works with Vite, Next.js, and more. Bring your own framework.</p></div>
      </div>
    </section>
    <section>
      <h2>Simple by design</h2>
      <pre><code>...</code></pre>
    </section>
    <section>
      <h2>Trusted by developers</h2>
      <div>
        <div><span>Featured</span><p>"Fast builds, zero runtime cost — exactly what we needed."</p><span>— Alex Chen, Frontend Lead</span></div>
        <div><span>Community</span><p>"The Stitches-compatible API made migration a breeze."</p><span>— Maria Santos, Staff Engineer</span></div>
        <div><span>Open Source</span><p>"Type-safe styles with compile-time extraction. Finally."</p><span>— James Park, OSS Contributor</span></div>
      </div>
    </section>
    <section>
      <h2>Ready to get started?</h2>
      <p>Install with your package manager and start writing styles in minutes.</p>
      <div><button>Install now</button><button>Read the docs</button><button>View examples</button></div>
    </section>
    <footer>
      <span>mochi.css — CSS-in-JS at build time</span>
      <div><a href="#">GitHub</a><a href="#">Docs</a><a href="#">Changelog</a></div>
    </footer>
  </div>
</body>
```
