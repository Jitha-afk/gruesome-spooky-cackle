import type { NextConfig } from "next"
import createMDX from "@next/mdx"

// GitHub Pages project site. Asset URLs include this path.
const basePath = "/gruesome-spooky-cackle"

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
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
