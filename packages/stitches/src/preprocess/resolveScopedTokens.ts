import { StitchesConfig } from "@/types";

export function resolveScopedTokens(
    style: Record<string, unknown>,
    config: StitchesConfig,
): Record<string, unknown> {
    const prefix = config.prefix ? `${config.prefix}-` : "";
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(style)) {
        if (key.startsWith("$$")) {
            const varName = `--${prefix}${key.slice(2)}`;
            result[varName] = value;
        } else if (
            value !== null &&
            typeof value === "object" &&
            !Array.isArray(value)
        ) {
            result[key] = resolveScopedTokens(
                value as Record<string, unknown>,
                config,
            );
        } else if (typeof value === "string" && value.startsWith("$$")) {
            const varName = `--${prefix}${value.slice(2)}`;
            result[key] = `var(${varName})`;
        } else {
            result[key] = value;
        }
    }
    return result;
}
