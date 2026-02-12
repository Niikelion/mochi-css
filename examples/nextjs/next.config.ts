import type { NextConfig } from "next";
import { withMochi } from "@mochi-css/next"

const nextConfig: NextConfig = {
  distDir: "dist"
}

export default withMochi(nextConfig, {
    //
})
