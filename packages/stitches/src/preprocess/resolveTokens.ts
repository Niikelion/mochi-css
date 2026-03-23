import { StitchesConfig } from "@/types";

function resolveValue(
    key: string,
    value: string,
    config: StitchesConfig,
): string {
    if (!value.startsWith("$")) return value;
    const tokenName = value.slice(1);
    const scale = config.themeMap?.[key];
    if (!scale) return value;
    return `var(--${scale}-${tokenName})`;
}

export function resolveTokens(
    style: Record<string, unknown>,
    config: StitchesConfig,
): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(style)) {
        if (
            value !== null &&
            typeof value === "object" &&
            !Array.isArray(value)
        ) {
            result[key] = resolveTokens(
                value as Record<string, unknown>,
                config,
            );
        } else if (typeof value === "string") {
            result[key] = resolveValue(key, value, config);
        } else {
            result[key] = value;
        }
    }
    return result;
}
