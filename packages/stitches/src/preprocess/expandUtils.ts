import { StitchesConfig } from "@/types";

export function expandUtils(
    style: Record<string, unknown>,
    config: StitchesConfig,
): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(style)) {
        const util = config.utils?.[key];
        if (util) {
            const expanded = util(value);
            const expandedRecursive = expandUtils(expanded, config);
            Object.assign(result, expandedRecursive);
        } else if (
            value !== null &&
            typeof value === "object" &&
            !Array.isArray(value)
        ) {
            result[key] = expandUtils(value as Record<string, unknown>, config);
        } else {
            result[key] = value;
        }
    }
    return result;
}
