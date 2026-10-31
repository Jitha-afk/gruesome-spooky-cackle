import type { Metadata } from "next"
import { WeekView } from "@/components/week-view"
import { heroLead, loadWeeks, previousDataWeek, reportsRoot, weekTitle, windowLabel } from "@/lib/brief.mjs"
import { CARD_SIZE, FEED_TYPES, OPEN_GRAPH, SITE_NAME, dataUrl, weekImageAlt } from "@/lib/site"

export const dynamicParams = false

export function generateStaticParams() {
  return loadWeeks(reportsRoot())
    .filter((week) => week.kind === "data")
    .map((week) => ({ week: week.name }))
}

export async function generateMetadata({ params }: { params: Promise<{ week: string }> }): Promise<Metadata> {
  const { week } = await params
  const match = loadWeeks(reportsRoot()).find((item) => item.name === week && item.data)
  if (!match?.data) return {}
  // The top theme names lead the title, so a share or a search result names the threats.
  const title = weekTitle(match.data)
  const description = heroLead(match.data)
  const url = `reports/${week}/`
  return {
    title,
    description,
    alternates: { canonical: url, types: FEED_TYPES },
    openGraph: {
      ...OPEN_GRAPH,
      type: "article",
      title: `${title} · ${SITE_NAME}`,
      description,
      url,
      // Each week has its own card, drawn from data.json by og.png/route.tsx.
      images: [{ url: `${url}og.png`, ...CARD_SIZE, alt: weekImageAlt(windowLabel(match.data)) }],
    },
  }
}

export default async function WeekPage({ params }: { params: Promise<{ week: string }> }) {
  const { week } = await params
  const weeks = loadWeeks(reportsRoot())
  const match = weeks.find((item) => item.name === week && item.kind === "data" && item.data)
  if (!match?.data) throw new Error(`${week} has no data.json.`)
  const previous = previousDataWeek(weeks, week)
  return <WeekView data={match.data} previous={previous?.data ?? null} dataHref={dataUrl(week)} />
}
