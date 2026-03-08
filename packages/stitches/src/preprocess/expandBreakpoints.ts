import { StitchesConfig } from "@/types";

export function expandBreakpoints(
    style: Record<string, unknown>,
    config: StitchesConfig,
): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(style)) {
        if (key.startsWith("@") && config.media?.[key.slice(1)]) {
            const condition = config.media[key.slice(1)];
            const newKey = `@media ${condition}`;
            const newValue =
                value !== null &&
                typeof value === "object" &&
                !Array.isArray(value)
                    ? expandBreakpoints(
                          value as Record<string, unknown>,
                          config,
                      )
                    : value;
            result[newKey] = newValue;
        } else if (
            value !== null &&
            typeof value === "object" &&
            !Array.isArray(value)
        ) {
            result[key] = expandBreakpoints(
                value as Record<string, unknown>,
                config,
            );
        } else {
            result[key] = value;
        }
    }
    return result;
}

export function expandBreakpoint(
    bp: string,
    config: StitchesConfig,
): string | undefined {
    const name = bp.startsWith("@") ? bp.slice(1) : bp;
    const condition = config.media?.[name];
    if (!condition) return undefined;
    return `@media ${condition}`;
}
