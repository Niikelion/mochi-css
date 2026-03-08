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
});
