import { ImageResponse } from "next/og"
import { loadWeeks, reportsRoot } from "@/lib/brief.mjs"
import { ShareCard, cardFonts } from "@/lib/og-card"
import { SHARE_SIZE } from "@/lib/site"

export const dynamic = "force-static"
export const dynamicParams = false

export function generateStaticParams() {
  return loadWeeks(reportsRoot())
    .filter((week) => week.kind === "data")
    .map((week) => ({ week: week.name }))
}

// Not linked from the pages. The owner attaches it to the post for each week.
export async function GET(_request: Request, { params }: { params: Promise<{ week: string }> }) {
  const { week } = await params
  const match = loadWeeks(reportsRoot()).find((item) => item.name === week && item.kind === "data" && item.data)
  if (!match?.data) throw new Error(`${week} has no data.json.`)
  return new ImageResponse(<ShareCard data={match.data} />, { ...SHARE_SIZE, fonts: cardFonts() })
}
