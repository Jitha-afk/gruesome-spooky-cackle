import type { NextConfig } from "next"
import createMDX from "@next/mdx"
import { BASE_PATH } from "./lib/site-url.mjs"

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  // GitHub Pages project site. Asset URLs include this path.
  basePath: BASE_PATH,
  images: { unoptimized: true },
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  turbopack: {
    rules: {
      "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" },
    },
  },
}

const withMDX = createMDX({
  options: { remarkPlugins: ["remark-gfm"] },
})

export default withMDX(nextConfig)
