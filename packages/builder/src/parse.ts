import {Module} from "@/ProjectIndex";
import fs from "fs/promises";
import * as SWC from "@swc/core";

export async function parseSource(source:string, filePath: string): Promise<Module> {
    return {
        ast: await SWC.parse(source, {
            syntax: "typescript",
            tsx: filePath.endsWith(".tsx"),
            target: "es2022"
        }),
        filePath
    }
}

export async function parseFile(filePath: string): Promise<Module> {
    const source=  await fs.readFile(filePath, "utf8")
    return await parseSource(source, filePath)
}
