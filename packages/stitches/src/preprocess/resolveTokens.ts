import { StitchesConfig } from "@/types";

// Matches $scale$token patterns (e.g. "$colors$bg", "$space$3")
const SCALE_TOKEN_RE = /\$([a-zA-Z]\w*)\$([a-zA-Z0-9_-]+)/g;

function resolveValue(
    key: string,
    value: string,
    config: StitchesConfig,
): string {
    if (!value.includes("$")) return value;
    const prefix = config.prefix ? `${config.prefix}-` : "";

    // Replace all $scale$token patterns within the value string
    const replaced = value.replace(
        SCALE_TOKEN_RE,
        (_, scale, token) => `var(--${prefix}${scale}-${token})`,
    );

    // If the entire value is a simple $token (no scale prefix), resolve via themeMap
    if (/^\$[a-zA-Z0-9_-]+$/.test(replaced)) {
        const tokenName = replaced.slice(1);
        const scale = config.themeMap?.[key];
        if (!scale) return replaced;
        return `var(--${prefix}${scale}-${tokenName})`;
    }

    return replaced;
}

export function resolveTokens(
    style: Record<string, unknown>,
    config: StitchesConfig,
): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(style)) {
        if (Array.isArray(value)) {
            result[key] = (value as unknown[]).map((item) =>
                item !== null && typeof item === "object"
                    ? resolveTokens(item as Record<string, unknown>, config)
                    : item,
            );
        } else if (value !== null && typeof value === "object") {
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
