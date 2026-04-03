# 🧁 Mochi-CSS/core

This package is part of the [Mochi-CSS project](https://github.com/Niikelion/mochi-css).
It provides shared low-level utilities used across Mochi-CSS packages.

> **Note:** This is an internal package. You do not need to install it directly — it is a transitive dependency of `@mochi-css/vanilla` and `@mochi-css/builder`.

---

## API

### `shortHash(input: string): string`

Returns a short URL-safe base-62 hash of the input string. Used internally for generating stable class name suffixes and file hashes.

### `numberToBase62(n: number): string`

Converts a non-negative integer to a base-62 string (`[0-9A-Za-z]`).
