import fs from "fs/promises"
import * as p from "@clack/prompts"
import type { Module } from "@/types"

async function addToGitignore(entry: string): Promise<void> {
    const gitignorePath = ".gitignore"
    let content = ""
    try {
        content = await fs.readFile(gitignorePath, "utf-8")
    } catch {
        // file doesn't exist yet — we'll create it
    }

    const lines = content.split("\n")
    if (lines.some((line) => line.trim() === entry)) return

    const newContent = content.length > 0 && !content.endsWith("\n") ? `${content}\n${entry}\n` : `${content}${entry}\n`
    await fs.writeFile(gitignorePath, newContent)
}

export function createGitignoreModule(entry: string): Module {
    return {
        id: "gitignore",
        name: "Gitignore",

        async run(): Promise<void> {
            await addToGitignore(entry)
            p.log.success(`Added ${entry} to .gitignore`)
        },
    }
}
