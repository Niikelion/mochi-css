import { describe, it, expect } from "vitest";
import { expandUtils } from "./expandUtils";
import { StitchesConfig } from "@/types";

const config: StitchesConfig = {
    utils: {
        px: (value: unknown) => ({ paddingLeft: value, paddingRight: value }),
        py: (value: unknown) => ({ paddingTop: value, paddingBottom: value }),
    },
};

describe("expandUtils", () => {
    it("expands a util shorthand", () => {
        const result = expandUtils({ px: "8px" }, config);
        expect(result).toEqual({ paddingLeft: "8px", paddingRight: "8px" });
    });

    it("expands multiple utils", () => {
        const result = expandUtils({ px: "8px", py: "4px" }, config);
        expect(result).toEqual({
            paddingLeft: "8px",
            paddingRight: "8px",
            paddingTop: "4px",
            paddingBottom: "4px",
        });
    });

    it("passes through non-util keys", () => {
        const result = expandUtils({ color: "red", px: "8px" }, config);
        expect(result).toEqual({
            color: "red",
            paddingLeft: "8px",
            paddingRight: "8px",
        });
    });

    it("recurses into nested objects", () => {
        const result = expandUtils({ ":hover": { px: "4px" } }, config);
        expect(result).toEqual({
            ":hover": { paddingLeft: "4px", paddingRight: "4px" },
        });
    });

    it("does nothing when utils is not configured", () => {
        const result = expandUtils({ px: "8px" }, {});
        expect(result).toEqual({ px: "8px" });
    });
});
