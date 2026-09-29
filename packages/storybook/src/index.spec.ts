import { describe, it, expect } from "vitest";
import type { InlineConfig, Plugin } from "vite";
import { viteFinal, previewAnnotations } from "./index";
import { isAbsolute, basename } from "node:path";

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
    it("recognizes the CommonJS preview registered by older Storybook versions", () => {
        const [entry] = previewAnnotations();
        if (typeof entry !== "string")
            throw new Error("Expected a preview path");
        const existing = [{ absolute: entry.replace(/\.mjs$/, ".js") }];
        expect(previewAnnotations(existing)).toEqual(existing);
    });
    it("ignores unrelated and empty automatic preview entries", () => {
        expect(
            previewAnnotations([], {
                presetsList: [
                    { preset: { previewAnnotations: [undefined, "other.ts"] } },
                ],
            }),
        ).toEqual(previewAnnotations());
    });
    it("defers to Storybook's later automatic preview registration", () => {
        const [absolute] = previewAnnotations();
        const options = {
            presetsList: [
                {
                    preset: {
                        previewAnnotations: [
                            { absolute, bare: "@mochi-css/storybook/preview" },
                        ],
                    },
                },
            ],
        };
        expect(previewAnnotations(["existing.ts"], options)).toEqual([
            "existing.ts",
        ]);
    });
    it("does not duplicate an automatically registered preview entry", () => {
        const entries = previewAnnotations(["existing.ts"]);
        expect(previewAnnotations(entries)).toEqual(entries);
    });
    it("appends the preview entry to existing entries", () => {
        const entries = previewAnnotations(["existing.ts"]);
        expect(entries).toHaveLength(2);
        expect(entries[0]).toBe("existing.ts");
        expect(entries.slice(1)).toEqual(previewAnnotations());
    });

    it("returns just the preview entry when called with no args", () => {
        const entries = previewAnnotations();
        expect(entries).toHaveLength(1);
        const [entry] = entries;
        expect(typeof entry).toBe("string");
        if (typeof entry !== "string")
            throw new Error("Expected a preview path");
        expect(isAbsolute(entry)).toBe(true);
        expect(basename(entry)).toBe("preview.mjs");
    });
});
