import { describe, it, expect } from "vitest";
import { StitchesCssGenerator } from "./StitchesCssGenerator";

describe("StitchesCssGenerator", () => {
    it("preprocesses token references before generating CSS", async () => {
        const config = {
            themeMap: { color: "colors" },
            theme: { colors: { primary: "blue" } },
        };
        const gen = new StitchesCssGenerator(config);
        gen.collectArgs("file.ts", [{ color: "$primary" }]);
        const result = await gen.generateStyles();
        expect(result.files["file.ts"]).toContain("var(--colors-primary)");
    });

    it("generates CSS for basic style object", async () => {
        const gen = new StitchesCssGenerator({});
        gen.collectArgs("file.ts", [{ color: "red" }]);
        const result = await gen.generateStyles();
        expect(result.files["file.ts"]).toContain("color: red;");
    });

    it("skips MochiCSS instances", async () => {
        const gen = new StitchesCssGenerator({});
        gen.collectArgs("file.ts", [
            { $$typeof: Symbol.for("mochi-css.MochiCSS") },
        ]);
        const result = await gen.generateStyles();
        expect(Object.keys(result.files)).toHaveLength(0);
    });

    it("preprocesses breakpoints", async () => {
        const config = {
            media: { bp1: "(min-width: 640px)" },
        };
        const gen = new StitchesCssGenerator(config);
        gen.collectArgs("file.ts", [{ "@bp1": { color: "red" } }]);
        const result = await gen.generateStyles();
        expect(result.files["file.ts"]).toContain("@media (min-width: 640px)");
    });
});
