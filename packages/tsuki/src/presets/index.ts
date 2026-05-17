import { libPreset } from "./lib"
import { vitePreset } from "./vite"
import { nextjsPreset } from "./nextjs"
import { esbuildPreset } from "./esbuild"
import type { Preset } from "@/types"

export { libPreset, vitePreset, nextjsPreset, esbuildPreset }

export const presets: Record<string, Preset> = {
    lib: libPreset,
    vite: vitePreset,
    nextjs: nextjsPreset,
    esbuild: esbuildPreset,
}
