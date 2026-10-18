/** Versions of the workspace's `@mochi-css/*` packages when this build was made; injected by tsdown. */
declare const __PACKAGE_VERSIONS__: Record<string, string> | undefined

/**
 * Install spec for a Mochi-CSS package, compatible with the version released alongside this tsuki.
 * Packages are versioned independently, so each one gets its own range; an unknown package installs
 * the latest version.
 */
export function mochiPackage(name: string): string {
    const versions = typeof __PACKAGE_VERSIONS__ === "undefined" ? {} : __PACKAGE_VERSIONS__
    const version = versions[name]
    return version ? `${name}@^${version}` : name
}
