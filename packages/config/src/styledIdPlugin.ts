import { transformStyledIds } from "./styledIdTransform"
import type { MochiPlugin } from "@/config"

/**
 * Returns a MochiPlugin that injects stable `s-` class IDs into every `styled()` call
 * before parsing, via the source transform pipeline.
 */
export function styledIdPlugin(): MochiPlugin {
    return {
        name: "mochi-styled-ids",
        onLoad(context) {
            context.sourceTransform.registerTransformation(
                (source, { filePath }) => transformStyledIds(source, filePath),
                { filter: "*.{ts,tsx,js,jsx}" },
            )
        },
    }
}
