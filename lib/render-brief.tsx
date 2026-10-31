import fs from "node:fs"
import path from "node:path"
import type { ComponentType } from "react"
import { parseMarkdown } from "comark"
import { MarkdownDocument } from "@comark/react"
import { prerenderToNodeStream } from "react-dom/static"
import { createEngine, standardFilters, type TemplateFilter } from "knap"
import { Callout } from "@/registry/default/callout/callout"
import { GRAPH_ADAPTERS } from "@/registry/default/graph-comark/adapters"
import { graphFilters } from "@/registry/default/graph-knap/graph-knap"
import { unquoteParam } from "@/registry/default/graph-knap/props"
import { GraphHeatmap } from "@/registry/default/graph-heatmap/graph-heatmap"
import { GraphRank } from "@/registry/default/graph-rank/graph-rank"
import { GraphStat } from "@/registry/default/graph-stat/graph-stat"
import { adaptGraph, BriefSpec, BriefStack, BriefTable, BriefWaffle } from "@/components/brief-figures"
import { pageModel } from "@/lib/page-model.mjs"
import type { WeekData } from "@/lib/brief.mjs"

const templatePath = path.join(process.cwd(), "templates", "week.knap.md")

function comarkFilters(): Record<string, TemplateFilter> {
  const filters: Record<string, TemplateFilter> = {}
  for (const [name, filter] of Object.entries(graphFilters)) {
    const wrapped: TemplateFilter = (value, param, context) => {
      const token = unquoteParam(param)
      let raw = context?.rawValue
      if (token && token !== "comark" && raw && typeof raw === "object" && !Array.isArray(raw)) {
        raw = { ...(raw as Record<string, unknown>), title: token }
      }
      const text = raw === undefined ? value : JSON.stringify(raw)
      return filter(text, "comark", { ...context, rawValue: raw })
    }
    filters[name] = wrapped
  }
  return filters
}

const engine = createEngine({
  filters: { ...standardFilters, ...comarkFilters() },
  limits: {
    maxTemplateLength: 1_000_000,
    maxOutputLength: 5_000_000,
    maxValueLength: 5_000_000,
    maxOperations: 200_000,
    maxDepth: 100,
  },
})

const asGraph = <T,>(component: T) => component as unknown as ComponentType<Record<string, unknown>>

const components = {
  callout: adaptGraph(asGraph(Callout), GRAPH_ADAPTERS.callout),
  "graph-stat": adaptGraph(asGraph(GraphStat), GRAPH_ADAPTERS["graph-stat"]),
  "graph-rank": adaptGraph(asGraph(GraphRank), GRAPH_ADAPTERS["graph-rank"]),
  "graph-heatmap": adaptGraph(asGraph(GraphHeatmap), GRAPH_ADAPTERS["graph-heatmap"]),
  "graph-stack": adaptGraph(asGraph(BriefStack), GRAPH_ADAPTERS["graph-stack"]),
  "graph-table": adaptGraph(asGraph(BriefTable), GRAPH_ADAPTERS["graph-table"]),
  "graph-waffle": adaptGraph(asGraph(BriefWaffle), GRAPH_ADAPTERS["graph-waffle"]),
  "graph-spec": adaptGraph(asGraph(BriefSpec), GRAPH_ADAPTERS["graph-spec"]),
}

const blockPattern = /::([A-Za-z][\w-]*)\n---\n[\s\S]*?\n::/g

async function streamToString(stream: AsyncIterable<Uint8Array | string>) {
  const chunks: Buffer[] = []
  for await (const chunk of stream) chunks.push(Buffer.from(chunk))
  return Buffer.concat(chunks).toString("utf8")
}

function unwrap(html: string) {
  const match = html.match(/^<div class="comark-content[^"]*">([\s\S]*)<\/div>$/)
  return match ? match[1] : html
}

export async function comarkToHtml(markdown: string) {
  if (!markdown.trim()) return ""
  const document = await parseMarkdown(markdown)
  const { prelude } = await prerenderToNodeStream(
    <MarkdownDocument components={components} value={document} />,
  )
  return unwrap(await streamToString(prelude))
}

async function spliceBlocks(markdown: string) {
  const matches = [...markdown.matchAll(blockPattern)]
  if (matches.length === 0) return markdown
  let html = ""
  let cursor = 0
  for (const match of matches) {
    const index = match.index ?? 0
    html += markdown.slice(cursor, index)
    html += await comarkToHtml(match[0])
    cursor = index + match[0].length
  }
  html += markdown.slice(cursor)
  return html
}

export async function renderWeekMarkdown(
  data: WeekData,
  sections: Record<string, string> = {},
) {
  const template = fs.readFileSync(templatePath, "utf8")
  const started = performance.now()
  const result = await engine.render(template, { variables: pageModel(data, sections) })
  const knapMs = performance.now() - started
  if (result.errors.length > 0) {
    const message = result.errors.map((error) => error.message).join("; ")
    throw new Error(`Knap template failed. ${message}`)
  }
  return { markdown: result.output, knapMs }
}

export async function renderWeekHtml(
  data: WeekData,
  sections: Record<string, string> = {},
  name = "week",
) {
  const rendered: Record<string, string> = {}
  const parseStarted = performance.now()
  for (const [key, body] of Object.entries(sections)) {
    rendered[key] = body.trim() ? await comarkToHtml(body) : ""
  }
  const { markdown, knapMs } = await renderWeekMarkdown(data, rendered)
  const html = await spliceBlocks(markdown)
  const comarkMs = performance.now() - parseStarted
  console.log(
    `brief ${name}: knap ${Math.round(knapMs)}ms, comark ${Math.round(comarkMs)}ms, frontmatter+sources ready`,
  )
  return html
}

export async function BriefView({
  data,
  sections = {},
  name = "week",
}: {
  data: WeekData
  sections?: Record<string, string>
  name?: string
}) {
  const html = await renderWeekHtml(data, sections, name)
  return <div className="brief-doc" dangerouslySetInnerHTML={{ __html: html }} />
}
