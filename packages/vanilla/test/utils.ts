import { afterEach } from "vitest"
import type { ReactElement } from "react"
import { render as rtlRender, cleanup as rtlCleanup } from "@testing-library/react"
import { CSSObject, AllVariants, MochiCSSProps, MergeCSSVariants } from "@/cssObject"
import { MochiCSS, mergeMochiCss } from "@/css"
import { GlobalCssObject } from "@/globalCssObject"
import type { GlobalCssStyles } from "@/globalCss"
import { camelToKebab } from "@/props"
import { CSSStyleDeclaration } from "happy-dom"

const STYLE_ELEMENT_ID = "mochi-test-styles"

function normalizeValue(kebabProp: string, value: string): string {
    const el = document.createElement("div")
    document.body.appendChild(el)
    el.style.setProperty(kebabProp, value)
    const normalized = getComputedStyle(el).getPropertyValue(kebabProp)
    el.remove()
    return normalized.trim()
}

export function toMatchCss(
    received: CSSStyleDeclaration,
    expected: Record<string, string>,
): { pass: boolean; message: () => string } {
    const mismatches: string[] = []

    for (const [prop, expectedValue] of Object.entries(expected)) {
        const kebabProp = camelToKebab(prop)
        const actualValue = received.getPropertyValue(kebabProp).trim()
        const normalizedExpected = normalizeValue(kebabProp, expectedValue)

        if (actualValue !== normalizedExpected) {
            mismatches.push(`  ${prop}: expected "${normalizedExpected}", got "${actualValue}"`)
        }
    }

    if (mismatches.length === 0) {
        return { pass: true, message: () => "All CSS properties match" }
    }

    return {
        pass: false,
        message: () => `CSS property mismatches:\n${mismatches.join("\n")}`,
    }
}

declare module "@vitest/expect" {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    interface Assertion<T = any> {
        toMatchCss(expected: Record<string, string>): T
    }
    interface AsymmetricMatchersContaining {
        toMatchCss(expected: Record<string, string>): unknown
    }
}

class TestRenderer {
    private capturedCss: string[] = []
    private styleEl: HTMLStyleElement | null = null

    css<V extends AllVariants[]>(
        ...props: { [K in keyof V]: MochiCSSProps<V[K]> | MochiCSS }
    ): MochiCSS<MergeCSSVariants<V>> {
        const cssToMerge: MochiCSS<AllVariants>[] = []
        for (const p of props) {
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (p == null || typeof p !== "object") continue
            if (p instanceof MochiCSS) {
                cssToMerge.push(p)
            } else {
                const obj = new CSSObject<AllVariants>(p)
                this.capturedCss.push(obj.asCssString())
                cssToMerge.push(MochiCSS.from(obj))
            }
        }
        return mergeMochiCss(cssToMerge)
    }

    globalCss(styles: GlobalCssStyles): void {
        const obj = new GlobalCssObject(styles)
        this.capturedCss.push(obj.asCssString())
    }

    render(element: ReactElement) {
        this.injectCss()
        return rtlRender(element)
    }

    cleanup(): void {
        rtlCleanup()
        this.styleEl?.remove()
        this.styleEl = null
        this.capturedCss = []
    }

    private injectCss(): void {
        if (!this.styleEl) {
            this.styleEl = document.createElement("style")
            this.styleEl.id = STYLE_ELEMENT_ID
            document.head.appendChild(this.styleEl)
        }
        this.styleEl.textContent = this.capturedCss.join("\n\n")
    }
}

export function createTestRenderer(): TestRenderer {
    const renderer = new TestRenderer()
    afterEach(() => {
        renderer.cleanup()
    })
    return renderer
}
