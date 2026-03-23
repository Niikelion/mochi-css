import { shortHash } from "@mochi-css/vanilla";
import { StitchesConfig, StitchesTheme } from "@/types";

export type ThemeResult = {
    className: string;
    [scale: string]: string | Record<string, string>;
};

export function buildThemeClassName(tokens: StitchesTheme): string {
    const sortedTokens = JSON.stringify(
        Object.fromEntries(
            Object.entries(tokens)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([scale, vals]) => [
                    scale,
                    Object.fromEntries(
                        Object.entries(vals).sort(([a], [b]) =>
                            a.localeCompare(b),
                        ),
                    ),
                ]),
        ),
    );
    return `th-${shortHash(sortedTokens)}`;
}

export function runtimeCreateTheme(
    tokens: StitchesTheme,
    config: StitchesConfig,
): ThemeResult {
    const prefix = config.prefix ? `${config.prefix}-` : "";
    const className = buildThemeClassName(tokens);

    const tokenRefs = Object.fromEntries(
        Object.entries(tokens).map(([scale, vals]) => [
            scale,
            Object.fromEntries(
                Object.entries(vals).map(([token]) => [
                    token,
                    `var(--${prefix}${scale}-${token})`,
                ]),
            ),
        ]),
    );

    return { className, ...tokenRefs };
}
