// Week files -> the values the pages render.
// v1 is data.json. v2 is brief.md plus sources.json.
// short_name and cve basis are optional. Unknown fields are ignored.
import fs from "node:fs"
import path from "node:path"
import { parseStrictYaml } from "./yaml-strict.mjs"

export const basePath = "/gruesome-spooky-cackle"

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

/** Visible label. Uses short_name when it is present. Otherwise truncates. */
export function shortLabel(name, shortName) {
  if (typeof shortName === "string" && shortName.trim()) return shortName.trim()
  const text = String(name ?? "")
  if (text.length <= 12) return text
  return `${text.slice(0, 11).trimEnd()}…`
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
    return {
      id,
      flag,
      tag: exploitedTag(flag),
      basis: detail ? optionalString(detail, "basis") : null,
    }
  })
}

export function rankRows(data) {
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

export function weekSummary(theme) {
  const label = shortLabel(theme.name, optionalString(theme, "short_name"))
  return `${label} led this week with ${formatCount(theme.distinct_accounts)} accounts, ${formatCount(theme.x_engagement)} interactions and ${formatCount(theme.youtube_views)} views.`
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

export function splitCounts(sources) {
  const type = { vendor: 0, media: 0, independent: 0 }
  const platform = { X: 0, YouTube: 0 }
  for (const source of sources) {
    if (Object.prototype.hasOwnProperty.call(type, source.type)) type[source.type] += 1
    if (Object.prototype.hasOwnProperty.call(platform, source.platform)) platform[source.platform] += 1
  }
  return { type, platform }
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

/** Seven IST days of the window, oldest first. */
export function windowDays(data) {
  const start = String(data.meta.window.start).slice(0, 10)
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(start)
  if (!match) fail(`${start} is not a window start date.`)
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const days = []
  for (let offset = 0; offset < 7; offset += 1) {
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

export function coverageModels(data) {
  const themes = themesByRank(data)
  const perTheme = themes.map((theme) => {
    const label = shortLabel(theme.name, optionalString(theme, "short_name"))
    const sources = data.sources.filter((source) => source.theme === theme.key)
    return {
      label,
      vendor: theme.vendors.length,
      media: theme.media.length,
      independent: theme.independent.length,
      x: sources.filter((source) => source.platform === "X").length,
      youtube: sources.filter((source) => source.platform === "YouTube").length,
    }
  })
  return {
    accounts: perTheme.map((row) => ({
      label: `${row.label} ${row.vendor} ${row.media} ${row.independent}`,
      segments: [
        { label: "vendor", value: row.vendor },
        { label: "media", value: row.media },
        { label: "independent", value: row.independent },
      ],
    })),
    platforms: perTheme.map((row) => ({
      label: `${row.label} ${row.x} ${row.youtube}`,
      segments: [
        { label: "X", value: row.x },
        { label: "YouTube", value: row.youtube },
      ],
    })),
  }
}

export function headlineStats(data) {
  const cves = data.themes.flatMap((theme) => cveViews(theme))
  return {
    themes: data.themes.length,
    sources: data.meta.counts.x_posts + data.meta.counts.youtube_videos,
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
      theme: shortLabel(theme.name, optionalString(theme, "short_name")),
      tag: cve.tag,
      flag: cve.flag,
      basis: cve.basis ?? "",
      rank: theme.rank,
    })),
  )
  rows.sort(
    (a, b) =>
      (order.get(a.flag) ?? 9) - (order.get(b.flag) ?? 9) ||
      a.rank - b.rank ||
      a.id.localeCompare(b.id),
  )
  return rows
}

export function sentimentTotals(data) {
  const totals = { positive: 0, neutral: 0, negative: 0, unclassified: 0 }
  for (const theme of data.themes) {
    const sentiment = theme.comments?.sentiment
    if (sentiment && typeof sentiment === "object") {
      for (const key of Object.keys(totals)) {
        if (typeof sentiment[key] === "number") totals[key] += sentiment[key]
      }
      continue
    }
    for (const cluster of theme.comments?.clusters ?? []) {
      const counts = cluster.sentiment_counts ?? {}
      for (const key of Object.keys(totals)) {
        if (typeof counts[key] === "number") totals[key] += counts[key]
      }
    }
  }
  return totals
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

function validateCve(entry, where) {
  if (entry == null || typeof entry !== "object" || Array.isArray(entry)) {
    fail(`${where} must be an object.`)
  }
  needString(entry, "id", where)
  needFlag(entry, "exploited_in_wild", where)
  if (has(entry, "basis") && entry.basis != null && typeof entry.basis !== "string") {
    fail(`${where}.basis must be a string when it is present.`)
  }
}

function validateSample(sample, where) {
  if (sample == null || typeof sample !== "object") fail(`${where} must be an object.`)
  needString(sample, "text", where)
  needString(sample, "parent_url", where)
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

export function validateData(data, file = "data.json", version = 1) {
  if (data == null || typeof data !== "object" || Array.isArray(data)) {
    fail(`${file} must be an object.`)
  }
  if (!has(data, "schema_version")) fail(`${file}: schema_version is missing.`)
  if (data.schema_version !== version) {
    fail(`${file}: unknown schema_version ${JSON.stringify(data.schema_version)}.`)
  }
  const meta = needObject(data, "meta", "data")
  needString(meta, "title", "meta")
  if (!meta.title.trim()) fail("meta.title is empty.")
  const window = needObject(meta, "window", "meta")
  needString(window, "start", "meta.window")
  needString(window, "end", "meta.window")
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
    return { href, window: legacyWindow(week), shortName: null, title: null, themeCount: null }
  }
  const themes = themesByRank(week.data)
  const top = themes[0]
  return {
    href,
    window: `${week.data.meta.window.start} to ${week.data.meta.window.end}`,
    shortName: shortLabel(top.name, optionalString(top, "short_name")),
    title: top.name,
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
    const briefPath = path.join(child, "brief.md")
    const dataPath = path.join(child, "data.json")
    const indexPath = path.join(child, "index.html")
    const hasBrief = fs.existsSync(briefPath) && fs.statSync(briefPath).isFile()
    const hasData = fs.existsSync(dataPath) && fs.statSync(dataPath).isFile()
    const hasIndex = fs.existsSync(indexPath) && fs.statSync(indexPath).isFile()
    if (!hasBrief && !hasData && !hasIndex) fail(`${child} has no brief.md, data.json, or index.html.`)
    let data = null
    let body = ""
    let sections = {}
    let kind = "legacy"
    if (hasBrief) {
      const loaded = loadBrief(briefPath)
      data = loaded.data
      body = loaded.body
      sections = loaded.sections
      kind = "brief"
    } else if (hasData) {
      let parsed
      try {
        parsed = JSON.parse(fs.readFileSync(dataPath, "utf8"))
      } catch (error) {
        fail(`${dataPath} is not valid JSON. ${error.message}`)
      }
      validateData(parsed, dataPath)
      data = parsed
      kind = "data"
    }
    weeks.push({
      name,
      start,
      end,
      kind,
      data,
      body,
      sections,
      indexPath: hasIndex ? indexPath : null,
    })
  }
  weeks.sort((a, b) => b.end - a.end || b.start - a.start)
  return weeks
}

/** Split a v1 object into a v2 frontmatter object and a sources sidecar. */
export function splitWeekData(data) {
  const front = structuredClone(data)
  front.schema_version = 2
  const sources = front.sources
  delete front.sources
  const samples = {}
  for (const theme of front.themes ?? []) {
    const clusters = theme?.comments?.clusters ?? []
    samples[theme.key] = clusters.map((cluster) => {
      const list = cluster.samples ?? []
      delete cluster.samples
      return list
    })
  }
  return { front, sidecar: { sources, samples } }
}

export function splitFrontmatter(text, file = "brief.md") {
  const normalized = String(text).replace(/^\uFEFF/, "")
  if (!normalized.startsWith("---\n") && !normalized.startsWith("---\r\n")) {
    fail(`${file} must start with a YAML frontmatter fence.`)
  }
  const newline = normalized.startsWith("---\r\n") ? "\r\n" : "\n"
  const lines = normalized.split(/\r?\n/)
  let end = -1
  for (let index = 1; index < lines.length; index += 1) {
    if (lines[index] === "---") {
      end = index
      break
    }
  }
  if (end < 0) fail(`${file} frontmatter is missing a closing fence.`)
  return {
    yamlText: lines.slice(1, end).join(newline),
    body: lines.slice(end + 1).join(newline),
  }
}

/**
 * Body headings are exactly `## <theme key>`. A key may appear once.
 * A missing key is allowed. Text before the first heading is not.
 */
export function bodySections(body, themeKeys, file = "brief.md") {
  const sections = {}
  let current = null
  const preamble = []
  const lines = String(body ?? "").split(/\r?\n/)
  for (const line of lines) {
    if (line.startsWith("##")) {
      const match = /^## (\S+)$/.exec(line)
      if (!match) fail(`${file} body heading must be exactly "## <theme key>": ${line}`)
      const key = match[1]
      if (!themeKeys.has(key)) fail(`${file} body heading "${key}" is not a theme key.`)
      if (Object.prototype.hasOwnProperty.call(sections, key)) {
        fail(`${file} body heading "${key}" appears more than once.`)
      }
      current = key
      sections[key] = []
      continue
    }
    if (current == null) preamble.push(line)
    else sections[current].push(line)
  }
  if (preamble.join("\n").trim()) {
    fail(`${file} body has text before a theme heading.`)
  }
  const trimmed = {}
  for (const [key, chunk] of Object.entries(sections)) {
    trimmed[key] = chunk.join("\n").trim()
  }
  return trimmed
}

export function joinBrief(front, sidecar, file = "brief.md") {
  if (front == null || typeof front !== "object" || Array.isArray(front)) {
    fail(`${file} frontmatter must be an object.`)
  }
  if (has(front, "sources")) fail(`${file} must not include sources. Put them in sources.json.`)
  if (sidecar == null || typeof sidecar !== "object" || Array.isArray(sidecar)) {
    fail(`${file} sources.json must be an object.`)
  }
  const sources = sidecar.sources
  if (!Array.isArray(sources)) fail(`${file} sources.json sources must be an array.`)
  const samples = sidecar.samples
  if (samples == null || typeof samples !== "object" || Array.isArray(samples)) {
    fail(`${file} sources.json samples must be an object keyed by theme key.`)
  }
  const themes = front.themes
  if (!Array.isArray(themes)) fail(`${file} themes must be an array.`)
  const themeKeys = new Set()
  for (const theme of themes) {
    if (theme == null || typeof theme !== "object") continue
    if (typeof theme.key === "string") themeKeys.add(theme.key)
    for (const cluster of theme.comments?.clusters ?? []) {
      if (cluster && Array.isArray(cluster.samples) && cluster.samples.length > 0) {
        fail(`${file} theme ${theme.key} keeps comment samples in the frontmatter. Put them in sources.json.`)
      }
    }
  }
  for (const key of Object.keys(samples)) {
    if (!themeKeys.has(key)) fail(`${file} sources.json samples key "${key}" is not a theme key.`)
  }
  const joinedThemes = themes.map((theme, index) => {
    if (theme == null || typeof theme !== "object") return theme
    const clusters = theme.comments?.clusters
    const group = samples[theme.key]
    if (!Array.isArray(clusters)) return theme
    if (!Array.isArray(group)) {
      fail(`${file} sources.json samples.${theme.key ?? index} is missing.`)
    }
    if (group.length !== clusters.length) {
      fail(
        `${file} sources.json samples.${theme.key} has ${group.length} cluster lists, want ${clusters.length}.`,
      )
    }
    return {
      ...theme,
      comments: {
        ...theme.comments,
        clusters: clusters.map((cluster, clusterIndex) => {
          const list = group[clusterIndex]
          if (!Array.isArray(list)) {
            fail(`${file} sources.json samples.${theme.key}[${clusterIndex}] must be an array.`)
          }
          return { ...cluster, samples: list }
        }),
      },
    }
  })
  return { ...front, sources, themes: joinedThemes }
}

export function loadBrief(briefPath) {
  const text = fs.readFileSync(briefPath, "utf8")
  const { yamlText, body } = splitFrontmatter(text, briefPath)
  let front
  try {
    front = parseStrictYaml(yamlText)
  } catch (error) {
    fail(`${briefPath} frontmatter is not strict YAML. ${error.message}`)
  }
  const sourcesPath = path.join(path.dirname(briefPath), "sources.json")
  if (!fs.existsSync(sourcesPath)) fail(`${briefPath} has no sibling sources.json.`)
  let sidecar
  try {
    sidecar = JSON.parse(fs.readFileSync(sourcesPath, "utf8"))
  } catch (error) {
    fail(`${sourcesPath} is not valid JSON. ${error.message}`)
  }
  const data = joinBrief(front, sidecar, briefPath)
  validateData(data, briefPath, 2)
  const keys = new Set((data.themes ?? []).map((theme) => theme.key))
  const sections = bodySections(body, keys, briefPath)
  return { data, body, sections }
}
