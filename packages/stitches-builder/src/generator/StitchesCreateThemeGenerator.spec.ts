import { describe, it, expect } from "vitest";
import { StitchesCreateThemeGenerator } from "./StitchesCreateThemeGenerator";
import { buildThemeClassName } from "@mochi-css/stitches";

describe("StitchesCreateThemeGenerator", () => {
    it("emits CSS variable declarations in global slot", async () => {
        const gen = new StitchesCreateThemeGenerator({});
        gen.collectArgs("file.ts", [{ colors: { primary: "blue" } }]);
        const result = await gen.generateStyles();
        expect(result.global).toContain("--colors-primary: blue;");
    });

    it("class name matches runtime buildThemeClassName", async () => {
        const tokens = { colors: { primary: "blue" } };
        const gen = new StitchesCreateThemeGenerator({});
        gen.collectArgs("file.ts", [tokens]);
        const result = await gen.generateStyles();
        const expectedClass = buildThemeClassName(tokens);
        expect(result.global).toContain(`.${expectedClass}`);
    });

    it("uses prefix from config", async () => {
        const gen = new StitchesCreateThemeGenerator({ prefix: "ui" });
        gen.collectArgs("file.ts", [{ colors: { primary: "blue" } }]);
        const result = await gen.generateStyles();
        expect(result.global).toContain("--ui-colors-primary: blue;");
    });

    it("returns empty object when no themes collected", async () => {
        const gen = new StitchesCreateThemeGenerator({});
        const result = await gen.generateStyles();
        expect(result).toEqual({});
    });
});
