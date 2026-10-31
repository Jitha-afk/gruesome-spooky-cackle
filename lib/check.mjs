// Preflight for one week file: the build's schema check, then layout and consistency rules.
// Errors stop a publish. Warnings still render, but not the way the page is designed to look.
// The rules and limits are documented in data-ingestion/FIELDS.md.
import { BuildError, funnelModel, isRealDay, safeHref, validateData } from "./brief.mjs"
import { schemaErrors } from "./schema.mjs"

export const WEEK_FOLDER = /^(\d{4}-\d{2}-\d{2})_(\d{4}-\d{2}-\d{2})$/

/** Character counts that fit the layout. Longer text still renders: labels truncate, paragraphs clamp. */
export const LIMITS = {
  title: 60,
  bottom_line: 240,
  short_name: 12,
  name: 110,
  why_line: 140,
  why: 600,
  summary: 1200,
  actions: 5,
  action: 160,
  cluster_label: 90,
  sample: 400,
  account: 48,
  also_observed: 300,
  step_title: 60,
  step_detail: 300,
  themes: 12,
}

export const KNOWN_PLATFORMS = ["X", "YouTube"]
export const KNOWN_TYPES = ["vendor", "media", "independent"]

const KEY = /^[A-Za-z0-9][A-Za-z0-9_-]*$/
const CVE_ID = /^CVE-\d{4}-\d{4,}$/
const WINDOW_TEXT = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2} IST$/
const DAY = /^\d{4}-\d{2}-\d{2}/
const DATE_IST = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/

/** Days since 1970 for a text that starts with a real YYYY-MM-DD day, or null. */
function dayNumber(text) {
  if (!isRealDay(text)) return null
  const [year, month, day] = DAY.exec(String(text))[0].split("-").map(Number)
  return Date.UTC(year, month - 1, day) / 86400000
}

function length(value) {
  return typeof value === "string" ? [...value.trim()].length : 0
}

/**
 * Findings for one parsed week file. `folder` is the week directory name, when known.
 * Each finding is { level: "error" | "warn", path, message }.
 */
