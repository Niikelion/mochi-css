import { describe, expect, expectTypeOf, it } from "vitest"
import { css } from "@/css"
import type { RefineVariantType } from "@/cssObject"

describe("boolean variant inference", () => {
    it("widens either boolean key while preserving other string options", () => {
        expectTypeOf<RefineVariantType<"true">>().toEqualTypeOf<boolean>()
        expectTypeOf<RefineVariantType<"false">>().toEqualTypeOf<boolean>()
        expectTypeOf<RefineVariantType<"true" | "false">>().toEqualTypeOf<boolean>()
        expectTypeOf<RefineVariantType<"small" | "large">>().toEqualTypeOf<"small" | "large">()
        expectTypeOf<RefineVariantType<"true" | "auto">>().toEqualTypeOf<boolean | "auto">()
    })

    it("accepts both boolean values for single-option variants and defaults", () => {
        const styles = css({
            variants: {
                active: { true: { color: "red" } },
                disabled: { false: { opacity: 1 } },
            },
            defaultVariants: { active: false, disabled: true },
        })

        expectTypeOf<Parameters<typeof styles.variant>[0]>().toEqualTypeOf<{
            active?: boolean
            disabled?: boolean
        }>()

        const select = (value: boolean) => styles.variant({ active: value, disabled: !value })
        expect(select(false)).toBe(styles.classNames.join(" "))
        expect(select(true)).not.toBe(select(false))
    })
})

describe("variants across several styles", () => {
    const tones = { variants: { tone: { error: { color: "red" }, warning: { color: "orange" } } } }

    it("keeps variants when another style has none", () => {
        const before = css(tones, { margin: 0 })
        const after = css({ margin: 0 }, tones)
        const withClass = css(tones, "extra")

        expectTypeOf<Parameters<typeof before.variant>[0]>().toEqualTypeOf<{ tone?: "error" | "warning" }>()
        expectTypeOf<Parameters<typeof after.variant>[0]>().toEqualTypeOf<{ tone?: "error" | "warning" }>()
        expectTypeOf<Parameters<typeof withClass.variant>[0]>().toEqualTypeOf<{ tone?: "error" | "warning" }>()

        for (const styles of [before, after, withClass]) {
            expect(styles.variant({ tone: "warning" })).not.toBe(styles.variant({ tone: "error" }))
        }
    })

    it("merges variants from every style, later ones overriding earlier", () => {
        const styles = css(
            tones,
            { variants: { size: { small: {}, large: {} } } },
            { variants: { tone: { info: {} } } },
        )

        expectTypeOf<Parameters<typeof styles.variant>[0]>().toEqualTypeOf<{
            tone?: "info"
            size?: "small" | "large"
        }>()
        expect(styles.variant({ tone: "info", size: "large" })).toContain(styles.classNames[0])
    })

    it("has no variants when no style declares any", () => {
        const styles = css({ margin: 0 }, { padding: 0 })

        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        expectTypeOf<Parameters<typeof styles.variant>[0]>().toEqualTypeOf<{}>()
        expect(styles.variant({})).toBe(styles.classNames.join(" "))
    })

    it("still checks default variants against their style", () => {
        // @ts-expect-error "nope" is not a tone
        css({ ...tones, defaultVariants: { tone: "nope" } }, { margin: 0 })
    })
})
