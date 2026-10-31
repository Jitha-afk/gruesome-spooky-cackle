// Schema v1 week files -> the values the pages render.
// short_name and cve basis are optional. Unknown fields are ignored.
import fs from "node:fs"
import path from "node:path"

export class BuildError extends Error {
  constructor(message) {
    super(message)
    this.name = "BuildError"
  }
}

const WINDOW = /^(\d{4})-(\d{2})-(\d{2})_(\d{4})-(\d{2})-(\d{2})$/
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export function reportsRoot() {
  return path.join(process.cwd(), "reports")
}

function fail(message) {
  throw new BuildError(message)
}

function has(obj, key) {
  return obj != null && Object.prototype.hasOwnProperty.call(obj, key)
}

function need(obj, key, where) {
  if (!has(obj, key)) fail(`${where}.${key} is missing.`)
  return obj[key]
}

function needString(obj, key, where) {
  const value = need(obj, key, where)
  if (typeof value !== "string") fail(`${where}.${key} must be a string.`)
  return value
}

function needNumber(obj, key, where) {
  const value = need(obj, key, where)
  if (typeof value !== "number" || !Number.isFinite(value)) fail(`${where}.${key} must be a number.`)
  return value
}

function needArray(obj, key, where) {
  const value = need(obj, key, where)
  if (!Array.isArray(value)) fail(`${where}.${key} must be an array.`)
  return value
}

function needObject(obj, key, where) {
  const value = need(obj, key, where)
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    fail(`${where}.${key} must be an object.`)
  }
  return value
}

function optionalString(obj, key) {
  if (!has(obj, key) || obj[key] == null) return null
  if (typeof obj[key] !== "string") fail(`${key} must be a string when it is present.`)
  const text = obj[key].trim()
  return text ? text : null
}

function needFlag(obj, key, where) {
  if (!has(obj, key)) fail(`${where}.${key} is missing.`)
  const value = obj[key]
  if (value !== true && value !== false && value !== null) {
    fail(`${where}.${key} must be true, false or null.`)
  }
  return value
}

function parseDay(year, month, day, display) {
  const date = new Date(Date.UTC(year, month - 1, day))
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    fail(`${display} has a date that is not a real calendar day.`)
  }
  return date.getTime()
}

export function formatCount(value) {
  return Number(value).toLocaleString("en-US")
}

const COMPACT = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 })

/** Headline numbers: 99,999 stays exact, 100,000 and up become 100K, 1.2M. */
export function formatKpi(value) {
  return Math.abs(Number(value)) >= 100000 ? COMPACT.format(Number(value)) : formatCount(value)
}

const GRAPHEMES = typeof Intl.Segmenter === "function" ? new Intl.Segmenter("en", { granularity: "grapheme" }) : null

/** User-perceived characters, so a cut never splits an emoji or a combining mark. */
export function graphemes(text) {
  return GRAPHEMES ? [...GRAPHEMES.segment(String(text))].map((part) => part.segment) : Array.from(String(text))
}

/** Visible label. Uses short_name when it is present. Otherwise truncates. */
export function shortLabel(name, shortName) {
  if (typeof shortName === "string" && shortName.trim()) return shortName.trim()
  const chars = graphemes(name ?? "")
  if (chars.length <= 12) return chars.join("")
  return `${chars.slice(0, 11).join("").trimEnd()}…`
}

/**
 * The theme name without the label it starts with, so it can sit under the label.
 * "PHP2Shell: critical flaws" under "PHP2Shell" reads "Critical flaws". Empty when nothing is left.
 */
export function nameDetail(name, label) {
  const text = String(name ?? "").trim()
  const head = String(label ?? "").trim()
  if (!head || !text.toLowerCase().startsWith(head.toLowerCase())) return text
  if (/[\p{L}\p{N}]/u.test(text.charAt(head.length))) return text
  const rest = text.slice(head.length).replace(/^[\s:–—|·,-]+/, "").trim()
  return rest ? rest.charAt(0).toUpperCase() + rest.slice(1) : ""
}

export function exploitedTag(flag) {
  if (flag === true) return "EXPLOITED"
  if (flag === false) return "NOT EXPLOITED"
  return "NOT CONFIRMED"
}

