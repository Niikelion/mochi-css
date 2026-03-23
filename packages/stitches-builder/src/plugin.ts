import type { MochiPlugin } from "@mochi-css/config";
import { createStitchesExtractor } from "./extractor/StitchesExtractor";

export function stitchesPlugin(): MochiPlugin {
    return {
        name: "mochi-stitches",
        onConfigResolved(config) {
            return {
                ...config,
                extractors: [...config.extractors, createStitchesExtractor],
            };
        },
    };
}
