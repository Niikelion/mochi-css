// Preview annotation: bundled into Storybook's preview iframe by the Vite builder.
// The `virtual:mochi-css/global.css` module is served by the Mochi Vite plugin and
// contains globalCss, keyframes, and — when `splitCss: false` — all extracted styles.
// It resolves to an empty module when there are no global styles, so this import is
// always safe.
import "virtual:mochi-css/global.css";
