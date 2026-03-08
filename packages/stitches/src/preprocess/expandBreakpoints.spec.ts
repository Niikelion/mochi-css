import { describe, it, expect } from "vitest";
import { expandBreakpoints, expandBreakpoint } from "./expandBreakpoints";
import { StitchesConfig } from "@/types";

const config: StitchesConfig = {
    media: {
        bp1: "(min-width: 640px)",
        bp2: "(min-width: 1024px)",
    },
};

describe("expandBreakpoints", () => {
    it("replaces @bp shorthand with @media query", () => {
        const result = expandBreakpoints({ "@bp1": { color: "red" } }, config);
        expect(result).toEqual({
            "@media (min-width: 640px)": { color: "red" },
        });
    });

    it("leaves unknown @-keys unchanged", () => {
        const result = expandBreakpoints(
            { "@media (max-width: 100px)": { color: "red" } },
            config,
        );
        expect(result).toEqual({
            "@media (max-width: 100px)": { color: "red" },
        });
    });

    it("recurses into nested objects", () => {
        const result = expandBreakpoints(
            { ":hover": { "@bp2": { color: "blue" } } },
            config,
        );
        expect(result).toEqual({
            ":hover": { "@media (min-width: 1024px)": { color: "blue" } },
        });
    });

    it("does nothing when media is not configured", () => {
        const result = expandBreakpoints({ "@bp1": { color: "red" } }, {});
        expect(result).toEqual({ "@bp1": { color: "red" } });
    });
});

describe("expandBreakpoint", () => {
    it("expands @bp1 with leading @", () => {
        expect(expandBreakpoint("@bp1", config)).toBe(
            "@media (min-width: 640px)",
        );
    });

    it("expands bp1 without leading @", () => {
        expect(expandBreakpoint("bp1", config)).toBe(
            "@media (min-width: 640px)",
        );
    });

    it("returns undefined for unknown breakpoint", () => {
        expect(expandBreakpoint("@unknown", config)).toBeUndefined();
    });
});
