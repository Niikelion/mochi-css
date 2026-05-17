# 🧁 Mochi-CSS/tsuki

This package is part of the [Mochi-CSS project](https://github.com/Niikelion/mochi-css).
It provides installer for Mochi-CSS that adds it to your project.

You can run it with:

```bash
npx @mochi-css/tsuki
```

`tsuki` handles installing integrations for vite, next.js, and esbuild.
To get more info, run it with `-h` or `--help` option.

## What `tsuki` sets up

During initialization, `tsuki` installs the required packages and creates a `mochi.config.ts` file in your project root.
This file is the single place to configure all Mochi-CSS options (`roots`, `plugins`, `splitCss`, etc.) - all integrations load it automatically.

## Presets

Use the `--preset` / `-p` flag to choose a framework preset non-interactively:

```bash
npx @mochi-css/tsuki --preset vite
npx @mochi-css/tsuki --preset nextjs
npx @mochi-css/tsuki --preset esbuild
npx @mochi-css/tsuki --preset lib
```

If `-p` is omitted, `tsuki` will prompt you to select a preset interactively.

| Preset    | Description |
|-----------|-------------|
| `vite`    | Vite app — adds `mochiCss()` to `vite.config.ts` |
| `nextjs`  | Next.js app — wraps `next.config.ts` with `withMochi()` |
| `esbuild` | Standalone esbuild build — creates or patches a `build.mjs` script |
| `lib`     | Framework-agnostic library — sets up `mochi.config.ts` and PostCSS only |
