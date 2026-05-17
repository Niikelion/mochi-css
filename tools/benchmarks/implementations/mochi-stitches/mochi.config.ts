import { stitchesPlugin } from "@mochi-css/stitches/config"
import type { Config } from "@mochi-css/config"

export default {
    plugins: [stitchesPlugin()],
} satisfies Partial<Config>
