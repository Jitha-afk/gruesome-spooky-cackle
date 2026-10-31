import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"
import {
  BuildError,
  cveTableRows,
  cveViews,
  commentModel,
  headlineStats,
  heatmapModel,
  indexRow,
  loadWeeks,
  previewCves,
  rankRows,
  sentimentTotals,
  shortLabel,
  nameDetail,
  sparkSeries,
  sparkSummary,
  themeRows,
  themeSentiment,
  windowDays,
  windowLabel,
  validateData,
  waffleParts,
  heroLead,
  cveSentence,
  whyText,
} from "../lib/brief.mjs"
import { atomFeed, weekUpdated } from "../lib/feed.mjs"
import { logIntensityLevel } from "../lib/scale.mjs"
import { ACCENT_KEY, DEFAULT_ACCENT, accentBoot, accents } from "../lib/accent.mjs"

const REAL = path.join(import.meta.dirname, "..", "reports")

function minimal() {
  return {
    schema_version: 1,
    meta: {
      title: "Brief",
      window: { start: "2026-01-01 00:00 IST", end: "2026-01-07 23:59 IST" },
      capture: { x: "x capture", youtube: "yt capture" },
      counts: { x_posts: 1, youtube_videos: 2, comments_analysed_top_themes: 3 },
      methodology: "Count the posts.",
      inaccessible: ["One limit."],
      extra_meta: true,
    },
    themes: [
      {
        rank: 1,
        key: "alpha",
        name: "Alphabetical theme name",
        summary: "Summary text.",
        why: "Why text.",
        affected: { products: "Products", sectors: "Sectors", regions: "Regions" },
        vendors: ["Vendor A"],
        media: ["Media A"],
        independent: ["Indie A"],
        distinct_accounts: 4,
        x_engagement: 5,
        youtube_views: 6,
        key_items: ["s1"],
        comments: {
          clusters: [
            {
              label: "Cluster",
              sentiment_counts: { positive: 1, negative: 2 },
              samples: [{ text: "A comment.", parent_url: "https://example.test/post", date_ist: "2026-01-02 00:00" }],
            },
          ],
        },
        cves: ["CVE-1", "CVE-2"],
        exploited_in_wild: false,
        cve_details: [{ id: "CVE-1", exploited_in_wild: null }],
        extra_theme: { ok: 1 },
      },
    ],
    ranking: [
      { key: "alpha", name: "Alphabetical theme name", accounts: 4 },
      { key: "other", name: "Alphabetical theme name", accounts: 1 },
    ],
    sources: [
      {
        id: "s1",
        platform: "X",
        type: "vendor",
        account: "Acct",
        date_ist: "2026-01-02 01:00",
        text: "Hello",
        url: "https://example.test/s1",
        engagement: 9,
        theme: "alpha",
        metrics: { likes: 3 },
      },
    ],
    extra_root: "kept",
  }
}

test("real week validates and keeps each CVE state", () => {
  const weeks = loadWeeks(REAL)
  assert.equal(weeks.length, 1)
  assert.equal(weeks[0].kind, "data")
  assert.equal(weeks[0].name, "2026-10-23_2026-10-29")
  const views = weeks[0].data.themes.flatMap((theme) => cveViews(theme))
  assert.equal(views.length, 8)
  assert.equal(views.filter((row) => row.tag === "EXPLOITED").length, 7)
  assert.equal(views.filter((row) => row.tag === "NOT CONFIRMED").length, 1)
  const brotli = views.find((row) => row.id === "CVE-2026-111497")
  const later = views.find((row) => row.id === "CVE-2026-115560")
  assert.equal(brotli.tag, "EXPLOITED")
  assert.equal(later.tag, "NOT CONFIRMED")
  assert.ok(brotli.basis)
  assert.ok(later.basis)
  const row = indexRow(weeks[0])
  assert.equal(row.shortName, "PHP2Shell")
  assert.equal(row.themeCount, 10)
  assert.match(heroLead(weeks[0].data), /^The sources tell you that attackers exploit \d+ of the \d+ CVEs in this report\. PHP2Shell is the top theme, with \d+ accounts\. Many web applications and appliances use PHP\. .+\.$/)
  const ranks = rankRows(weeks[0].data)
  assert.deepEqual(
    ranks.map((item) => item.key),
    weeks[0].data.ranking.map((item) => item.key),
  )
  assert.equal(ranks.find((item) => item.key === "uefi").label, "UEFI boot")
  assert.equal(ranks.find((item) => item.key === "linuxkernel").label, "Linux kernel")
  const agents = weeks[0].data.themes.find((theme) => theme.key === "aiagents")
  assert.equal(commentModel(agents)[0].label, "Trust boundary: treat instruction files as untrusted input")
  const sample = commentModel(agents)[0].samples[0]
  assert.deepEqual(Object.keys(sample).sort(), ["date", "href", "text"])
})

