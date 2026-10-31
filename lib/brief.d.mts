export type Flag = boolean | null

export type CveDetail = {
  id: string
  exploited_in_wild: Flag
  basis?: string
}

export type Sample = {
  text: string
  parent_url: string
  date_ist?: string
}

export type Cluster = {
  label: string
  sentiment_counts: Record<string, number>
  samples: Sample[]
}

export type Theme = {
  rank: number
  key: string
  name: string
  short_name?: string
  summary: string
  why: string
  affected: { products: string; sectors: string; regions: string }
  vendors: string[]
  media: string[]
  independent: string[]
  distinct_accounts: number
  x_engagement: number
  youtube_views: number
  key_items: string[]
  comments: { clusters: Cluster[] }
  cves: string[]
  exploited_in_wild: Flag
  cve_details: CveDetail[]
}

export type Source = {
  id: string
  platform: string
  type: string
  account: string
  date_ist: string
  text: string
  url: string
  engagement: number
  theme: string
  metrics: Record<string, number>
  image?: string | null
}

export type WeekData = {
  schema_version: number
  meta: {
    title: string
    window: { start: string; end: string }
    capture: { x: string; youtube: string }
    counts: {
      x_posts: number
      youtube_videos: number
      comments_analysed_top_themes: number
    }
    methodology: string
    inaccessible: string[]
  }
  themes: Theme[]
  ranking: { key: string; name: string; accounts: number; short_name?: string }[]
  sources: Source[]
}

export type WeekRecord = {
  name: string
  start: number
  end: number
  kind: "data" | "legacy"
  data: WeekData | null
  indexPath: string | null
}

export type IndexRow = {
  href: string
  window: string
  shortName: string | null
  title: string | null
  themeCount: number | null
}

export type CveView = { id: string; flag: Flag; tag: string; basis: string | null }
export type RankView = { key: string; label: string; title: string; accounts: number }
export type CommentView = {
  label: string
  positive: number
  neutral: number
  negative: number
  unclassified: number
  samples: { text: string; href: string; date: string }[]
}

export class BuildError extends Error {}
export function reportsRoot(): string
export function formatCount(value: number): string
export function shortLabel(name: string, shortName?: string | null): string
export function exploitedTag(flag: Flag): string
export function cveViews(theme: Theme): CveView[]
export function rankRows(data: WeekData): RankView[]
export function weekSummary(theme: Theme): string
export function commentModel(theme: Theme): CommentView[]
export function splitCounts(sources: Source[]): {
  type: { vendor: number; media: number; independent: number }
  platform: { X: number; YouTube: number }
}
export function sourceRows(data: WeekData): Source[]
export function themesByRank(data: WeekData): Theme[]
export function validateData(data: unknown, file?: string): WeekData
export function legacyWindow(week: WeekRecord): string
export function indexRow(week: WeekRecord): IndexRow
export function loadWeeks(reportsDir: string): WeekRecord[]
