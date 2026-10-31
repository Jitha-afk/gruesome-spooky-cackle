import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"
import { parseStrictYaml } from "../lib/yaml-strict.mjs"
import {
  BuildError,
  bodySections,
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
  sparkSeries,
  sparkSummary,
  windowDays,
  validateData,
  waffleParts,
  weekSummary,
  whyText,
} from "../lib/brief.mjs"
import { logIntensityLevel } from "../lib/scale.mjs"

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
  assert.equal(weeks[0].kind, "brief")
  assert.equal(weeks[0].name, "2026-10-23_2026-10-29")
  assert.equal(weeks[0].body.trim(), "")
  const original = JSON.parse(fs.readFileSync(path.join(REAL, weeks[0].name, "data.json"), "utf8"))
  const rejoined = structuredClone(weeks[0].data)
  rejoined.schema_version = 1
  assert.deepEqual(rejoined, original)
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
  assert.match(weekSummary(weeks[0].data.themes.find((theme) => theme.rank === 1)), /^PHP2Shell led this week with /)
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

test("week graphs use only data.json", () => {
  const data = loadWeeks(REAL)[0].data
  const stats = headlineStats(data)
  assert.equal(stats.themes, 10)
  assert.equal(stats.sources, data.meta.counts.x_posts + data.meta.counts.youtube_videos)
  assert.equal(stats.exploited, 7)
  assert.equal(stats.cves, 8)
  assert.equal(data.meta.title, "Weekly cybersecurity threat-intel brief")
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

test("strict YAML keeps quoted dates and numeric ids as strings", () => {
  const flow = parseStrictYaml(
    '{ "date_ist": "2026-10-23", "id": "00123", "count": 4, "flag": false, "quoted_flag": "false" }',
  )
  assert.equal(flow.date_ist, "2026-10-23")
  assert.equal(typeof flow.date_ist, "string")
  assert.equal(flow.id, "00123")
  assert.equal(typeof flow.id, "string")
  assert.equal(flow.count, 4)
  assert.equal(flow.flag, false)
  assert.equal(flow.quoted_flag, "false")
  const block = parseStrictYaml('date_ist: "2026-10-23"\nid: "00123"\nraw: 2026-10-22T18:30:00Z\n')
  assert.equal(block.date_ist, "2026-10-23")
  assert.equal(typeof block.id, "string")
  assert.equal(block.id, "00123")
  assert.equal(typeof block.raw, "string")
  assert.equal(block.raw, "2026-10-22T18:30:00Z")
})

test("brief.md joins sources and allows a missing body section", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "brief-"))
  const reports = path.join(root, "reports")
  const week = path.join(reports, "2026-03-01_2026-03-07")
  fs.mkdirSync(week, { recursive: true })
  const data = minimal()
  data.schema_version = 2
  const samples = {
    alpha: data.themes[0].comments.clusters.map((cluster) => cluster.samples),
  }
  for (const cluster of data.themes[0].comments.clusters) delete cluster.samples
  const sources = data.sources
  delete data.sources
  fs.writeFileSync(path.join(week, "brief.md"), `---\n${JSON.stringify(data)}\n---\n`)
  fs.writeFileSync(path.join(week, "sources.json"), JSON.stringify({ sources, samples }))
  const weeks = loadWeeks(reports)
  assert.equal(weeks[0].kind, "brief")
  assert.equal(weeks[0].data.schema_version, 2)
  assert.equal(weeks[0].data.sources[0].id, "s1")
  assert.equal(weeks[0].data.themes[0].comments.clusters[0].samples[0].text, "A comment.")
  assert.equal(weeks[0].data.sources[0].date_ist, "2026-01-02 01:00")
  assert.equal(typeof weeks[0].data.sources[0].date_ist, "string")
  const keys = new Set(["alpha"])
  assert.deepEqual(bodySections("", keys), {})
  assert.deepEqual(bodySections("## alpha\n\nA note.\n", keys), { alpha: "A note." })
  assert.throws(() => bodySections("## nope\n", keys), /not a theme key/)
  assert.throws(() => bodySections("## alpha\n\n## alpha\n", keys), /more than once/)
  assert.throws(() => bodySections("Hello\n", keys), /before a theme heading/)
})
