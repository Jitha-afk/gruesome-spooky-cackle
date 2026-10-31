import type { WeekData, WeekRecord } from "./brief.mjs"

export type FeedSite = {
  /** Absolute site URL with a trailing slash. */
  url: string
  title: string
  subtitle: string
  author: { name: string; uri: string }
}

export function weekUpdated(data: WeekData): string
export function atomFeed(weeks: WeekRecord[], site: FeedSite): string