test("short_name and basis are optional and extra fields are allowed", () => {
  const data = minimal()
  assert.doesNotThrow(() => validateData(data, "fixture"))
  const ranks = rankRows(data)
  assert.equal(ranks[0].label, "Alphabetica…")
  assert.equal(ranks[0].title, "Alphabetical theme name")
  assert.equal(ranks[1].label, "Alphabetica…")
  assert.notEqual(ranks[0].key, ranks[1].key)
  const [first, second] = cveViews(data.themes[0])
  assert.equal(first.tag, "NOT CONFIRMED")
  assert.equal(first.basis, null)
  assert.equal(second.tag, "NOT EXPLOITED")
  assert.equal(second.basis, null)

  data.themes[0].short_name = "Alpha"
  data.themes[0].cve_details[0].basis = "A basis line."
  data.themes[0].cve_details.push({ id: "CVE-2", exploited_in_wild: true, basis: "Used." })
  validateData(data, "fixture")
  assert.equal(rankRows(data)[0].label, "Alpha")
  assert.equal(rankRows(data)[1].label, "Alphabetica…")
  data.ranking[0].short_name = "Rank name"
  assert.equal(rankRows(data)[0].label, "Rank name")
  assert.equal(shortLabel("Alphabetical theme name", "Alpha"), "Alpha")
  assert.equal(cveViews(data.themes[0])[0].basis, "A basis line.")
  assert.equal(cveViews(data.themes[0])[1].tag, "EXPLOITED")
})

test("heroLead prefers bottom_line, then counts and the top why_line", () => {
  const data = structuredClone(loadWeeks(REAL)[0].data)
  const top = data.themes.find((theme) => theme.rank === 1)
  top.why_line = "Patch is not enough"
  assert.match(heroLead(data), /accounts\. Patch is not enough\.$/)
  top.why_line = "Is a patch enough?"
  assert.match(heroLead(data), /accounts\. Is a patch enough\?$/)
  const flags = (value) => {
    for (const theme of data.themes) {
      theme.exploited_in_wild = value
      for (const detail of theme.cve_details ?? []) detail.exploited_in_wild = value
    }
  }
  assert.equal(cveSentence(data), "The sources tell you that attackers exploit 7 of the 8 CVEs in this report.")
  flags(false)
  assert.equal(cveSentence(data), null)
  assert.match(heroLead(data), /^PHP2Shell is the top theme, with /)
  flags(true)
  assert.match(heroLead(data), /^The sources tell you that attackers exploit all \d+ CVEs in this report\. PHP2Shell/)
  for (const theme of data.themes) theme.cves = theme === top ? theme.cves.slice(0, 1) : []
  assert.match(heroLead(data), /^The sources tell you that attackers exploit the CVE in this report\. PHP2Shell/)
  for (const theme of data.themes) theme.cves = []
  assert.match(heroLead(data), /^PHP2Shell is the top theme, with /)
  data.meta.bottom_line = "One line."
  assert.equal(heroLead(data), "One line.")
  data.meta.bottom_line = null
  data.themes = []
  assert.equal(heroLead(data), "This report has no themes.")
})

test("nameDetail drops a leading label only at a word boundary", () => {
  assert.equal(nameDetail("PHP2Shell: critical PHP core RCE flaws", "PHP2Shell"), "Critical PHP core RCE flaws")
  assert.equal(nameDetail("Tailworm — SSH flaws", "tailworm"), "SSH flaws")
  assert.equal(nameDetail("Windows zero-day", "Win"), "Windows zero-day")
  assert.equal(nameDetail("Brotli decoder flaw", "Brotli CVE"), "Brotli decoder flaw")
  assert.equal(nameDetail("Tailworm", "Tailworm"), "")
  assert.equal(nameDetail("Organisations disclose breaches", "Organisatio…"), "Organisations disclose breaches")
})

