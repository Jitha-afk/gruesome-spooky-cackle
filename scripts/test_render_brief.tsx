import assert from "node:assert/strict"
import path from "node:path"
import test from "node:test"
import type { ReactNode } from "react"
import { prerenderToNodeStream } from "react-dom/static"
import { BriefView, renderWeekMarkdown } from "../lib/render-brief"
import { loadBrief } from "../lib/brief.mjs"

const fixture = path.join(import.meta.dirname, "..", "fixtures", "synthetic-week", "brief.md")

async function renderHtml(element: ReactNode) {
  const { prelude } = await prerenderToNodeStream(element)
  const chunks: Buffer[] = []
  for await (const chunk of prelude) chunks.push(Buffer.from(chunk))
  return Buffer.concat(chunks).toString("utf8")
}

test("synthetic brief renders the template figures and the author block", async () => {
  const { data, sections } = loadBrief(fixture)
  const { markdown } = await renderWeekMarkdown(data, sections)
  assert.match(markdown, /::graph-stat/)
  assert.match(markdown, /::graph-rank/)
  assert.match(markdown, /::graph-heatmap/)
  assert.match(markdown, /::graph-stack/)
  assert.match(markdown, /::graph-table/)
  assert.match(markdown, /::graph-waffle/)
  assert.match(markdown, /::graph-spec/)
  assert.match(markdown, /title: "Hand placed"/)
  const html = await renderHtml(<BriefView data={data} name="synthetic" sections={sections} />)
  assert.match(html, /Synthetic week/)
  assert.match(html, /Alpha led the synthetic week/)
  assert.match(html, /A note for the alpha theme/)
  assert.match(html, /Hand placed/)
  assert.match(html, /CVE-2026-1/)
  assert.match(html, /NOT EXPLOITED/)
  assert.match(html, /A synthetic comment/)
  assert.match(html, /Patch CVE-2026-1 now/)
  assert.match(html, /By day/)
  assert.doesNotMatch(html, /<script/i)
})
