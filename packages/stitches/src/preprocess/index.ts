import { StitchesConfig } from "@/types";
import { expandUtils } from "./expandUtils";
import { expandBreakpoints } from "./expandBreakpoints";
import { resolveScopedTokens } from "./resolveScopedTokens";
import { resolveTokens } from "./resolveTokens";

export { expandBreakpoint } from "./expandBreakpoints";

export function preprocess(
    style: Record<string, unknown>,
    config: StitchesConfig,
): Record<string, unknown> {
    let result = expandUtils(style, config);
    result = expandBreakpoints(result, config);
    result = resolveScopedTokens(result, config);
    result = resolveTokens(result, config);
    return result;
}