test("week graphs use only data.json", () => {
  const data = loadWeeks(REAL)[0].data
  const stats = headlineStats(data)
  assert.equal(stats.themes, 10)
  assert.equal(stats.sources, data.sources.length)
  assert.equal(stats.sources, data.meta.counts.x_posts + data.meta.counts.youtube_videos)
  assert.equal(stats.exploited, 7)
  assert.equal(stats.cves, 8)
  assert.equal(data.meta.title, "Weekly threat intel report")
  const heat = heatmapModel(data)
  assert.deepEqual(heat.columns, ["Fri", "Sat", "Sun", "Mon", "Tue", "Wed", "Thu"])
  assert.equal(heat.rows.length, 10)
  const counted = heat.rows.reduce((sum, row) => sum + row.values.reduce((a, b) => a + b, 0), 0)
  assert.equal(counted, data.sources.length)
  const table = cveTableRows(data)
  assert.equal(table[0].flag, true)
  assert.equal(table.at(-1).id, "CVE-2026-115560")
  assert.equal(table.at(-1).tag, "NOT CONFIRMED")
  const parts = waffleParts(sentimentTotals(data))
  assert.equal(parts.reduce((sum, part) => sum + part.cells, 0), 100)
  assert.equal(sparkSeries(data.themes[0], data).length, 7)
  const php = sparkSeries(data.themes.find((theme) => theme.key === "php2shell"), data)
  assert.deepEqual(php, [17, 14, 4, 7, 9, 6, 6])
  assert.equal(sparkSummary(php, windowDays(data)), "Sources per day, Fri to Thu: 17, 14, 4, 7, 9, 6, 6.")
  const peak = Math.max(...heat.rows.flatMap((row) => row.values))
  assert.equal(logIntensityLevel(0, peak), 0)
  assert.ok(logIntensityLevel(1, peak) < logIntensityLevel(4, peak))
  assert.ok(logIntensityLevel(4, peak) < logIntensityLevel(17, peak))
  assert.equal(logIntensityLevel(peak, peak), 4)
  assert.equal(whyText(data.themes[0]).clamp, false)
  assert.ok(whyText(data.themes[0]).text.length > 0)
})

test("theme rows hold the small multiples for each theme", () => {
  const data = loadWeeks(REAL)[0].data
  const rows = themeRows(data)
  assert.equal(rows.length, 10)
  assert.deepEqual(
    rows.map((row) => row.rank),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  )
  const php = rows[0]
  assert.equal(php.label, "PHP2Shell")
  assert.equal(php.accounts, 30)
  assert.equal(php.share, 1)
  assert.deepEqual(php.spark, [17, 14, 4, 7, 9, 6, 6])
  assert.deepEqual([php.cves, php.exploited, php.unconfirmed], [3, 2, 1])
  assert.deepEqual(php.mix, { vendor: 6, media: 6, independent: 12 })
  const count = (row) => row.platforms.reduce((sum, entry) => sum + entry.count, 0)
  assert.equal(count(php), 63)
  assert.deepEqual(
    php.platforms.map((entry) => entry.key),
    ["X", "YouTube"],
  )
  assert.equal(
    rows.reduce((sum, row) => sum + count(row), 0),
    data.sources.length,
  )
  assert.equal(windowLabel(data), "23–29 Oct 2026")
  assert.equal(cveTableRows(data).at(-1).key, "php2shell")
  assert.equal(php.comments, 52)
  assert.ok(rows.every((row) => row.share > 0 && row.share <= 1))
  const total = rows.reduce((sum, row) => sum + row.comments, 0)
  const all = sentimentTotals(data)
  assert.equal(total, all.positive + all.neutral + all.negative + all.unclassified)

  const fixture = minimal()
  assert.deepEqual(themeSentiment(fixture.themes[0]), { positive: 1, neutral: 0, negative: 2, unclassified: 0 })
  fixture.themes[0].comments.sentiment = { positive: 5, neutral: 1 }
  assert.deepEqual(themeSentiment(fixture.themes[0]), { positive: 5, neutral: 1, negative: 0, unclassified: 0 })
  fixture.meta.window = { start: "2026-12-29 00:00 IST", end: "2027-01-04 23:59 IST" }
  assert.equal(windowLabel(fixture), "29 Dec 2026 – 4 Jan 2027")
  fixture.meta.window = { start: "2026-10-29 00:00 IST", end: "2026-11-04 23:59 IST" }
  assert.equal(windowLabel(fixture), "29 Oct – 4 Nov 2026")
  const [only] = themeRows(fixture)
  assert.deepEqual([only.cves, only.exploited, only.unconfirmed], [2, 0, 1])
  assert.equal(only.label, "Alphabetica…")
})

