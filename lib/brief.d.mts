export type Flag = boolean | null

export type CveDetail = {
  id: string
  exploited_in_wild: Flag
  basis?: string
  cvss?: number | null
  advisory_url?: string | null
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
  why_line?: string
  affected: { products: string; sectors: string; regions: string }
  vendors: string[]
  media: string[]
  independent: string[]
  distinct_accounts: number
  x_engagement: number
  youtube_views: number
  key_items: string[]
  comments: { clusters: Cluster[]; sentiment?: Partial<Sentiment> }
  cves: string[]
  exploited_in_wild: Flag
  cve_details: CveDetail[]
  actions?: string[]
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
    generated?: string
    window: { start: string; end: string }
    capture: { x: string; youtube: string } & Record<string, unknown>
    counts: {
      x_posts: number
      youtube_videos: number
      comments_analysed_top_themes: number
    } & Record<string, unknown>
    methodology: string
    inaccessible: string[]
    bottom_line?: string | null
    also_observed?: string[]
    method_steps?: { title: string; detail?: string | null }[]
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
  /** Short window, for example "23–29 Oct 2026". */
  label: string
  /** Day the brief was generated, for example "30 Oct". */
  published: string | null
  shortName: string | null
  title: string | null
  themeCount: number | null
}

export type CveView = {
  id: string
  flag: Flag
  tag: string
  basis: string | null
  cvss: number | null
  advisory: string | null
}
export type Facet = { key: string; count: number }
export type WeekDelta = {
  label: string
  totals: { themes: number; sources: number; comments: number; cves: number; exploited: number }
  themes: Record<string, { isNew: boolean; rank: number; accounts: number }>
  dropped: { key: string; label: string }[]
}
export type RankView = { key: string; label: string; title: string; accounts: number }
export type CommentView = {
  label: string
  positive: number
  neutral: number
  negative: number
  unclassified: number
  samples: { text: string; href: string; date: string }[]
}
export type Sentiment = { positive: number; neutral: number; negative: number; unclassified: number }
export type ThemeRow = {
  key: string
  rank: number
  name: string
  label: string
  accounts: number
  share: number
  engagement: number
  views: number
  spark: number[]
  cves: number
  exploited: number
  unconfirmed: number
  mix: { vendor: number; media: number; independent: number }
  platforms: Facet[]
  sentiment: Sentiment
  comments: number
}

export class BuildError extends Error {}
export function reportsRoot(): string
export function formatCount(value: number): string
export function formatKpi(value: number): string
export function graphemes(text: string): string[]
export function shortLabel(name: string, shortName?: string | null): string
export function nameDetail(name: string, label?: string | null): string
export function exploitedTag(flag: Flag): string
export function cveViews(theme: Theme): CveView[]
export function rankRows(data: WeekData): RankView[]
export function whyText(theme: Theme): { text: string; clamp: boolean }
export function previewCves(theme: Theme, limit?: number): { shown: CveView[]; extra: number }
export function heroLead(data: WeekData): string
export function commentModel(theme: Theme): CommentView[]
export function isRealDay(text: unknown): boolean
export function rangeLabel(startText: string, endText: string): string
export function windowLabel(data: WeekData): string
export function windowDays(data: WeekData): { iso: string; label: string }[]
export function heatmapModel(data: WeekData): { columns: string[]; rows: { label: string; values: number[] }[] }
export function sparkGlyphs(series: number[]): string[]
export function sparkSummary(series: number[], days: { label: string }[]): string
export function sparkSeries(theme: Theme, data: WeekData): number[]
export function headlineStats(data: WeekData): {
  themes: number
  sources: number
  comments: number
  exploited: number
  cves: number
}
export function cveTableRows(data: WeekData): {
  id: string
  key: string
  theme: string
  tag: string
  flag: Flag
  basis: string
  rank: number
  cvss: number | null
  advisory: string | null
}[]
export function sentimentTotals(data: WeekData): Sentiment
export function themeSentiment(theme: Theme): Sentiment
export function themeRows(data: WeekData): ThemeRow[]
export function sourceFacets(data: WeekData): { type: Facet[]; platform: Facet[] }
export function platformUnits(platform: string): { noun: string; metric: string }
export function safeHref(url: unknown): string | null
export function bottomLine(data: WeekData): string | null
export function alsoObserved(data: WeekData): string[]
export function methodSteps(data: WeekData): { title: string; detail: string | null }[]
export function themeActions(theme: Theme): string[]
export type FunnelStage = { label: string; count: number; drop: number }
export function funnelModel(data: WeekData): {
  sources: FunnelStage[]
  comments: FunnelStage[]
  removed: { label: string; count: number }[]
}
export function previousDataWeek(weeks: WeekRecord[], name: string): WeekRecord | null
export function weekDelta(current: WeekData, previous: WeekData | null | undefined): WeekDelta | null
export function waffleParts(
  totals: { positive: number; neutral: number; negative: number; unclassified: number },
  cells?: number,
): { key: string; count: number; cells: number }[]
export function sourceRows(data: WeekData): Source[]
export function themesByRank(data: WeekData): Theme[]
export function withPositionalRanks(data: WeekData): WeekData
export function validateData(data: unknown, file?: string): WeekData
export function legacyWindow(week: WeekRecord): string
export function indexRow(week: WeekRecord): IndexRow
export function loadWeeks(reportsDir: string): WeekRecord[]
