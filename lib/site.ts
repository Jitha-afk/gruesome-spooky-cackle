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

// A page-level openGraph replaces the layout's, so pages spread this base.
export const OPEN_GRAPH = {
  type: "website",
  siteName: SITE_NAME,
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  images: [
    {
      url: "og.png",
      width: 1200,
      height: 630,
      alt: `${SITE_NAME} report for ${OWNER_NAME}.`,
    },
  ],
} satisfies Metadata["openGraph"]

/** The week's data.json on GitHub. */
export function dataUrl(week: string) {
  return `${REPO_URL}/blob/main/reports/${week}/data.json`
}