test("accent families boot to a known accent", () => {
  const ids = accents.map((accent) => accent.id)
  assert.equal(new Set(ids).size, ids.length)
  assert.ok(ids.includes(DEFAULT_ACCENT))
  assert.equal(accents.find((accent) => accent.id === DEFAULT_ACCENT).kind, "gradient")
  assert.deepEqual(
    [...new Set(accents.map((accent) => accent.kind))].sort(),
    ["gradient", "solid"],
  )
  const css = fs.readFileSync(path.join(import.meta.dirname, "..", "app", "globals.css"), "utf8")
  for (const id of ids) {
    assert.ok(css.includes(`html[data-accent="${id}"] {`), `light rule for ${id}`)
    assert.ok(css.includes(`html.dark[data-accent="${id}"] {`), `dark rule for ${id}`)
  }
  const run = (stored) => {
    const attrs = {}
    const h = { setAttribute: (key, value) => (attrs[key] = value) }
    const localStorage = { getItem: (key) => (key === ACCENT_KEY ? stored : null) }
    new Function("h", "localStorage", accentBoot())(h, localStorage)
    return attrs
  }
  assert.deepEqual(run(null), { "data-accent": "prism", "data-accent-kind": "gradient" })
  assert.deepEqual(run("mint"), { "data-accent": "mint", "data-accent-kind": "solid" })
  assert.deepEqual(run("ocean"), { "data-accent": "ocean", "data-accent-kind": "gradient" })
  assert.deepEqual(run("nope"), { "data-accent": "prism", "data-accent-kind": "gradient" })
})

test("why_line is optional and top cards keep three CVEs", () => {
  const data = minimal()
  assert.equal(whyText(data.themes[0]).clamp, true)
  assert.equal(whyText(data.themes[0]).text, data.themes[0].why)
  data.themes[0].why_line = "One short line."
  assert.deepEqual(whyText(data.themes[0]), { text: "One short line.", clamp: false })
  data.themes[0].why_line = "   "
  assert.equal(whyText(data.themes[0]).clamp, true)
  delete data.themes[0].why_line
  assert.doesNotThrow(() => validateData(data, "fixture"))
  data.themes[0].why_line = 4
  assert.throws(() => validateData(data, "fixture"), /why_line must be a string/)
  data.themes[0].why_line = "One short line."
  data.themes[0].cves = ["CVE-1", "CVE-2", "CVE-3", "CVE-4", "CVE-5"]
  data.themes[0].cve_details = data.themes[0].cves.map((id) => ({
    id,
    exploited_in_wild: false,
  }))
  const preview = previewCves(data.themes[0], 3)
  assert.equal(preview.shown.length, 3)
  assert.equal(preview.extra, 2)
  assert.equal(preview.shown[0].id, "CVE-1")
  assert.equal(cveViews(data.themes[0]).length, 5)
})

test("unknown schema_version and missing fields fail", () => {
  const unknown = minimal()
  unknown.schema_version = 2
  assert.throws(() => validateData(unknown, "fixture"), (error) => {
    assert.ok(error instanceof BuildError)
    assert.match(error.message, /unknown schema_version/)
    return true
  })
  const missingVersion = minimal()
  delete missingVersion.schema_version
  assert.throws(() => validateData(missingVersion, "fixture"), /schema_version is missing/)
  const missingName = minimal()
  delete missingName.themes[0].name
  assert.throws(() => validateData(missingName, "fixture"), /themes\[0\]\.name is missing/)
  const missingBasisIsOk = minimal()
  delete missingBasisIsOk.themes[0].cve_details[0].basis
  assert.doesNotThrow(() => validateData(missingBasisIsOk, "fixture"))
})

