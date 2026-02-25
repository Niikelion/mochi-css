import type { GlobalCssStyles } from "@/globalCssObject"
export type { GlobalCssStyles } from "@/globalCssObject"

/**
 * Creates a global CSS definition.
 * Styles are not scoped to any class — they apply to all matching elements.
 *
 * @param styles - Map of CSS selectors to style objects
 *
 * @example
 * globalCss({
 *   'body': { margin: 0, padding: 0 },
 *   '*, *::before, *::after': { boxSizing: 'border-box' },
 * })
 */
export function globalCss(styles: GlobalCssStyles): void {
    void styles // mark as used
}
