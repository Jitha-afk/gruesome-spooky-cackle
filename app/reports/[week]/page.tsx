import fs from "node:fs"
import path from "node:path"
import { WeekView } from "@/components/week-view"
import { loadWeeks, reportsRoot } from "@/lib/brief.mjs"

export const dynamicParams = false

export function generateStaticParams() {
  return loadWeeks(reportsRoot())
    .filter((week) => week.kind === "data" || week.kind === "brief")
    .map((week) => ({ week: week.name }))
}

export async function generateMetadata({ params }: { params: Promise<{ week: string }> }) {
  const { week } = await params
  const match = loadWeeks(reportsRoot()).find((item) => item.name === week && item.data)
  return { title: match?.data?.meta.title ?? "Weekly threat intel" }
}

export default async function WeekPage({ params }: { params: Promise<{ week: string }> }) {
  const { week } = await params
  const match = loadWeeks(reportsRoot()).find((item) => item.name === week && item.data)
  if (!match?.data) throw new Error(`${week} has no brief.md or data.json.`)
  if (match.kind === "brief") {
    const html = fs.readFileSync(path.join(process.cwd(), "generated", `${match.name}.html`), "utf8")
    return <div className="brief-doc" dangerouslySetInnerHTML={{ __html: html }} />
  }
  return <WeekView data={match.data} />
}
