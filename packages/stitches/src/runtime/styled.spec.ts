import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { runtimeStyled, MochiStyledComponent } from "./styled";

const config = { themeMap: {}, theme: {}, prefix: "" };

function renderHtml(element: React.ReactNode): string {
    return renderToStaticMarkup(element as React.ReactElement);
}

describe("component-targeting selectors", () => {
    it("selector returns .className", () => {
        const Button = runtimeStyled("button", [{ color: "red" }], config);
        expect(Button.selector).toMatch(/^\.[a-z0-9]+/);
    });

    it("toString returns selector", () => {
        const Button = runtimeStyled("button", [{ color: "red" }], config);
        expect(String(Button)).toBe(Button.selector);
        expect(`${Button}`).toBe(Button.selector);
    });

    it("selector is consistent across accesses", () => {
        const Button = runtimeStyled("button", [{ color: "red" }], config);
        expect(Button.selector).toBe(Button.selector);
    });

    it("different styles produce different selectors", () => {
        const A = runtimeStyled("button", [{ color: "red" }], config);
        const B = runtimeStyled("button", [{ color: "blue" }], config);
        expect(A.selector).not.toBe(B.selector);
    });
});

describe("polymorphic as prop", () => {
    it("renders as default element when no as prop provided", () => {
        const Button = runtimeStyled("button", [{}], config);
        const html = renderHtml(
            createElement(
                Button as MochiStyledComponent<{ children?: unknown }>,
                {},
                "Click",
            ),
        );
        expect(html).toContain("<button");
    });

    it("renders as the element specified by as prop", () => {
        const Button = runtimeStyled("button", [{}], config);
        const html = renderHtml(
            createElement(
                Button as MochiStyledComponent<{
                    as?: string;
                    href?: string;
                    children?: unknown;
                }>,
                { as: "a", href: "/test" },
                "Link",
            ),
        );
        expect(html).toContain("<a ");
        expect(html).not.toContain("<button");
    });

    it("passes extra props to the rendered element", () => {
        const Button = runtimeStyled("button", [{}], config);
        const html = renderHtml(
            createElement(
                Button as MochiStyledComponent<{ as?: string; href?: string }>,
                { as: "a", href: "/about" },
            ),
        );
        expect(html).toContain('href="/about"');
    });
});

describe("variant inheritance", () => {
    it("child is a MochiStyledComponent with selector", () => {
        const Button = runtimeStyled(
            "button",
            [
                {
                    variants: {
                        size: {
                            small: { padding: "4px" },
                            large: { padding: "16px" },
                        },
                    },
                },
            ],
            config,
        );
        const PrimaryButton = runtimeStyled(
            Button,
            [{ backgroundColor: "blue" }],
            config,
        );
        expect(PrimaryButton.selector).toMatch(/^\./);
    });

    it("child renders to the parent render target element", () => {
        const Button = runtimeStyled("button", [{ color: "red" }], config);
        const PrimaryButton = runtimeStyled(
            Button,
            [{ backgroundColor: "blue" }],
            config,
        );

        const html = renderHtml(
            createElement(
                PrimaryButton as MochiStyledComponent<{ children?: unknown }>,
                {},
                "Test",
            ),
        );
        expect(html).toContain("<button");
    });

    it("child accepts both parent and own variants", () => {
        const Button = runtimeStyled(
            "button",
            [
                {
                    variants: {
                        size: {
                            small: { padding: "4px" },
                            large: { padding: "16px" },
                        },
                    },
                },
            ],
            config,
        );
        const PrimaryButton = runtimeStyled(
            Button,
            [{ variants: { intent: { primary: { color: "white" } } } }],
            config,
        );

        // Should render without error when both parent and child variants are passed
        expect(() =>
            renderHtml(
                createElement(
                    PrimaryButton as MochiStyledComponent<{
                        size?: string;
                        intent?: string;
                    }>,
                    { size: "large", intent: "primary" },
                ),
            ),
        ).not.toThrow();
    });

    it("child className includes parent base class", () => {
        const Button = runtimeStyled("button", [{ color: "red" }], config);
        const PrimaryButton = runtimeStyled(
            Button,
            [{ backgroundColor: "blue" }],
            config,
        );

        // Render button and primary button — primary's rendered element must have more classes
        const buttonHtml = renderHtml(
            createElement(Button as MochiStyledComponent, {}),
        );
        const primaryHtml = renderHtml(
            createElement(PrimaryButton as MochiStyledComponent, {}),
        );

        // Extract class attribute values
        const buttonClass = /class="([^"]+)"/.exec(buttonHtml)?.[1] ?? "";
        const primaryClass = /class="([^"]+)"/.exec(primaryHtml)?.[1] ?? "";

        const buttonClasses = buttonClass.split(" ");
        const primaryClasses = primaryClass.split(" ");

        // All button's classes should be in primary's classes (inherited)
        for (const cls of buttonClasses) {
            expect(primaryClasses).toContain(cls);
        }
        // Primary should also have its own additional class
        expect(primaryClasses.length).toBeGreaterThan(buttonClasses.length);
    });
});
