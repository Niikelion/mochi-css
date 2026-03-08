import { GlobalCssStyles } from "@mochi-css/vanilla";

function noop(): void {
    // CSS is generated at build time; no runtime action needed
}

export function runtimeGlobalCss(_styles: GlobalCssStyles): () => void {
    return noop;
}
