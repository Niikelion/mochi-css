import { describe, it, expect } from "vitest";
import type { InlineConfig, Plugin } from "vite";
import { viteFinal, previewAnnotations } from "./index";

function pluginNames(config: InlineConfig): string[] {
    const names: string[] = [];
    const walk = (plugins: InlineConfig["plugins"]): void => {
        if (!plugins) return;
        for (const p of plugins) {
            if (!p) continue;
            if (Array.isArray(p)) {
                walk(p);
                continue;
            }
            if (typeof p === "object" && "name" in p)
                names.push((p as Plugin).name);
        }
    };
    walk(config.plugins);
    return names;
}

describe("viteFinal", () => {
    it("adds the mochi-css plugin to an empty config", () => {
        const result = viteFinal({});
        expect(pluginNames(result)).toContain("mochi-css");
    });

    it("preserves existing plugins", () => {
        const existing: Plugin = { name: "other-plugin" };
        const result = viteFinal({ plugins: [existing] });
        expect(pluginNames(result)).toEqual(["other-plugin", "mochi-css"]);
    });

    it("preserves other config keys", () => {
        const result = viteFinal({
            root: "/some/root",
            server: { port: 6006 },
        });
        expect(result.root).toBe("/some/root");
        expect(result.server?.port).toBe(6006);
    });

    it("does not add the plugin twice when one is already present", () => {
        const existing: Plugin = { name: "mochi-css" };
        const result = viteFinal({ plugins: [existing] });
        expect(
            pluginNames(result).filter((n) => n === "mochi-css"),
        ).toHaveLength(1);
        // config is returned unchanged
        expect(result.plugins).toHaveLength(1);
    });

    it("detects an existing mochi-css plugin nested in a plugin array", () => {
        const nested: Plugin = { name: "mochi-css" };
        const result = viteFinal({ plugins: [[nested]] });
        expect(
            pluginNames(result).filter((n) => n === "mochi-css"),
        ).toHaveLength(1);
    });

    it("ignores falsy plugin entries when checking for duplicates", () => {
        const result = viteFinal({ plugins: [false, null, undefined] });
        expect(pluginNames(result)).toContain("mochi-css");
    });
});

describe("previewAnnotations", () => {
    it("appends the preview entry to existing entries", () => {
        expect(previewAnnotations(["existing.ts"])).toEqual([
            "existing.ts",
            "@mochi-css/storybook/preview",
        ]);
    });

    it("returns just the preview entry when called with no args", () => {
        expect(previewAnnotations()).toEqual(["@mochi-css/storybook/preview"]);
    });
});
