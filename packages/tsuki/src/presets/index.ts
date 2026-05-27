import { libPreset } from "./lib"
import { vitePreset } from "./vite"
import { nextjsPreset } from "./nextjs"
import { tsdownPreset } from "./tsdown"
import type { Preset } from "@/types"

export { libPreset, vitePreset, nextjsPreset, tsdownPreset }

export const presets: Record<string, Preset> = {
    lib: libPreset,
    vite: vitePreset,
    nextjs: nextjsPreset,
    tsdown: tsdownPreset,
}
