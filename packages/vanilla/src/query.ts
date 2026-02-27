/**
 * Helper builders for CSS at-rule keys.
 * Provides a typed, ergonomic API for constructing @media, @container, and @supports rules.
 * @module query
 */

import type { AtRuleKey } from "@/props"

/**
 * Wraps a condition in parentheses if not already wrapped.
 */
function wrapParens(condition: string): string {
    const trimmed = condition.trim()
    if (trimmed.startsWith("(") && trimmed.endsWith(")")) return trimmed
    return `(${trimmed})`
}

// ─── @media ──────────────────────────────────────────────────────────────────

interface MediaHelper {
    /** `@media (condition)` */
    (condition: string): AtRuleKey & `@media ${string}`
    /** `@media (a) and (b) and …` */
    and(...conditions: [string, string, ...string[]]): AtRuleKey & `@media ${string}`
    /** `@media (a), (b), …` */
    or(...conditions: [string, string, ...string[]]): AtRuleKey & `@media ${string}`
    /** `@media (prefers-color-scheme: dark)` */
    readonly dark: AtRuleKey & `@media ${string}`
    /** `@media (prefers-color-scheme: light)` */
    readonly light: AtRuleKey & `@media ${string}`
    /** `@media (prefers-reduced-motion: no-preference)` */
    readonly motion: AtRuleKey & `@media ${string}`
    /** `@media print` */
    readonly print: AtRuleKey & `@media ${string}`
}

function mediaFn(condition: string): AtRuleKey & `@media ${string}` {
    return `@media ${wrapParens(condition)}` as AtRuleKey & `@media ${string}`
}

mediaFn.and = function (...conditions: [string, string, ...string[]]): AtRuleKey & `@media ${string}` {
    return `@media ${conditions.map(wrapParens).join(" and ")}` as AtRuleKey & `@media ${string}`
}

mediaFn.or = function (...conditions: [string, string, ...string[]]): AtRuleKey & `@media ${string}` {
    return `@media ${conditions.map(wrapParens).join(", ")}` as AtRuleKey & `@media ${string}`
}

Object.defineProperties(mediaFn, {
    dark: { get: () => "@media (prefers-color-scheme: dark)" as AtRuleKey & `@media ${string}`, enumerable: true },
    light: { get: () => "@media (prefers-color-scheme: light)" as AtRuleKey & `@media ${string}`, enumerable: true },
    motion: {
        get: () => "@media (prefers-reduced-motion: no-preference)" as AtRuleKey & `@media ${string}`,
        enumerable: true,
    },
    print: { get: () => "@media print" as AtRuleKey & `@media ${string}`, enumerable: true },
})

/** Helper for constructing `@media` at-rule keys. */
export const media = mediaFn as MediaHelper

// ─── @container ──────────────────────────────────────────────────────────────

interface ContainerHelper {
    /** `@container (condition)` — anonymous container */
    (condition: string): AtRuleKey & `@container ${string}`
    /** `@container name (condition)` — named container */
    named(name: string, condition: string): AtRuleKey & `@container ${string}`
}

function containerFn(condition: string): AtRuleKey & `@container ${string}` {
    return `@container ${wrapParens(condition)}` as AtRuleKey & `@container ${string}`
}

containerFn.named = function (name: string, condition: string): AtRuleKey & `@container ${string}` {
    return `@container ${name} ${wrapParens(condition)}` as AtRuleKey & `@container ${string}`
}

/** Helper for constructing `@container` at-rule keys. */
export const container = containerFn as ContainerHelper

// ─── @supports ───────────────────────────────────────────────────────────────

interface SupportsHelper {
    /** `@supports (declaration)` */
    (condition: string): AtRuleKey & `@supports ${string}`
    /** `@supports not (declaration)` */
    not(condition: string): AtRuleKey & `@supports ${string}`
    /** `@supports (a) and (b) and …` */
    and(...conditions: [string, string, ...string[]]): AtRuleKey & `@supports ${string}`
    /** `@supports (a) or (b) or …` */
    or(...conditions: [string, string, ...string[]]): AtRuleKey & `@supports ${string}`
}

function supportsFn(condition: string): AtRuleKey & `@supports ${string}` {
    return `@supports ${wrapParens(condition)}` as AtRuleKey & `@supports ${string}`
}

supportsFn.not = function (condition: string): AtRuleKey & `@supports ${string}` {
    return `@supports not ${wrapParens(condition)}` as AtRuleKey & `@supports ${string}`
}

supportsFn.and = function (...conditions: [string, string, ...string[]]): AtRuleKey & `@supports ${string}` {
    return `@supports ${conditions.map(wrapParens).join(" and ")}` as AtRuleKey & `@supports ${string}`
}

supportsFn.or = function (...conditions: [string, string, ...string[]]): AtRuleKey & `@supports ${string}` {
    return `@supports ${conditions.map(wrapParens).join(" or ")}` as AtRuleKey & `@supports ${string}`
}

/** Helper for constructing `@supports` at-rule keys. */
export const supports = supportsFn as SupportsHelper
