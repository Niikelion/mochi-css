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
