# @mochi-css/config

## 3.0.0

### Major Changes

- a674152: # Introduced shared config concept and pipeline plugins.

    Thanks to the shared config, all the options should be consistent across all the integrations.
    This avoids a lot of misconfigurations.

    One of the built-in plugins

    Old setup with next, vite and postcss plugins may not work and need to be checked after upgrading to v3.
    If unsure, remove Mochi-CSS from your build tools and run tsuki to ensure your setup is correct.

### Patch Changes

- Updated dependencies [a674152]
- Updated dependencies [cc1b53a]
    - @mochi-css/vanilla@3.0.0
    - @mochi-css/builder@3.0.0