export function checkWeek(data, folder = null) {
  const findings = []
  const error = (path, message) => findings.push({ level: "error", path, message })
  const warn = (path, message) => findings.push({ level: "warn", path, message })
  const tooLong = (path, value, limit, effect) => {
    const size = length(value)
    if (size > limit) warn(path, `is ${size} characters. Keep it to ${limit} or fewer. ${effect}`)
  }

  try {
    validateData(data, folder ? `${folder}/data.json` : "data.json")
  } catch (failure) {
    if (failure instanceof BuildError) {
      error("", failure.message)
      return findings
    }
    throw failure
  }

  const { meta, themes, ranking, sources } = data
  const notNegative = (path, value) => {
    if (typeof value === "number" && value < 0) warn(path, `is ${value}. Counts start at 0, so charts treat it as 0.`)
  }

  // Fields the site ignores when they are wrong: record-only fields, funnel counts and proposed fields.
  for (const item of schemaErrors(data)) {
    if (item.soft) warn(item.path, `${item.message} The site does not use this value.`)
  }

  // Window and folder.
  for (const end of ["start", "end"]) {
    const value = meta.window[end]
    if (!DAY.test(value)) error(`meta.window.${end}`, `"${value}" must start with YYYY-MM-DD. The build fails without it.`)
    else if (!isRealDay(value)) error(`meta.window.${end}`, `"${value.slice(0, 10)}" is not a real calendar day.`)
    else if (!WINDOW_TEXT.test(value)) warn(`meta.window.${end}`, `"${value}" should look like "2026-10-23 00:00 IST".`)
  }
  const first = dayNumber(meta.window.start)
  const last = dayNumber(meta.window.end)
  if (first != null && last != null) {
    if (last < first) error("meta.window", "ends before it starts.")
    else if (last - first + 1 !== 7) {
      warn("meta.window", `covers ${last - first + 1} IST days. The page is designed for 7, one column per day.`)
    }
  }
  if (folder != null) {
    const match = WEEK_FOLDER.exec(folder)
    if (!match) {
      error("folder", `${folder} must be named YYYY-MM-DD_YYYY-MM-DD.`)
    } else {
      for (const day of [match[1], match[2]]) {
        if (!isRealDay(day)) error("folder", `${day} is not a real calendar day, so the build fails.`)
      }
      if (!String(meta.window.start).startsWith(match[1])) {
        error("meta.window.start", `starts on ${String(meta.window.start).slice(0, 10)} but the folder says ${match[1]}.`)
      }
      if (!String(meta.window.end).startsWith(match[2])) {
        error("meta.window.end", `ends on ${String(meta.window.end).slice(0, 10)} but the folder says ${match[2]}.`)
      }
    }
  }

  // Meta text.
  tooLong("meta.title", meta.title, LIMITS.title, "The hero title wraps to three or more lines.")
  for (const field of ["x_posts", "youtube_videos", "comments_analysed_top_themes"]) {
    notNegative(`meta.counts.${field}`, meta.counts[field])
  }
  const funnels = funnelModel(data)
  for (const [name, stages] of [
    ["sources", funnels.sources],
    ["comments", funnels.comments],
  ]) {
    stages.forEach((stage, index) => {
      if (stage.drop < 0) {
        warn("meta.counts", `The ${name} funnel grows from "${stages[index - 1].label}" (${stages[index - 1].count}) to "${stage.label}" (${stage.count}). Each stage should keep fewer.`)
      }
    })
  }
  if (typeof meta.bottom_line === "string") {
    tooLong("meta.bottom_line", meta.bottom_line, LIMITS.bottom_line, "The hero and index lead get long.")
  }
  if (!meta.generated) warn("meta.generated", "is missing. The index shows no published date.")
  else if (!isRealDay(meta.generated)) {
    warn("meta.generated", `"${meta.generated}" should start with a real YYYY-MM-DD day. The index shows no published date.`)
  }
  ;(meta.also_observed ?? []).forEach((item, index) =>
    tooLong(`meta.also_observed[${index}]`, item, LIMITS.also_observed, "Keep each item to one or two sentences."),
  )
  ;(meta.method_steps ?? []).forEach((step, index) => {
    tooLong(`meta.method_steps[${index}].title`, step.title, LIMITS.step_title, "Step titles are one line.")
    tooLong(`meta.method_steps[${index}].detail`, step.detail, LIMITS.step_detail, "Step details are short.")
  })

  // Themes.
  if (themes.length > LIMITS.themes) {
    warn("themes", `has ${themes.length} themes. Up to ${LIMITS.themes} keeps the list scannable. Move the tail to ranking.`)
  }
  const keys = new Map()
  const ranks = new Map()
  const shorts = new Map()
  const cveHome = new Map()
  themes.forEach((theme, index) => {
    const at = `themes[${index}]`
    if (!KEY.test(theme.key)) {
      error(`${at}.key`, `"${theme.key}" must use letters, digits, "-" or "_". It is part of the #theme-… link.`)
    }
    if (keys.has(theme.key)) error(`${at}.key`, `"${theme.key}" repeats ${keys.get(theme.key)}.key.`)
    keys.set(theme.key, at)
    if (!Number.isInteger(theme.rank) || theme.rank < 1) error(`${at}.rank`, `${theme.rank} must be a whole number from 1.`)
    else if (ranks.has(theme.rank)) warn(`${at}.rank`, `${theme.rank} repeats ${ranks.get(theme.rank)}.rank.`)
    ranks.set(theme.rank, at)

    const short = typeof theme.short_name === "string" ? theme.short_name.trim() : ""
    if (!short) {
      if (length(theme.name) > LIMITS.short_name) {
        warn(`${at}.short_name`, `is missing, so the label becomes "${[...theme.name].slice(0, 11).join("").trimEnd()}…".`)
      }
    } else {
      tooLong(`${at}.short_name`, short, LIMITS.short_name, "Labels in the side menu, charts and cards are cut with an ellipsis.")
      if (shorts.has(short.toLowerCase())) warn(`${at}.short_name`, `"${short}" repeats ${shorts.get(short.toLowerCase())}.short_name.`)
      shorts.set(short.toLowerCase(), at)
    }
    tooLong(`${at}.name`, theme.name, LIMITS.name, "The theme row cuts it with an ellipsis.")
    if (typeof theme.why_line !== "string" || !theme.why_line.trim()) {
      warn(`${at}.why_line`, "is missing. The top-3 card falls back to `why`, cut at three lines.")
    } else {
      tooLong(`${at}.why_line`, theme.why_line, LIMITS.why_line, "The top-3 cards get uneven.")
    }
    tooLong(`${at}.why`, theme.why, LIMITS.why, "The callout gets long.")
    tooLong(`${at}.summary`, theme.summary, LIMITS.summary, "The theme body gets long.")
    for (const field of ["distinct_accounts", "x_engagement", "youtube_views"]) notNegative(`${at}.${field}`, theme[field])
    const actions = Array.isArray(theme.actions) ? theme.actions : []
    if (actions.length > LIMITS.actions) warn(`${at}.actions`, `has ${actions.length} items. Keep ${LIMITS.actions} or fewer.`)
    actions.forEach((action, actionIndex) =>
      tooLong(`${at}.actions[${actionIndex}]`, action, LIMITS.action, "Each action is one imperative sentence."),
    )

    // CVEs.
    const listed = new Set()
    theme.cves.forEach((id, cveIndex) => {
      const path = `${at}.cves[${cveIndex}]`
      if (!CVE_ID.test(id)) warn(path, `"${id}" does not look like CVE-YYYY-NNNN.`)
      if (listed.has(id)) error(path, `"${id}" is listed twice in this theme.`)
      listed.add(id)
      if (cveHome.has(id)) warn(path, `"${id}" is also in ${cveHome.get(id)}. It is shown and counted twice.`)
      else cveHome.set(id, at)
    })
    const detailed = new Set()
    theme.cve_details.forEach((entry, detailIndex) => {
      const path = `${at}.cve_details[${detailIndex}]`
      detailed.add(entry.id)
      if (!listed.has(entry.id)) warn(path, `"${entry.id}" is not in ${at}.cves, so it is not shown.`)
      if (typeof entry.basis !== "string" || !entry.basis.trim()) warn(`${path}.basis`, "is missing. The CVE row shows no evidence line.")
      if (entry.exploited_in_wild === true && theme.exploited_in_wild !== true) {
        warn(`${at}.exploited_in_wild`, `should be true: ${entry.id} is exploited.`)
      }
    })
    for (const id of listed) {
      if (!detailed.has(id)) warn(`${at}.cve_details`, `has no entry for ${id}. Its state falls back to the theme flag.`)
    }

    // Key posts and comments.
    const seen = new Set()
    theme.key_items.forEach((id, itemIndex) => {
      if (seen.has(id)) warn(`${at}.key_items[${itemIndex}]`, `"${id}" is listed twice.`)
      seen.add(id)
    })
    const moods = ["positive", "neutral", "negative", "unclassified"]
    const sentiment = theme.comments.sentiment
    if (sentiment != null) {
      if (typeof sentiment !== "object" || Array.isArray(sentiment)) {
        error(`${at}.comments.sentiment`, "must be an object of counts, for example { \"negative\": 23 }.")
      } else {
        const bad = moods.filter((mood) => mood in sentiment && (typeof sentiment[mood] !== "number" || !Number.isFinite(sentiment[mood])))
        bad.forEach((mood) => error(`${at}.comments.sentiment.${mood}`, "must be a number."))
        if (bad.length === 0) {
          moods.forEach((mood) => notNegative(`${at}.comments.sentiment.${mood}`, sentiment[mood]))
          const total = moods.reduce((sum, mood) => sum + (sentiment[mood] ?? 0), 0)
          const counted = theme.comments.clusters.reduce(
            (sum, cluster) => sum + moods.reduce((part, mood) => part + (cluster.sentiment_counts[mood] ?? 0), 0),
            0,
          )
          if (total !== counted) {
            warn(`${at}.comments.sentiment`, `adds up to ${total} but the clusters add up to ${counted}. The pulse bar and the clusters disagree.`)
          }
        }
      }
    }
    const labels = new Set()
    theme.comments.clusters.forEach((cluster, clusterIndex) => {
      const path = `${at}.comments.clusters[${clusterIndex}]`
      tooLong(`${path}.label`, cluster.label, LIMITS.cluster_label, "Cluster labels wrap on phones.")
      if (labels.has(cluster.label)) warn(`${path}.label`, `"${cluster.label}" repeats in this theme.`)
      labels.add(cluster.label)
      for (const [mood, count] of Object.entries(cluster.sentiment_counts)) {
        if (count < 0) warn(`${path}.sentiment_counts.${mood}`, "is negative.")
      }
      cluster.samples.forEach((sample, sampleIndex) => {
        const samplePath = `${path}.samples[${sampleIndex}]`
        tooLong(`${samplePath}.text`, sample.text, LIMITS.sample, "Quotes are short excerpts.")
        if (!safeHref(sample.parent_url)) warn(`${samplePath}.parent_url`, "is not an http(s) URL, so the quote has no link.")
      })
    })
  })

  // Ranking.
  const ranked = new Map()
  ranking.forEach((row, index) => {
    const at = `ranking[${index}]`
    if (ranked.has(row.key)) warn(`${at}.key`, `"${row.key}" repeats ${ranked.get(row.key)}.key.`)
    ranked.set(row.key, at)
    notNegative(`${at}.accounts`, row.accounts)
    if (typeof row.short_name === "string" && row.short_name.trim()) {
      tooLong(`${at}.short_name`, row.short_name, LIMITS.short_name, "The accounts chart cuts it with an ellipsis.")
    }
    const theme = themes.find((item) => item.key === row.key)
    if (theme && row.accounts !== theme.distinct_accounts) {
      warn(`${at}.accounts`, `is ${row.accounts} but the theme has ${theme.distinct_accounts} distinct_accounts.`)
    }
    if (index > 0 && row.accounts > ranking[index - 1].accounts) {
      warn(`${at}.accounts`, "is higher than the row above. Sort ranking by accounts, most first.")
    }
  })
  themes.forEach((theme, index) => {
    if (!ranked.has(theme.key)) warn(`themes[${index}].key`, `"${theme.key}" is not in ranking, so the accounts chart leaves it out.`)
  })

  // Sources.
  const ids = new Map()
  const platforms = new Map()
  sources.forEach((source, index) => {
    const at = `sources[${index}]`
    if (ids.has(source.id)) error(`${at}.id`, `"${source.id}" repeats ${ids.get(source.id)}.id.`)
    ids.set(source.id, at)
    if (!keys.has(source.theme) && !ranked.has(source.theme)) {
      warn(`${at}.theme`, `"${source.theme}" is not a theme or ranking key, so the row has no theme link.`)
    }
    if (!safeHref(source.url)) warn(`${at}.url`, "is not an http(s) URL, so the post is not linked.")
    if (source.image != null && !safeHref(source.image)) warn(`${at}.image`, "is not an http(s) URL, so no thumbnail shows.")
    const day = dayNumber(source.date_ist)
    if (!DATE_IST.test(source.date_ist)) warn(`${at}.date_ist`, `"${source.date_ist}" should look like "2026-10-23 07:59".`)
    else if (day == null) warn(`${at}.date_ist`, `"${source.date_ist}" is not a real calendar day, so the by-day chart skips it.`)
    if (day != null && first != null && last != null && (day < first || day > last)) {
      warn(`${at}.date_ist`, `${String(source.date_ist).slice(0, 10)} is outside the window, so the by-day chart skips it.`)
    }
    if (source.engagement < 0 || !Number.isInteger(source.engagement)) {
      warn(`${at}.engagement`, `${source.engagement} should be a whole number from 0.`)
    }
    tooLong(`${at}.account`, source.account, LIMITS.account, "Account names wrap.")
    if (!String(source.platform).trim()) warn(`${at}.platform`, "is blank, so no platform filter covers the row.")
    if (!String(source.type).trim()) warn(`${at}.type`, "is blank, so no type filter covers the row.")
    const platform = String(source.platform).trim()
    platforms.set(platform, (platforms.get(platform) ?? 0) + 1)
  })
  for (const value of new Set(sources.map((source) => String(source.platform).trim()))) {
    if (!value || KNOWN_PLATFORMS.includes(value)) continue
    const twin = KNOWN_PLATFORMS.find((known) => known.toLowerCase() === value.toLowerCase())
    if (twin) warn("sources[].platform", `"${value}" should be spelled "${twin}". Platforms are case-sensitive.`)
    else warn("sources[].platform", `"${value}" is new. It renders with a spare colour. See FIELDS.md to pin one.`)
  }
  for (const value of new Set(sources.map((source) => String(source.type).trim()))) {
    if (!value || KNOWN_TYPES.includes(value)) continue
    const twin = KNOWN_TYPES.find((known) => known.toLowerCase() === value.toLowerCase())
    if (twin) warn("sources[].type", `"${value}" should be spelled "${twin}". Types are case-sensitive.`)
    else warn("sources[].type", `"${value}" is new. It renders with a spare colour. See FIELDS.md to pin one.`)
  }
  const byId = new Map(sources.map((source) => [source.id, source]))
  themes.forEach((theme, index) =>
    theme.key_items.forEach((id, itemIndex) => {
      const source = byId.get(id)
      if (source && source.theme !== theme.key) {
        warn(`themes[${index}].key_items[${itemIndex}]`, `"${id}" belongs to theme "${source.theme}".`)
      }
    }),
  )

  // Counts that the page shows side by side.
  const counted = [
    ["x_posts", "X"],
    ["youtube_videos", "YouTube"],
  ]
  for (const [field, platform] of counted) {
    const actual = platforms.get(platform) ?? 0
    if (meta.counts[field] !== actual) {
      warn(`meta.counts.${field}`, `is ${meta.counts[field]} but sources has ${actual} ${platform} rows.`)
    }
  }

  return findings
}