test("atomFeed lists the data weeks newest first, with escaped text and absolute links", () => {
  const site = { url: "https://example.test/base/", title: "T & co", subtitle: "S <b>", author: { name: "A", uri: "https://example.test/a" } }
  const real = atomFeed(loadWeeks(REAL), site)
  assert.match(real, /^<\?xml version="1\.0" encoding="utf-8"\?>\n<feed xmlns="http:\/\/www\.w3\.org\/2005\/Atom">/)
  assert.match(real, /<title>T &amp; co<\/title>\n {2}<subtitle>S &lt;b&gt;<\/subtitle>/)
  assert.match(real, /<summary type="text">The sources tell you that attackers exploit 7 of the 8 CVEs in this report\. PHP2Shell/)
  assert.match(real, /<updated>2026-10-30T20:25:00\+05:30<\/updated>/)
  for (const [, href] of real.matchAll(/href="([^"]+)"/g)) assert.ok(href.startsWith(site.url), href)
  const week = (name, start, end) => {
    const data = minimal()
    data.meta.window = { start: `${start} 00:00 IST`, end: `${end} 23:59 IST` }
    return { name, start: Date.parse(start), end: Date.parse(end), kind: "data", data, indexPath: null }
  }
  const older = week("2026-01-01_2026-01-07", "2026-01-01", "2026-01-07")
  const newer = week("2026-01-08_2026-01-14", "2026-01-08", "2026-01-14")
  const legacy = { ...older, name: "2025-12-25_2025-12-31", kind: "legacy", data: null, indexPath: "index.html" }
  const xml = atomFeed([older, legacy, newer], site)
  assert.deepEqual(
    [...xml.matchAll(/<id>([^<]+)<\/id>/g)].map((match) => match[1]),
    [site.url, `${site.url}reports/2026-01-08_2026-01-14/`, `${site.url}reports/2026-01-01_2026-01-07/`],
  )
  assert.equal(xml.match(/<updated>([^<]+)<\/updated>/)?.[1], "2026-01-14T23:59:00+05:30")
  assert.match(atomFeed([], site), /<updated>1970-01-01T00:00:00Z<\/updated>\n[\s\S]*<\/author>\n<\/feed>\n$/)
})

test("weekUpdated uses meta.generated, then the window end, in IST", () => {
  const data = structuredClone(loadWeeks(REAL)[0].data)
  assert.equal(weekUpdated(data), "2026-10-30T20:25:00+05:30")
  data.meta.generated = "2026-02-30 10:00 IST"
  assert.equal(weekUpdated(data), "2026-10-29T23:59:00+05:30")
  data.meta.generated = "2026-10-30 24:00 IST"
  assert.equal(weekUpdated(data), "2026-10-29T23:59:00+05:30")
  delete data.meta.generated
  data.meta.window.end = "2026-10-29"
  assert.equal(weekUpdated(data), "2026-10-29T23:59:00+05:30")
})

test("routes, legacy pages and index order", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "weeks-"))
  const reports = path.join(root, "reports")
  fs.mkdirSync(reports)
  fs.mkdirSync(path.join(reports, ".keep"))
  const older = path.join(reports, "2026-10-01_2026-10-07")
  const newer = path.join(reports, "2026-10-23_2026-10-29")
  const sameEnd = path.join(reports, "2026-10-20_2026-10-29")
  fs.mkdirSync(older)
  fs.writeFileSync(path.join(older, "index.html"), "<p>legacy</p>\n")
  fs.mkdirSync(newer)
  fs.writeFileSync(path.join(newer, "data.json"), JSON.stringify(minimal()))
  fs.writeFileSync(path.join(newer, "index.html"), "<p>old render</p>\n")
  fs.mkdirSync(sameEnd)
  fs.writeFileSync(path.join(sameEnd, "index.html"), "<p>same end</p>\n")
  const weeks = loadWeeks(reports)
  assert.deepEqual(
    weeks.map((week) => week.name),
    ["2026-10-23_2026-10-29", "2026-10-20_2026-10-29", "2026-10-01_2026-10-07"],
  )
  assert.deepEqual(
    weeks.map((week) => week.kind),
    ["data", "legacy", "legacy"],
  )
  assert.equal(indexRow(weeks[1]).shortName, null)
  assert.match(indexRow(weeks[1]).window, /20 Oct to 29 Oct 2026/)
  assert.equal(indexRow(weeks[0]).href, "/reports/2026-10-23_2026-10-29/")

  fs.mkdirSync(path.join(reports, "not-a-week"))
  assert.throws(() => loadWeeks(reports), /YYYY-MM-DD_YYYY-MM-DD/)
  fs.rmSync(path.join(reports, "not-a-week"), { recursive: true })
  fs.writeFileSync(path.join(reports, "notes.txt"), "no")
  assert.throws(() => loadWeeks(reports), /notes.txt/)
  fs.rmSync(path.join(reports, "notes.txt"))
  fs.mkdirSync(path.join(reports, "2026-02-31_2026-03-02"))
  assert.throws(() => loadWeeks(reports), /not a real calendar day/)
  fs.rmSync(path.join(reports, "2026-02-31_2026-03-02"), { recursive: true })
  fs.mkdirSync(path.join(reports, "2026-10-29_2026-10-23"))
  assert.throws(() => loadWeeks(reports), /ends before it starts/)
})
