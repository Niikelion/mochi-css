function escapeRegexLiteral(s: string): string {
    return s.replace(/[.+^${}()|[\]\\]/g, "\\$&")
}

function globToRegexBody(pattern: string): string {
    let result = ""
    let i = 0
    while (i < pattern.length) {
        const char = pattern.charAt(i)
        if (char === "*" && pattern.charAt(i + 1) === "*") {
            result += ".*"
            i += 2
            if (pattern.charAt(i) === "/") i++
        } else if (char === "*") {
            result += "[^/]*"
            i++
        } else if (char === "?") {
            result += "[^/]"
            i++
        } else if (char === "{") {
            const end = pattern.indexOf("}", i)
            if (end !== -1) {
                const alts = pattern
                    .slice(i + 1, end)
                    .split(",")
                    .map(escapeRegexLiteral)
                result += `(${alts.join("|")})`
                i = end + 1
            } else {
                result += "\\{"
                i++
            }
        } else {
            result += /[.+^$|()[\]\\]/.test(char) ? `\\${char}` : char
            i++
        }
    }
    return result
}

/**
 * Converts a Turbopack loader filter glob pattern to a RegExp.
 * - No `/` in pattern → matches filename only (anchored to last path segment)
 * - Contains `/` → matches against the full project-relative path
 */
export function globExToRegex(pattern: string): RegExp {
    const isPathPattern = pattern.includes("/")
    const body = globToRegexBody(pattern)
    return isPathPattern ? new RegExp(body) : new RegExp(`(?:^|/)${body}$`)
}
