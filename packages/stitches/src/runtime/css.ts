import {
    css as vanillaCss,
    MochiCSS,
    AllVariants,
    MochiCSSProps,
    MergeCSSVariants,
    VariantSlot,
} from "@mochi-css/vanilla";
import { StitchesConfig } from "@/types";
import { preprocess } from "@/preprocess";

export function runtimeCss<V extends unknown[]>(
    args: { [K in keyof V]: MochiCSSProps<VariantSlot<V[K]>> | MochiCSS },
    config: StitchesConfig,
): MochiCSS<MergeCSSVariants<V>> {
    const preprocessed = args.map((arg) => {
        if (arg instanceof MochiCSS) return arg;
        return preprocess(
            arg as Record<string, unknown>,
            config,
        ) as MochiCSSProps<AllVariants>;
    }) as { [K in keyof V]: MochiCSSProps<VariantSlot<V[K]>> | MochiCSS };

    return vanillaCss<V>(...preprocessed);
}
