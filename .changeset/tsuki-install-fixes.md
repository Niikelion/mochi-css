---
"@mochi-css/tsuki": patch
---

Install each Mochi-CSS package at the version released alongside tsuki instead of assuming they all share tsuki's major version, which asked for versions that don't exist (e.g. `@mochi-css/vite@^7.0.0`). When one install step fails, the others still run, and the error lists the commands to install what is missing.
