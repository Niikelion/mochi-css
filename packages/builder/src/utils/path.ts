import * as systemPath from "path"
import * as winPath from "path/win32"

function posixToWin(p: string) {
    return p.replaceAll("/", "\\")
}

function winToPosix(p: string) {
    return p.replaceAll("\\", "/")
}

const needsConversion = systemPath.sep === winPath.sep
const normalizeOutput = needsConversion ? winToPosix : (p: string) => p

/**
 * Path utility that always produces posix-style paths (forward slashes) internally.
 * Uses system path operations under the hood so Windows drive letters are handled correctly.
 * Use `fromSystemPath`/`toSystemPath` at the filesystem boundary.
 */
export const path = {
    resolve: (...args: string[]) => normalizeOutput(systemPath.resolve(...args)),
    join: (...args: string[]) => normalizeOutput(systemPath.join(...args)),
    relative: (from: string, to: string) => normalizeOutput(systemPath.relative(from, to)),
    dirname: (p: string) => normalizeOutput(systemPath.dirname(p)),
    basename: (p: string, ext?: string) => systemPath.basename(p, ext),
    extname: (p: string) => systemPath.extname(p),
    isAbsolute: (p: string) => systemPath.isAbsolute(p),
    sep: "/" as string,
    fromSystemPath: normalizeOutput,
    toSystemPath: needsConversion ? posixToWin : normalizeOutput,
}
