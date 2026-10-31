import type { MDXComponents } from "mdx/types"
import { withMdxcn } from "@/registry/default/mdx/mdx"

// withMdxcn labels replaced tags so graphs still read li/table/etc, and upgrades
// > [!WARNING] → Callout, quote bylines → Quote, ```console → Terminal, footnotes.
// Each MDX page imports only the mdxcn parents it uses, to keep page JS small.
export function useMDXComponents(components: MDXComponents = {}): MDXComponents {
  return withMdxcn({ ...components })
}
