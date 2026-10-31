import { WeekView } from "@/components/week-view"
import { loadWeeks, reportsRoot } from "@/lib/brief.mjs"

export const dynamicParams = false

export function generateStaticParams() {
  return loadWeeks(reportsRoot())
    .filter((week) => week.kind === "data")
    .map((week) => ({ week: week.name }))
}

export async function generateMetadata({ params }: { params: Promise<{ week: string }> }) {
  const { week } = await params
  const match = loadWeeks(reportsRoot()).find((item) => item.name === week && item.data)
  return { title: match?.data?.meta.title ?? "Weekly threat intel" }
}

export default async function WeekPage({ params }: { params: Promise<{ week: string }> }) {
  const { week } = await params
  const match = loadWeeks(reportsRoot()).find((item) => item.name === week && item.kind === "data" && item.data)
  if (!match?.data) throw new Error(`${week} has no data.json.`)
  return <WeekView data={match.data} />
}
