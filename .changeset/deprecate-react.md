---
"@mochi-css/react": minor
---

Deprecate `@mochi-css/react` in favour of `@mochi-css/vanilla-react`.

`@mochi-css/vanilla-react` provides the same `styled` runtime plus a pre-configured `defineConfig` entry point (`@mochi-css/vanilla-react/config`) that wires up the extractor and `styledIdPlugin` automatically.

**Migration:**

```diff
- import { styled } from "@mochi-css/react"
+ import { styled } from "@mochi-css/vanilla-react"
```

```diff
- import { defineConfig } from "@mochi-css/config"
+ import { defineConfig } from "@mochi-css/vanilla-react/config"
```

`@mochi-css/react` will not receive new features and will be removed in a future major version.
