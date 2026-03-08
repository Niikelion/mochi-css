import { describe, it, expect } from "vitest";
import { resolveScopedTokens } from "./resolveScopedTokens";

describe("resolveScopedTokens", () => {
    it("converts $$key to CSS variable declaration", () => {
        const result = resolveScopedTokens({ $$myColor: "red" }, {});
        expect(result).toEqual({ "--myColor": "red" });
    });

    it("converts $$value to var() reference", () => {
        const result = resolveScopedTokens({ color: "$$myColor" }, {});
        expect(result).toEqual({ color: "var(--myColor)" });
    });

    it("uses prefix from config", () => {
        const result = resolveScopedTokens(
            { $$foo: "bar", color: "$$foo" },
            { prefix: "ui" },
        );
        expect(result).toEqual({
            "--ui-foo": "bar",
            color: "var(--ui-foo)",
        });
    });

    it("recurses into nested objects", () => {
        const result = resolveScopedTokens(
            { ":hover": { color: "$$accent" } },
            {},
        );
        expect(result).toEqual({ ":hover": { color: "var(--accent)" } });
    });

    it("leaves regular keys unchanged", () => {
        const result = resolveScopedTokens({ color: "red" }, {});
        expect(result).toEqual({ color: "red" });
    });
});
