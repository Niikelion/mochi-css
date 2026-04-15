import { createExtractorsPlugin } from "@mochi-css/plugins";
import type { MochiPlugin } from "@mochi-css/config";
import { createStitchesExtractor } from "./extractor/StitchesExtractor";

export function stitchesPlugin(): MochiPlugin {
    return createExtractorsPlugin([createStitchesExtractor]);
}
