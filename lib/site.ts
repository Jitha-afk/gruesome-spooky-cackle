import type { Metadata } from "next"
import { REPO_URL } from "./site-url.mjs"

export { BASE_PATH, REPO_URL, SITE_ORIGIN, SITE_URL } from "./site-url.mjs"

// Site identity for metadata, the footer and the feed.
export const SITE_NAME = "Weekly threat intel"
export const OWNER_NAME = "Jitesh Thakur"
export const OWNER_URL = "https://www.linkedin.com/in/jithamsft/"
export const SITE_TITLE = `${SITE_NAME} · ${OWNER_NAME}`
export const ISSUE_URL = `${REPO_URL}/issues/new`
export const SITE_DESCRIPTION =
  "Each week, AI agents find security posts and videos on X and YouTube. The report sorts the themes by the number of accounts. It shows CVE states, key sources and comment sentiment."

/** The size of the share cards: public/og.png and the og.png of each week. */
export const CARD_SIZE = { width: 1200, height: 630 }

/** The alt text of the share card of a week, for example for "23–29 Oct 2026". */
export function weekImageAlt(window: string) {
  return `${SITE_NAME} report for ${OWNER_NAME}, ${window}. A chart shows the top themes by the number of accounts.`
}

// A page-level openGraph replaces the layout's, so pages spread this base.
export const OPEN_GRAPH = {
  type: "website",
  siteName: SITE_NAME,
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  images: [
    {
      url: "og.png",
      ...CARD_SIZE,
      alt: `${SITE_NAME} report for ${OWNER_NAME}.`,
    },
  ],
} satisfies Metadata["openGraph"]

// Feed autodiscovery. A page-level alternates replaces the layout's, so pages spread this too.
export const FEED_TYPES = {
  "application/atom+xml": [{ url: "feed.xml", title: `${SITE_NAME} · Atom feed` }],
} satisfies NonNullable<Metadata["alternates"]>["types"]

/** The week's data.json on GitHub. */
export function dataUrl(week: string) {
  return `${REPO_URL}/blob/main/reports/${week}/data.json`
}
