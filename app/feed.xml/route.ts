import { loadWeeks, reportsRoot } from "@/lib/brief.mjs"
import { atomFeed } from "@/lib/feed.mjs"
import { OWNER_NAME, OWNER_URL, SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from "@/lib/site"

export const dynamic = "force-static"

export function GET() {
  const xml = atomFeed(loadWeeks(reportsRoot()), {
    url: SITE_URL,
    title: SITE_TITLE,
    subtitle: SITE_DESCRIPTION,
    author: { name: OWNER_NAME, uri: OWNER_URL },
  })
  return new Response(xml, { headers: { "Content-Type": "application/atom+xml; charset=utf-8" } })
}
