import { StitchesTheme } from "@/types";

export function buildThemeRefs(
    theme: StitchesTheme,
    prefix = "",
): Record<string, Record<string, string>> {
    const pfx = prefix ? `${prefix}-` : "";
    return Object.fromEntries(
        Object.entries(theme).map(([scale, tokens]) => [
            scale,
            Object.fromEntries(
                Object.entries(tokens).map(([token]) => [
                    token,
                    `var(--${pfx}${scale}-${token})`,
                ]),
            ),
        ]),
    );
}