export function cveViews(theme) {
  const details = new Map((theme.cve_details ?? []).map((entry) => [entry.id, entry]))
  const ids = theme.cves ?? []
  return ids.map((id) => {
    const detail = details.get(id)
    const flag = detail ? detail.exploited_in_wild : theme.exploited_in_wild
    const cvss = detail && typeof detail.cvss === "number" && Number.isFinite(detail.cvss) ? detail.cvss : null
    return {
      id,
      flag,
      tag: exploitedTag(flag),
      basis: detail ? optionalString(detail, "basis") : null,
      cvss,
      advisory: detail ? safeHref(detail.advisory_url) : null,
    }
  })
}

export function rankRows(data) {
  if (data.ranking.length === 0) {
    return themesByRank(data).map((theme) => ({
      key: theme.key,
      label: shortLabel(theme.name, optionalString(theme, "short_name")),
      title: theme.name,
      accounts: theme.distinct_accounts,
    }))
  }
  const themes = new Map(data.themes.map((theme) => [theme.key, theme]))
  return data.ranking.map((row) => {
    const theme = themes.get(row.key) ?? null
    const shortName = optionalString(row, "short_name") ?? (theme ? optionalString(theme, "short_name") : null)
    return {
      key: row.key,
      label: shortLabel(row.name, shortName),
      title: row.name,
      accounts: row.accounts,
    }
  })
}

/** One line for the top card. Uses why_line when the file has it. */
export function whyText(theme) {
  const line = optionalString(theme, "why_line")
  return { text: line ?? theme.why, clamp: line == null }
}

/** At most `limit` CVE rows, plus how many are left. */
export function previewCves(theme, limit = 3) {
  const rows = cveViews(theme)
  const shown = rows.slice(0, limit)
  return { shown, extra: rows.length - shown.length }
}

