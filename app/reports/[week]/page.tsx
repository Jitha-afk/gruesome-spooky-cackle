import { WeekView } from "@/components/week-view"
import { loadWeeks, previousDataWeek, reportsRoot, windowLabel } from "@/lib/brief.mjs"

export const dynamicParams = false

export function generateStaticParams() {
  return loadWeeks(reportsRoot())
    .filter((week) => week.kind === "data")
    .map((week) => ({ week: week.name }))
}

export async function generateMetadata({ params }: { params: Promise<{ week: string }> }) {
  const { week } = await params
  const match = loadWeeks(reportsRoot()).find((item) => item.name === week && item.data)
  if (!match?.data) return { title: "Weekly threat intel" }
  return {
    title: `${match.data.meta.title} · ${windowLabel(match.data)}`,
    description: match.data.meta.bottom_line ?? `Weekly threat-intel brief for ${windowLabel(match.data)}.`,
  }
}

export default async function WeekPage({ params }: { params: Promise<{ week: string }> }) {
  const { week } = await params
  const weeks = loadWeeks(reportsRoot())
  const match = weeks.find((item) => item.name === week && item.kind === "data" && item.data)
  if (!match?.data) throw new Error(`${week} has no data.json.`)
  const previous = previousDataWeek(weeks, week)
  return <WeekView data={match.data} previous={previous?.data ?? null} />
}
