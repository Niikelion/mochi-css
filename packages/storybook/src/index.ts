import type { InlineConfig, Plugin, PluginOption } from "vite";
import { mochiCss } from "@mochi-css/vite";
import { fileURLToPath } from "node:url";
import { normalize } from "node:path";

/**
 * Preview entry that pulls in Mochi's global CSS (globalCss, keyframes, and — when
 * `splitCss: false` — all styles). Storybook has no single build entry, so the Vite
 * plugin cannot inject the global import itself; adding it as a preview annotation
 * makes global styles available in every story.
 */
const PREVIEW_ENTRY = fileURLToPath(new URL("./preview.mjs", import.meta.url));

const PLUGIN_NAME = "mochi-css";

function hasMochiPlugin(plugins: PluginOption[]): boolean {
    for (const p of plugins) {
        if (!p) continue;
        if (Array.isArray(p)) {
            if (hasMochiPlugin(p)) return true;
            continue;
        }
        // Promises/thenables cannot be inspected synchronously — skip them.
        if (
            typeof p === "object" &&
            "name" in p &&
            (p as Plugin).name === PLUGIN_NAME
        )
            return true;
    }
    return false;
}

/**
 * Storybook preset hook. Adds the Mochi CSS Vite plugin to Storybook's Vite builder so
 * styles are statically extracted and served during story rendering (dev and build).
 *
 * All configuration is read from `mochi.config.ts` — the addon needs no options. Works
 * with any Mochi API (`@mochi-css/vanilla-react`, `@mochi-css/stitches`, …) since
 * extraction is driven by the extractors configured there.
 *
 * The plugin is added idempotently: if a `mochi-css` plugin is already present (e.g. the
 * user added it to their own Vite config), it is not added a second time.
 */
export const viteFinal = (config: InlineConfig): InlineConfig => {
    const plugins = config.plugins ?? [];
    if (hasMochiPlugin(plugins)) return config;
    return { ...config, plugins: [...plugins, mochiCss()] };
};

/**
 * Storybook preset hook. Registers the preview entry that imports Mochi's global CSS so
 * `globalCss()`/keyframes styles apply inside every story.
 */
type PreviewEntry = string | { absolute: string; bare?: string };
type PreviewOptions = {
    presetsList?: { preset: { previewAnnotations?: unknown } }[];
};

const isPreviewEntry = (entry: unknown): boolean => {
    const path =
        typeof entry === "string"
            ? entry
            : typeof entry === "object" && entry !== null && "absolute" in entry
              ? entry.absolute
              : undefined;
    if (typeof path !== "string") return false;
    return (
        path === "@mochi-css/storybook/preview" ||
        normalize(path) === normalize(PREVIEW_ENTRY) ||
        normalize(path) === normalize(PREVIEW_ENTRY.replace(/\.mjs$/, ".js"))
    );
};

export const previewAnnotations = (
    entries: PreviewEntry[] = [],
    options: PreviewOptions = {},
): PreviewEntry[] => {
    // Storybook's virtual addon preset appends the exported preview AFTER this hook.
    // Inspect that registration too, so normal addon loading does not import it twice.
    const autoRegistered = options.presetsList?.some(
        ({ preset }) =>
            Array.isArray(preset.previewAnnotations) &&
            preset.previewAnnotations.some(isPreviewEntry),
    );
    return autoRegistered || entries.some(isPreviewEntry)
        ? entries
        : [...entries, PREVIEW_ENTRY];
};
