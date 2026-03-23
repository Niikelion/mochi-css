import { describe, it, expect } from "vitest";
import { buildThemeClassName, runtimeCreateTheme } from "./createTheme";

describe("buildThemeClassName", () => {
    it("returns a deterministic class name", () => {
        const a = buildThemeClassName({ colors: { primary: "blue" } });
        const b = buildThemeClassName({ colors: { primary: "blue" } });
        expect(a).toBe(b);
    });

    it("produces different class names for different tokens", () => {
        const a = buildThemeClassName({ colors: { primary: "blue" } });
        const b = buildThemeClassName({ colors: { primary: "red" } });
        expect(a).not.toBe(b);
    });

    it("class name starts with th-", () => {
        const name = buildThemeClassName({ colors: { primary: "blue" } });
        expect(name.startsWith("th-")).toBe(true);
    });

    it("is order-independent for scales and tokens", () => {
        const a = buildThemeClassName({
            colors: { primary: "blue", secondary: "red" },
        });
        const b = buildThemeClassName({
            colors: { secondary: "red", primary: "blue" },
        });
        expect(a).toBe(b);
    });
});

describe("runtimeCreateTheme", () => {
    const config = { prefix: "", themeMap: {}, theme: {} };

    it("returns className and token refs", () => {
        const result = runtimeCreateTheme(
            { colors: { primary: "blue" } },
            config,
        );
        expect(result.className).toMatch(/^th-/);
        expect((result["colors"] as Record<string, string>)["primary"]).toBe(
            "var(--colors-primary)",
        );
    });

    it("uses prefix in token refs", () => {
        const result = runtimeCreateTheme(
            { colors: { primary: "blue" } },
            { ...config, prefix: "ui" },
        );
        expect((result["colors"] as Record<string, string>)["primary"]).toBe(
            "var(--ui-colors-primary)",
        );
    });
});
