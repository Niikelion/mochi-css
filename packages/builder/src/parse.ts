import {Module} from "@/ProjectIndex";
import fs from "fs/promises";
import * as SWC from "@swc/core";
import {MochiError, getErrorMessage} from "@/diagnostics";

export async function parseSource(source: string, filePath: string): Promise<Module> {
    try {
        return {
            ast: await SWC.parse(source, {
                syntax: "typescript",
                tsx: filePath.endsWith(".tsx"),
                target: "es2022"
            }),
            filePath
        }
    } catch (err) {
        const message = getErrorMessage(err)
        throw new MochiError('MOCHI_PARSE', message, filePath, err)
    }
}

export async function parseFile(filePath: string): Promise<Module> {
    let source: string
    try {
        source = await fs.readFile(filePath, "utf8")
    } catch (err) {
        const message = getErrorMessage(err)
        throw new MochiError('MOCHI_FILE_READ', message, filePath, err)
    }
    return await parseSource(source, filePath)
}