const sentence = (text) => (/[.!?…]["'”’)]?$/.test(text) ? text : `${text}.`)

/**
 * Hero lead. meta.bottom_line when present. Otherwise the CVE count and the top theme,
 * with its why_line, for example "2 of 9 cited CVEs exploited in the wild. PHP2Shell led with 214 accounts: …".
 */
export function heroLead(data) {
  const line = bottomLine(data)
  if (line) return line
  const top = themesByRank(data)[0]
  if (!top) return "No theme met the bar this week."
  const stats = headlineStats(data)
  const label = shortLabel(top.name, optionalString(top, "short_name"))
  const why = optionalString(top, "why_line")
  const led = `${label} led with ${formatCount(top.distinct_accounts)} accounts`
  const parts = []
  if (stats.cves > 0) {
    parts.push(`${formatCount(stats.exploited)} of ${formatCount(stats.cves)} cited ${stats.cves === 1 ? "CVE" : "CVEs"} exploited in the wild.`)
  }
  parts.push(why ? `${led}: ${sentence(why)}` : `${led}.`)
  return parts.join(" ")
}

export function commentModel(theme) {
  return (theme.comments?.clusters ?? []).map((cluster) => {
    const counts = cluster.sentiment_counts ?? {}
    const num = (key) => (typeof counts[key] === "number" ? counts[key] : 0)
    return {
      label: cluster.label,
      positive: num("positive"),
      neutral: num("neutral"),
      negative: num("negative"),
      unclassified: num("unclassified"),
      samples: (cluster.samples ?? []).map((sample) => ({
        text: sample.text,
        href: sample.parent_url,
        date: has(sample, "date_ist") ? sample.date_ist : "",
      })),
    }
  })
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

/** IST days of the window, oldest first. Seven for a normal week, at most 31. */
export function windowDays(data) {
  const start = String(data.meta.window.start).slice(0, 10)
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(start)
  if (!match) fail(`${start} is not a window start date.`)
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const endMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(data.meta.window.end))
  let count = 7
  if (endMatch) {
    const span = Math.round(
      (Date.UTC(Number(endMatch[1]), Number(endMatch[2]) - 1, Number(endMatch[3])) - Date.UTC(year, month - 1, day)) /
        86400000,
    )
    if (Number.isFinite(span) && span >= 0) count = Math.min(31, span + 1)
  }
  const days = []
  for (let offset = 0; offset < count; offset += 1) {
    const date = new Date(Date.UTC(year, month - 1, day + offset))
    const iso = date.toISOString().slice(0, 10)
    days.push({ iso, label: WEEKDAYS[date.getUTCDay()] })
  }
  return days
}

function sourcesByThemeDay(data) {
  const counts = new Map()
  for (const source of data.sources) {
    const iso = String(source.date_ist).slice(0, 10)
    const key = `${source.theme}|${iso}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return counts
}

export function heatmapModel(data) {
  const days = windowDays(data)
  const counts = sourcesByThemeDay(data)
  const themes = themesByRank(data).slice(0, 10)
  return {
    columns: days.map((day) => day.label),
    rows: themes.map((theme) => ({
      label: shortLabel(theme.name, optionalString(theme, "short_name")),
      values: days.map((day) => counts.get(`${theme.key}|${day.iso}`) ?? 0),
    })),
  }
}

/** True when the text starts with a real calendar day, YYYY-MM-DD. */
export function isRealDay(text) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(text ?? ""))
  if (!match) return false
  const [year, month, day] = match.slice(1).map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

function dayParts(text) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(text))
  if (!match) fail(`${text} is not a window date.`)
  return { year: Number(match[1]), month: MONTHS[Number(match[2]) - 1], day: Number(match[3]) }
}

/** "23–29 Oct 2026" from two texts that start with YYYY-MM-DD. */
export function rangeLabel(startText, endText) {
  const start = dayParts(startText)
  const end = dayParts(endText)
  if (start.year !== end.year) return `${start.day} ${start.month} ${start.year} – ${end.day} ${end.month} ${end.year}`
  if (start.month !== end.month) return `${start.day} ${start.month} – ${end.day} ${end.month} ${end.year}`
  return `${start.day}–${end.day} ${end.month} ${end.year}`
}

/** Short window label, for example "23–29 Oct 2026". */
export function windowLabel(data) {
  return rangeLabel(data.meta.window.start, data.meta.window.end)
}

const SPARK_GLYPHS = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"]

export function sparkGlyphs(series) {
  const max = Math.max(...series, 1)
  return series.map((value) => {
    const index = Math.round((value / max) * (SPARK_GLYPHS.length - 1))
    return SPARK_GLYPHS[index] ?? "▁"
  })
}

export function sparkSummary(series, days) {
  const first = days[0]?.label ?? ""
  const last = days[days.length - 1]?.label ?? ""
  return `Sources per day, ${first} to ${last}: ${series.join(", ")}.`
}

export function sparkSeries(theme, data) {
  const days = windowDays(data)
  const counts = sourcesByThemeDay(data)
  return days.map((day) => counts.get(`${theme.key}|${day.iso}`) ?? 0)
}

export function headlineStats(data) {
  const cves = cveTableRows(data)
  return {
    themes: data.themes.length,
    sources: data.sources.length,
    comments: data.meta.counts.comments_analysed_top_themes,
    exploited: cves.filter((row) => row.flag === true).length,
    cves: cves.length,
  }
}

export function cveTableRows(data) {
  const order = new Map([
    [true, 0],
    [null, 1],
    [false, 2],
  ])
  const rows = data.themes.flatMap((theme) =>
    cveViews(theme).map((cve) => ({
      id: cve.id,
      key: theme.key,
      theme: shortLabel(theme.name, optionalString(theme, "short_name")),
      tag: cve.tag,
      flag: cve.flag,
      basis: cve.basis ?? "",
      rank: theme.rank,
      cvss: cve.cvss,
      advisory: cve.advisory,
    })),
  )
  rows.sort(
    (a, b) =>
      (order.get(a.flag) ?? 9) - (order.get(b.flag) ?? 9) ||
      a.rank - b.rank ||
      a.id.localeCompare(b.id),
  )
  // A CVE in two themes is one CVE: keep the row that sorts first, so exploited wins, then the higher rank.
  const seen = new Set()
  return rows.filter((row) => !seen.has(row.id) && seen.add(row.id))
}

/** Sentiment of one theme. Uses comments.sentiment when the file has it. */
export function themeSentiment(theme) {
  const totals = { positive: 0, neutral: 0, negative: 0, unclassified: 0 }
  const sentiment = theme.comments?.sentiment
  if (sentiment && typeof sentiment === "object") {
    for (const key of Object.keys(totals)) {
      if (typeof sentiment[key] === "number") totals[key] += sentiment[key]
    }
    return totals
  }
  for (const cluster of theme.comments?.clusters ?? []) {
    const counts = cluster.sentiment_counts ?? {}
    for (const key of Object.keys(totals)) {
      if (typeof counts[key] === "number") totals[key] += counts[key]
    }
  }
  return totals
}

export function sentimentTotals(data) {
  const totals = { positive: 0, neutral: 0, negative: 0, unclassified: 0 }
  for (const theme of data.themes) {
    const one = themeSentiment(theme)
    for (const key of Object.keys(totals)) totals[key] += one[key]
  }
  return totals
}

/** One row per theme: rank bar, spark, CVE state, outlet mix and sentiment. */
export function themeRows(data) {
  const themes = themesByRank(data)
  const top = Math.max(1, ...themes.map((theme) => theme.distinct_accounts))
  const order = sourceFacets(data).platform.map((entry) => entry.key)
  const perPlatform = new Map()
  for (const source of data.sources) {
    const key = `${source.theme}|${String(source.platform).trim()}`
    perPlatform.set(key, (perPlatform.get(key) ?? 0) + 1)
  }
  return themes.map((theme) => {
    const cves = cveViews(theme)
    const sentiment = themeSentiment(theme)
    return {
      key: theme.key,
      rank: theme.rank,
      name: theme.name,
      label: shortLabel(theme.name, optionalString(theme, "short_name")),
      accounts: theme.distinct_accounts,
      share: theme.distinct_accounts / top,
      engagement: theme.x_engagement,
      views: theme.youtube_views,
      spark: sparkSeries(theme, data),
      cves: cves.length,
      exploited: cves.filter((row) => row.flag === true).length,
      unconfirmed: cves.filter((row) => row.flag === null).length,
      mix: {
        vendor: theme.vendors.length,
        media: theme.media.length,
        independent: theme.independent.length,
      },
      platforms: order.map((key) => ({ key, count: perPlatform.get(`${theme.key}|${key}`) ?? 0 })),
      sentiment,
      comments: sentiment.positive + sentiment.neutral + sentiment.negative + sentiment.unclassified,
    }
  })
}

const TYPE_ORDER = ["vendor", "media", "independent"]
const PLATFORM_ORDER = ["X", "YouTube"]
/** What one source is called and what its engagement counts, per platform. Add a row to pin a new platform. */
const PLATFORM_UNITS = {
  X: { noun: "posts", metric: "interactions" },
  YouTube: { noun: "videos", metric: "views" },
}

export function platformUnits(platform) {
  const key = String(platform ?? "").trim()
  return Object.prototype.hasOwnProperty.call(PLATFORM_UNITS, key)
    ? PLATFORM_UNITS[key]
    : { noun: "sources", metric: "engagement" }
}

function facet(sources, field, order) {
  const counts = new Map()
  for (const source of sources) {
    const value = String(source[field] ?? "").trim()
    if (!value) continue
    counts.set(value, (counts.get(value) ?? 0) + 1)
  }
  const place = (key) => {
    const at = order.indexOf(key)
    return at === -1 ? order.length : at
  }
  return [...counts.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => place(a.key) - place(b.key) || b.count - a.count || a.key.localeCompare(b.key))
}

/** Source types and platforms in the week. Known values first, then new values by count. */
export function sourceFacets(data) {
  return {
    type: facet(data.sources, "type", TYPE_ORDER),
    platform: facet(data.sources, "platform", PLATFORM_ORDER),
  }
}

/** The href when it is http or https. Anything else renders as text. */
export function safeHref(url) {
  if (typeof url !== "string") return null
  const text = url.trim()
  return /^https?:\/\/[^\s]+$/i.test(text) ? text : null
}

function stringList(value) {
  if (!Array.isArray(value)) return []
  return value.filter((item) => typeof item === "string" && item.trim()).map((item) => item.trim())
}

/** Optional editor's lead for the hero. */
export function bottomLine(data) {
  return optionalString(data.meta, "bottom_line")
}

/** Optional items seen in the window that did not make a theme. */
export function alsoObserved(data) {
  return stringList(data.meta.also_observed)
}

/** Optional method as steps. Empty when the file has only the methodology paragraph. */
export function methodSteps(data) {
  if (!Array.isArray(data.meta.method_steps)) return []
  return data.meta.method_steps
    .filter((step) => step && typeof step.title === "string" && step.title.trim())
    .map((step) => ({ title: step.title.trim(), detail: optionalString(step, "detail") }))
}

/** Optional actions for defenders on one theme. */
export function themeActions(theme) {
  return stringList(theme.actions)
}

function stageCount(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null
}

function funnel(stages) {
  const kept = stages.filter((stage) => stage.count != null)
  if (kept.length < 2) return []
  return kept.map((stage, index) => ({ ...stage, drop: index === 0 ? 0 : kept[index - 1].count - stage.count }))
}

/**
 * What the week kept, from the optional meta.counts numbers. A funnel with fewer than two known stages is
 * empty, so the page leaves it out. `drop` is how many fell out since the stage above.
 */
export function funnelModel(data) {
  const counts = data.meta.counts
  const raw = counts.comment_exclusions
  const exclusions = raw !== null && typeof raw === "object" && !Array.isArray(raw) ? raw : {}
  return {
    sources: funnel([
      { label: "candidates", count: stageCount(counts.candidates) },
      { label: "in themes", count: data.sources.length },
    ]),
    comments: funnel([
      { label: "retrieved", count: stageCount(counts.comments_retrieved ?? exclusions.retrieved) },
      { label: "in the window", count: stageCount(exclusions.in_window) },
      { label: "analysed", count: stageCount(counts.comments_analysed_all) },
      { label: "on top themes", count: stageCount(counts.comments_analysed_top_themes) },
    ]),
    removed: [
      { label: "spam, bots and abuse", count: stageCount(exclusions.excluded_spam_bot_abuse) },
      { label: "reposts", count: stageCount(exclusions.excluded_retweet) },
      { label: "no text", count: stageCount(exclusions.excluded_no_text) },
      { label: "duplicates", count: stageCount(exclusions.duplicates) },
    ].filter((row) => row.count),
  }
}

/** The data week before `name`, or null. Weeks come from loadWeeks (newest first). */
export function previousDataWeek(weeks, name) {
  const at = weeks.findIndex((week) => week.name === name)
  if (at === -1) return null
  return weeks.slice(at + 1).find((week) => week.kind === "data" && week.data) ?? null
}

/** Change against the previous data week. Null when there is no previous week. */
export function weekDelta(current, previous) {
  if (!previous) return null
  const before = new Map(previous.themes.map((theme) => [theme.key, theme]))
  const keys = new Set(current.themes.map((theme) => theme.key))
  const now = headlineStats(current)
  const then = headlineStats(previous)
  const themes = {}
  for (const theme of current.themes) {
    const old = before.get(theme.key)
    themes[theme.key] = old
      ? { isNew: false, rank: old.rank - theme.rank, accounts: theme.distinct_accounts - old.distinct_accounts }
      : { isNew: true, rank: 0, accounts: theme.distinct_accounts }
  }
  return {
    label: windowLabel(previous),
    totals: {
      themes: now.themes - then.themes,
      sources: now.sources - then.sources,
      comments: now.comments - then.comments,
      cves: now.cves - then.cves,
      exploited: now.exploited - then.exploited,
    },
    themes,
    dropped: themesByRank(previous)
      .filter((theme) => !keys.has(theme.key))
      .map((theme) => ({ key: theme.key, label: shortLabel(theme.name, optionalString(theme, "short_name")) })),
  }
}

/** Share of a 100-cell waffle. Order is positive, neutral, negative, unclassified. */
export function waffleParts(totals, cells = 100) {
  const keys = ["positive", "neutral", "negative", "unclassified"]
  const total = keys.reduce((sum, key) => sum + totals[key], 0) || 1
  const parts = keys.map((key) => ({
    key,
    count: totals[key],
    cells: Math.floor((totals[key] / total) * cells),
    remainder: ((totals[key] / total) * cells) % 1,
  }))
  let left = cells - parts.reduce((sum, part) => sum + part.cells, 0)
  const byRemainder = [...parts].sort((a, b) => b.remainder - a.remainder)
  for (const part of byRemainder) {
    if (left <= 0) break
    part.cells += 1
    left -= 1
  }
  return parts.map(({ key, count, cells: share }) => ({ key, count, cells: share }))
}

export function sourceRows(data) {
  return [...data.sources].sort(
    (a, b) => b.engagement - a.engagement || String(a.id).localeCompare(String(b.id)),
  )
}

export function themesByRank(data) {
  return [...data.themes].sort((a, b) => a.rank - b.rank || String(a.key).localeCompare(String(b.key)))
}

/**
 * The week with its themes numbered 1 to n in rank order, ties by key. A gap or a repeat in the file
 * would otherwise print as a missing or doubled number. The checker warns about both.
 */
export function withPositionalRanks(data) {
  const position = new Map(themesByRank(data).map((theme, index) => [theme, index + 1]))
  if (data.themes.every((theme) => theme.rank === position.get(theme))) return data
  return { ...data, themes: data.themes.map((theme) => ({ ...theme, rank: position.get(theme) })) }
}

function validateCve(entry, where) {
  if (entry == null || typeof entry !== "object" || Array.isArray(entry)) {
    fail(`${where} must be an object.`)
  }
  needString(entry, "id", where)
  needFlag(entry, "exploited_in_wild", where)
  if (has(entry, "basis") && entry.basis != null && typeof entry.basis !== "string") {
    fail(`${where}.basis must be a string when it is present.`)
  }
  if (has(entry, "cvss") && entry.cvss != null) {
    if (typeof entry.cvss !== "number" || !Number.isFinite(entry.cvss) || entry.cvss < 0 || entry.cvss > 10) {
      fail(`${where}.cvss must be a number from 0 to 10 when it is present.`)
    }
  }
  optionalUrl(entry, "advisory_url", where)
}

function optionalUrl(obj, key, where) {
  if (!has(obj, key) || obj[key] == null) return
  if (typeof obj[key] !== "string" || !safeHref(obj[key])) {
    fail(`${where}.${key} must be an http or https URL when it is present.`)
  }
}

function optionalStrings(obj, key, where) {
  if (!has(obj, key) || obj[key] == null) return
  if (!Array.isArray(obj[key])) fail(`${where}.${key} must be an array when it is present.`)
  obj[key].forEach((item, index) => {
    if (typeof item !== "string") fail(`${where}.${key}[${index}] must be a string.`)
  })
}

function validateSample(sample, where) {
  if (sample == null || typeof sample !== "object") fail(`${where} must be an object.`)
  needString(sample, "text", where)
  needString(sample, "parent_url", where)
  if (has(sample, "date_ist") && sample.date_ist != null && typeof sample.date_ist !== "string") {
    fail(`${where}.date_ist must be a string when it is present.`)
  }
}

function validateCluster(cluster, where) {
  if (cluster == null || typeof cluster !== "object") fail(`${where} must be an object.`)
  needString(cluster, "label", where)
  const counts = needObject(cluster, "sentiment_counts", where)
  for (const [key, value] of Object.entries(counts)) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      fail(`${where}.sentiment_counts.${key} must be a number.`)
    }
  }
  const samples = needArray(cluster, "samples", where)
  samples.forEach((sample, index) => validateSample(sample, `${where}.samples[${index}]`))
}

function validateTheme(theme, index, sourceIds) {
  const where = `themes[${index}]`
  if (theme == null || typeof theme !== "object") fail(`${where} must be an object.`)
  needNumber(theme, "rank", where)
  needString(theme, "key", where)
  needString(theme, "name", where)
  if (!theme.key.trim()) fail(`${where}.key is empty.`)
  if (!theme.name.trim()) fail(`${where}.name is empty.`)
  if (has(theme, "short_name") && theme.short_name != null && typeof theme.short_name !== "string") {
    fail(`${where}.short_name must be a string when it is present.`)
  }
  needString(theme, "summary", where)
  needString(theme, "why", where)
  if (has(theme, "why_line") && theme.why_line != null && typeof theme.why_line !== "string") {
    fail(`${where}.why_line must be a string when it is present.`)
  }
  const affected = needObject(theme, "affected", where)
  needString(affected, "products", `${where}.affected`)
  needString(affected, "sectors", `${where}.affected`)
  needString(affected, "regions", `${where}.affected`)
  for (const key of ["vendors", "media", "independent"]) {
    const list = needArray(theme, key, where)
    list.forEach((item, itemIndex) => {
      if (typeof item !== "string") fail(`${where}.${key}[${itemIndex}] must be a string.`)
    })
  }
  needNumber(theme, "distinct_accounts", where)
  needNumber(theme, "x_engagement", where)
  needNumber(theme, "youtube_views", where)
  const keyItems = needArray(theme, "key_items", where)
  keyItems.forEach((id, itemIndex) => {
    if (typeof id !== "string") fail(`${where}.key_items[${itemIndex}] must be a string.`)
    if (!sourceIds.has(id)) fail(`${where}.key_items ${id} is not in sources.`)
  })
  const comments = needObject(theme, "comments", where)
  const clusters = needArray(comments, "clusters", `${where}.comments`)
  clusters.forEach((cluster, clusterIndex) => {
    validateCluster(cluster, `${where}.comments.clusters[${clusterIndex}]`)
  })
  const cves = needArray(theme, "cves", where)
  cves.forEach((id, cveIndex) => {
    if (typeof id !== "string" || !id.trim()) fail(`${where}.cves[${cveIndex}] must be a string.`)
  })
  needFlag(theme, "exploited_in_wild", where)
  const details = needArray(theme, "cve_details", where)
  details.forEach((entry, detailIndex) => validateCve(entry, `${where}.cve_details[${detailIndex}]`))
  optionalStrings(theme, "actions", where)
}

function validateSource(source, index) {
  const where = `sources[${index}]`
  if (source == null || typeof source !== "object") fail(`${where} must be an object.`)
  needString(source, "id", where)
  needString(source, "platform", where)
  needString(source, "type", where)
  needString(source, "account", where)
  needString(source, "date_ist", where)
  needString(source, "text", where)
  needString(source, "url", where)
  needNumber(source, "engagement", where)
  needString(source, "theme", where)
  needObject(source, "metrics", where)
  if (has(source, "image") && source.image != null && typeof source.image !== "string") {
    fail(`${where}.image must be a string when it is present.`)
  }
}

export function validateData(data, file = "data.json") {
  if (data == null || typeof data !== "object" || Array.isArray(data)) {
    fail(`${file} must be an object.`)
  }
  if (!has(data, "schema_version")) fail(`${file}: schema_version is missing.`)
  if (data.schema_version !== 1) {
    fail(`${file}: unknown schema_version ${JSON.stringify(data.schema_version)}.`)
  }
  const meta = needObject(data, "meta", "data")
  needString(meta, "title", "meta")
  if (!meta.title.trim()) fail("meta.title is empty.")
  const window = needObject(meta, "window", "meta")
  for (const key of ["start", "end"]) {
    needString(window, key, "meta.window")
    if (!isRealDay(window[key])) {
      fail(`meta.window.${key} is ${JSON.stringify(window[key])}. It must start with a real calendar day as YYYY-MM-DD, like "2026-10-23 00:00 IST".`)
    }
  }
  const capture = needObject(meta, "capture", "meta")
  needString(capture, "x", "meta.capture")
  needString(capture, "youtube", "meta.capture")
  const counts = needObject(meta, "counts", "meta")
  needNumber(counts, "x_posts", "meta.counts")
  needNumber(counts, "youtube_videos", "meta.counts")
  needNumber(counts, "comments_analysed_top_themes", "meta.counts")
  needString(meta, "methodology", "meta")
  const inaccessible = needArray(meta, "inaccessible", "meta")
  inaccessible.forEach((item, index) => {
    if (typeof item !== "string") fail(`meta.inaccessible[${index}] must be a string.`)
  })
  if (has(meta, "generated") && meta.generated != null && typeof meta.generated !== "string") {
    fail("meta.generated must be a string when it is present.")
  }
  if (has(meta, "bottom_line") && meta.bottom_line != null && typeof meta.bottom_line !== "string") {
    fail("meta.bottom_line must be a string when it is present.")
  }
  optionalStrings(meta, "also_observed", "meta")
  if (has(meta, "method_steps") && meta.method_steps != null) {
    if (!Array.isArray(meta.method_steps)) fail("meta.method_steps must be an array when it is present.")
    meta.method_steps.forEach((step, index) => {
      const at = `meta.method_steps[${index}]`
      if (step == null || typeof step !== "object" || Array.isArray(step)) fail(`${at} must be an object.`)
      needString(step, "title", at)
      if (has(step, "detail") && step.detail != null && typeof step.detail !== "string") {
        fail(`${at}.detail must be a string when it is present.`)
      }
    })
  }
  const sources = needArray(data, "sources", "data")
  sources.forEach((source, index) => validateSource(source, index))
  const sourceIds = new Set(sources.map((source) => source.id))
  const themes = needArray(data, "themes", "data")
  if (themes.length === 0) fail("themes must include a theme.")
  themes.forEach((theme, index) => validateTheme(theme, index, sourceIds))
  const ranking = needArray(data, "ranking", "data")
  ranking.forEach((row, index) => {
    const where = `ranking[${index}]`
    if (row == null || typeof row !== "object") fail(`${where} must be an object.`)
    needString(row, "key", where)
    needString(row, "name", where)
    needNumber(row, "accounts", where)
    if (has(row, "short_name") && row.short_name != null && typeof row.short_name !== "string") {
      fail(`${where}.short_name must be a string when it is present.`)
    }
  })
  return data
}

function formatDay(ms, withYear) {
  const date = new Date(ms)
  const text = `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`
  return withYear ? `${text} ${date.getUTCFullYear()}` : text
}

export function legacyWindow(week) {
  const startYear = new Date(week.start).getUTCFullYear()
  const endYear = new Date(week.end).getUTCFullYear()
  return `${formatDay(week.start, startYear !== endYear)} to ${formatDay(week.end, true)}`
}

export function indexRow(week) {
  const href = `/reports/${week.name}/`
  if (week.kind === "legacy") {
    const iso = (ms) => new Date(ms).toISOString().slice(0, 10)
    return {
      href,
      window: legacyWindow(week),
      label: rangeLabel(iso(week.start), iso(week.end)),
      published: null,
      shortName: null,
      title: null,
      themeCount: null,
    }
  }
  const themes = themesByRank(week.data)
  const top = themes[0]
  const generated = optionalString(week.data.meta, "generated")
  const stamp = generated ? /^\d{4}-\d{2}-\d{2}/.exec(generated) : null
  let published = null
  if (stamp && isRealDay(stamp[0])) {
    const day = dayParts(stamp[0])
    published = `${day.day} ${day.month}`
  }
  return {
    href,
    window: `${week.data.meta.window.start} to ${week.data.meta.window.end}`,
    label: windowLabel(week.data),
    published,
    shortName: top ? shortLabel(top.name, optionalString(top, "short_name")) : null,
    title: top ? top.name : null,
    themeCount: themes.length,
  }
}

export function loadWeeks(reportsDir) {
  if (!fs.existsSync(reportsDir) || !fs.statSync(reportsDir).isDirectory()) {
    fail(`${reportsDir} is not a directory.`)
  }
  const weeks = []
  for (const name of fs.readdirSync(reportsDir).sort()) {
    if (name.startsWith(".")) continue
    const child = path.join(reportsDir, name)
    const stat = fs.statSync(child)
    if (!stat.isDirectory()) {
      fail(`${child} is not a week directory. Expected a directory named YYYY-MM-DD_YYYY-MM-DD.`)
    }
    const match = WINDOW.exec(name)
    if (!match) {
      fail(`${child} is not a week window. Expected YYYY-MM-DD_YYYY-MM-DD.`)
    }
    const start = parseDay(Number(match[1]), Number(match[2]), Number(match[3]), child)
    const end = parseDay(Number(match[4]), Number(match[5]), Number(match[6]), child)
    if (end < start) fail(`${child} ends before it starts.`)
    const dataPath = path.join(child, "data.json")
    const indexPath = path.join(child, "index.html")
    const hasData = fs.existsSync(dataPath) && fs.statSync(dataPath).isFile()
    const hasIndex = fs.existsSync(indexPath) && fs.statSync(indexPath).isFile()
    if (!hasData && fs.existsSync(dataPath)) fail(`${dataPath} is a directory. Write the week as a file.`)
    if (!hasData && !hasIndex) fail(`${child} has no data.json or index.html.`)
    let data = null
    if (hasData) {
      let parsed
      try {
        parsed = JSON.parse(fs.readFileSync(dataPath, "utf8").replace(/^\uFEFF/, ""))
      } catch (error) {
        const hint = /\b(NaN|Infinity|undefined)\b/.test(error.message) ? " JSON has no NaN, Infinity or undefined: write 0 or null." : ""
        fail(`${dataPath} is not valid JSON. ${error.message.replace(/\.?$/, ".")}${hint}`)
      }
      try {
        validateData(parsed, dataPath)
      } catch (error) {
        if (!(error instanceof BuildError) || error.message.includes(dataPath)) throw error
        fail(`${dataPath}: ${error.message}`)
      }
      data = withPositionalRanks(parsed)
    }
    weeks.push({
      name,
      start,
      end,
      kind: hasData ? "data" : "legacy",
      data,
      indexPath: hasIndex ? indexPath : null,
    })
  }
  weeks.sort((a, b) => b.end - a.end || b.start - a.start)
  return weeks
}
