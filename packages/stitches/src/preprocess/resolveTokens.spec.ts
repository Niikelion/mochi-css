import { describe, it, expect } from "vitest";
import { resolveTokens } from "./resolveTokens";
import { StitchesConfig } from "@/types";

const config: StitchesConfig = {
    themeMap: {
        color: "colors",
        backgroundColor: "colors",
        margin: "space",
    },
    theme: {
        colors: { primary: "blue", secondary: "green" },
        space: { sm: "4px", md: "8px" },
    },
};

describe("resolveTokens", () => {
    it("replaces $token with var(--scale-token) when themeMap matches", () => {
        const result = resolveTokens({ color: "$primary" }, config);
        expect(result).toEqual({ color: "var(--colors-primary)" });
    });

    it("leaves value unchanged when no themeMap match", () => {
        const result = resolveTokens({ fontFamily: "$mono" }, config);
        expect(result).toEqual({ fontFamily: "$mono" });
    });

    it("resolves tokens in nested objects", () => {
        const result = resolveTokens(
            { ":hover": { color: "$secondary" } },
            config,
        );
        expect(result).toEqual({
            ":hover": { color: "var(--colors-secondary)" },
        });
    });

    it("leaves non-token strings unchanged", () => {
        const result = resolveTokens({ color: "red" }, config);
        expect(result).toEqual({ color: "red" });
    });

    it("leaves non-string values unchanged", () => {
        const result = resolveTokens({ opacity: 0.5, zIndex: 1 }, config);
        expect(result).toEqual({ opacity: 0.5, zIndex: 1 });
    });

    it("resolves $scale$token format using explicit scale", () => {
        const result = resolveTokens({ color: "$colors$primary" }, config);
        expect(result).toEqual({ color: "var(--colors-primary)" });
    });

    it("resolves multiple $scale$token refs in a compound value", () => {
        const result = resolveTokens(
            { padding: "$space$sm $space$md" },
            config,
        );
        expect(result).toEqual({ padding: "var(--space-sm) var(--space-md)" });
    });

    it("resolves $scale$token embedded in a longer string", () => {
        const result = resolveTokens(
            { borderBottom: "1px solid $colors$primary" },
            config,
        );
        expect(result).toEqual({
            borderBottom: "1px solid var(--colors-primary)",
        });
    });

    it("resolves $scale$token format regardless of themeMap", () => {
        const result = resolveTokens({ fontFamily: "$fonts$mono" }, config);
        expect(result).toEqual({ fontFamily: "var(--fonts-mono)" });
    });

    it("resolves $scale$token in nested objects", () => {
        const result = resolveTokens(
            { ":hover": { backgroundColor: "$colors$secondary" } },
            config,
        );
        expect(result).toEqual({
            ":hover": { backgroundColor: "var(--colors-secondary)" },
        });
    });

    it("includes prefix in $scale$token resolution", () => {
        const prefixed: StitchesConfig = {
            ...config,
            prefix: "mochi",
        };
        const result = resolveTokens({ color: "$colors$primary" }, prefixed);
        expect(result).toEqual({ color: "var(--mochi-colors-primary)" });
    });

    it("resolves tokens inside array elements (e.g. compoundVariants)", () => {
        const result = resolveTokens(
            {
                compoundVariants: [
                    {
                        variant: "solid",
                        color: "neutral",
                        css: { backgroundColor: "$colors$primary" },
                    },
                    {
                        variant: "ghost",
                        color: "danger",
                        css: { color: "$colors$secondary" },
                    },
                ],
            },
            config,
        );
        expect(result).toEqual({
            compoundVariants: [
                {
                    variant: "solid",
                    color: "neutral",
                    css: { backgroundColor: "var(--colors-primary)" },
                },
                {
                    variant: "ghost",
                    color: "danger",
                    css: { color: "var(--colors-secondary)" },
                },
            ],
        });
    });

    it("passes through non-object array items unchanged", () => {
        const result = resolveTokens(
            { items: ["$colors$primary", 42, null] },
            config,
        );
        expect(result).toEqual({ items: ["$colors$primary", 42, null] });
    });
});
