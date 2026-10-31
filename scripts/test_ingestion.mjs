// The data contract for the weekly refresh: data-ingestion/schema, the examples, lib/check.mjs and the
// page models must agree, and no file that passes the gate may break a page model.
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"
import {
  alsoObserved,
  commentModel,
  cveTableRows,
  cveViews,
  formatKpi,
  funnelModel,
  graphemes,
  headlineStats,
  indexRow,
  loadWeeks,
  methodSteps,
  platformUnits,
  previewCves,
  previousDataWeek,
  rankRows,
  sentimentTotals,
  shortLabel,
  sourceFacets,
  sourceRows,
  sparkSummary,
  themeActions,
  themeRows,
  themesByRank,
  validateData,
  weekDelta,
  heroLead,
  whyText,
  windowDays,
  windowLabel,
  withPositionalRanks,
} from "../lib/brief.mjs"
import { LIMITS, checkWeek } from "../lib/check.mjs"
import { loadSchema, schemaErrors } from "../lib/schema.mjs"

const ROOT = path.join(import.meta.dirname, "..")
const REPORTS = path.join(ROOT, "reports")
const GUIDE = path.join(ROOT, "data-ingestion")
const SCHEMA = loadSchema()
const read = (file) => JSON.parse(fs.readFileSync(file, "utf8"))
const COMPLETE = read(path.join(GUIDE, "examples", "complete.json"))
const MINIMAL = read(path.join(GUIDE, "examples", "minimal.json"))

const describe = (errors) => errors.map((item) => `${item.path} ${item.message}${item.soft ? " (soft)" : ""}`)

/** Error findings from the gate: the build's validator plus the preflight. */
const gateErrors = (data, folder = null) => checkWeek(data, folder).filter((item) => item.level === "error")

/** Everything the pages compute from one week. Throws if a model breaks. */
function renderModels(data, previous = COMPLETE) {
  const days = windowDays(data)
  const themes = themesByRank(data)
  const out = {
    stats: headlineStats(data),
    cves: cveTableRows(data),
    rows: themeRows(data),
    ranking: rankRows(data),
    sentiment: sentimentTotals(data),
    facets: sourceFacets(data),
    sources: sourceRows(data),
    label: windowLabel(data),
    lead: heroLead(data),
    also: alsoObserved(data),
    steps: methodSteps(data),
    funnel: funnelModel(data),
    delta: weekDelta(data, previous),
    index: indexRow({ name: "week", kind: "data", data, start: 0, end: 0, indexPath: null }),
    units: data.sources.map((source) => platformUnits(source.platform)),
    themes: themes.map((theme) => ({
      why: whyText(theme),
      preview: previewCves(theme),
      views: cveViews(theme),
      comments: commentModel(theme),
      actions: themeActions(theme),
    })),
  }
  out.sparks = out.rows.map((row) => sparkSummary(row.spark, days))
  return out
}

/** Every number a page model returns is finite, so no NaN or Infinity reaches a style or a label. */
function assertFinite(value, where = "models") {
  if (typeof value === "number") assert.ok(Number.isFinite(value), `${where} is ${value}`)
  else if (Array.isArray(value)) value.forEach((item, index) => assertFinite(item, `${where}[${index}]`))
  else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) assertFinite(item, `${where}.${key}`)
  }
}

function weekFolders() {
  return fs
    .readdirSync(REPORTS)
    .filter((name) => fs.existsSync(path.join(REPORTS, name, "data.json")))
    .map((name) => ({ name, data: read(path.join(REPORTS, name, "data.json")) }))
}

/** Every path in a value, depth first. Each path is a list of keys. */
function paths(value, at = []) {
  const out = [at]
  if (Array.isArray(value)) value.forEach((item, index) => out.push(...paths(item, [...at, index])))
  else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) out.push(...paths(item, [...at, key]))
  }
  return out
}

function mutate(data, at, change) {
  const copy = structuredClone(data)
  const parent = at.slice(0, -1).reduce((node, key) => node[key], copy)
  change(parent, at.at(-1))
  return copy
}

function wrongValues(value) {
  if (typeof value === "string") return [7, null, true, [], {}, "", " "]
  if (typeof value === "number") return ["7", null, true, -1, 0, 1.5, 11]
  if (typeof value === "boolean") return ["true", 1, null]
  if (value === null) return ["x", 0, false, {}]
  if (Array.isArray(value)) return ["x", null, 7, {}, []]
  return ["x", null, 7, [], {}]
}

// Gate rules that JSON Schema cannot express. Only these may fail a file the schema accepts.
const BEYOND_SCHEMA = [/is not in sources/, /repeats/, /ends before it starts/, /folder says/, /must be named/, /real calendar day/]

function compare(data, label) {
  const all = schemaErrors(data)
  const schema = all.filter((item) => !item.soft)
  const gate = gateErrors(data)
  if (schema.length > 0) {
    assert.ok(gate.length > 0, `${label}: the schema rejects (${describe(schema)[0]}) but the gate accepts`)
  }
  if (gate.length > 0 && schema.length === 0) {
    const known = gate.every((item) => BEYOND_SCHEMA.some((rule) => rule.test(item.message)))
    assert.ok(known, `${label}: the gate rejects (${gate[0].path} ${gate[0].message}) but the schema accepts`)
  }
  if (gate.length === 0) assertFinite(renderModels(data), label)
  return all.length - schema.length
}

test("the examples and every published week match the schema", () => {
  assert.deepEqual(describe(schemaErrors(COMPLETE)), [])
  assert.deepEqual(describe(schemaErrors(MINIMAL)), [])
  for (const week of weekFolders()) assert.deepEqual(describe(schemaErrors(week.data)), [], week.name)
})

test("complete.json passes the gate with no warnings and uses every optional field", () => {
  assert.doesNotThrow(() => validateData(structuredClone(COMPLETE)))
  assert.deepEqual(checkWeek(COMPLETE), [])
  assert.deepEqual(checkWeek(COMPLETE, "2026-10-30_2026-11-05"), [])
  const meta = COMPLETE.meta
  for (const key of ["generated", "bottom_line", "method_steps", "also_observed"]) assert.ok(meta[key], `meta.${key}`)
  for (const theme of COMPLETE.themes) {
    for (const key of ["short_name", "why_line", "actions"]) assert.ok(theme[key], `${theme.key}.${key}`)
    assert.ok(theme.comments.sentiment, `${theme.key}.comments.sentiment`)
  }
  const cve = COMPLETE.themes.flatMap((theme) => theme.cve_details)
  assert.ok(cve.some((entry) => entry.cvss != null && entry.advisory_url && entry.basis))
  assert.ok(COMPLETE.sources.some((source) => source.image))
  assert.ok(COMPLETE.ranking.some((row) => !COMPLETE.themes.some((theme) => theme.key === row.key)))
  const funnel = funnelModel(COMPLETE)
  assert.equal(funnel.sources.length, 2)
  assert.equal(funnel.comments.length, 4)
  assert.equal(funnel.removed.length, 4)
})

test("complete.json shows every proposed field", () => {
  const owners = { theme: COMPLETE.themes, cve: COMPLETE.themes.flatMap((theme) => theme.cve_details), source: COMPLETE.sources }
  let proposed = 0
  for (const [def, rows] of Object.entries(owners)) {
    for (const [key, node] of Object.entries(SCHEMA.$defs[def].properties)) {
      if (!/^Proposed\./.test(node.description ?? "")) continue
      proposed += 1
      assert.equal(node.$comment, "soft", `${def}.${key} is proposed, so it must be soft`)
      assert.ok(rows.some((row) => row[key] != null), `complete.json has no ${def}.${key}`)
    }
  }
  assert.ok(proposed >= 10, `only ${proposed} proposed fields`)
})

test("complete.json also passes the editorial checker, scripts/check_schema_v1.py", (t) => {
  const script = path.join(ROOT, "scripts", "check_schema_v1.py")
  const run = spawnSync("python3", [script, path.join(GUIDE, "examples", "complete.json")], { encoding: "utf8" })
  if (run.error?.code === "ENOENT") return t.skip("python3 is not installed")
  assert.equal(run.status, 0, run.stdout + run.stderr)
  assert.match(run.stdout, /PASS: .*, 0 failures, 0 warnings/)
})

test("minimal.json passes the gate and only warns about optional fields", () => {
  validateData(structuredClone(MINIMAL))
  const findings = checkWeek(MINIMAL, "2026-11-06_2026-11-12")
  assert.deepEqual(
    findings.map((item) => `${item.level} ${item.path}`),
    ["warn meta.bottom_line", "warn meta.generated", "warn themes", "warn themes[0].short_name", "warn themes[0].why_line"],
  )
})

test("every published week passes the gate", () => {
  for (const week of weekFolders()) assert.deepEqual(gateErrors(week.data, week.name), [], week.name)
})

test("schema and gate agree when any field is removed", () => {
  for (const at of paths(COMPLETE)) {
    if (at.length === 0 || typeof at.at(-1) === "number") continue
    compare(
      mutate(COMPLETE, at, (parent, key) => delete parent[key]),
      `without ${at.join(".")}`,
    )
  }
})

test("schema and gate agree when any field has the wrong type or an edge value", () => {
  let checked = 0
  for (const at of paths(COMPLETE)) {
    if (at.length === 0) continue
    const value = at.reduce((node, key) => node[key], COMPLETE)
    for (const wrong of wrongValues(value)) {
      compare(
        mutate(COMPLETE, at, (parent, key) => (parent[key] = wrong)),
        `${at.join(".")} = ${JSON.stringify(wrong)}`,
      )
      checked += 1
    }
  }
  assert.ok(checked > 1000, `only ${checked} mutations`)
})

test("schema and gate reject the rules that matter most", () => {
  const cases = [
    ["schema_version 2", (d) => (d.schema_version = 2)],
    ["no themes", (d) => (d.themes = [])],
    ["blank title", (d) => (d.meta.title = "  ")],
    ["window without a date", (d) => (d.meta.window.start = "Oct 30")],
    ["key with a space", (d) => (d.themes[0].key = "acme gw")],
    ["rank 0", (d) => (d.themes[0].rank = 0)],
    ["rank 1.5", (d) => (d.themes[0].rank = 1.5)],
    ["cvss 11", (d) => (d.themes[0].cve_details[0].cvss = 11)],
    ["javascript advisory", (d) => (d.themes[0].cve_details[0].advisory_url = "javascript:alert(1)")],
    ["flag as text", (d) => (d.themes[0].cve_details[0].exploited_in_wild = "yes")],
    ["CVE twice in a theme", (d) => d.themes[0].cves.push(d.themes[0].cves[0])],
    ["sample date as object", (d) => (d.themes[0].comments.clusters[0].samples[0].date_ist = { day: 1 })],
    ["sentiment as text", (d) => (d.themes[0].comments.sentiment = "negative")],
    ["sentiment count as text", (d) => (d.themes[0].comments.sentiment.negative = "14")],
  ]
  for (const [label, change] of cases) {
    const data = structuredClone(COMPLETE)
    change(data)
    assert.ok(schemaErrors(data).some((item) => !item.soft), `${label}: schema accepts`)
    assert.ok(gateErrors(data).length > 0, `${label}: gate accepts`)
  }
})

test("the gate catches what a schema cannot", () => {
  const cases = [
    ["source id twice", (d) => d.sources.push({ ...d.sources[0] }), /repeats/],
    ["theme key twice", (d) => d.themes.push({ ...d.themes[1], rank: 4, key: d.themes[0].key }), /repeats/],
    ["key post not in sources", (d) => d.themes[0].key_items.push("x0"), /is not in sources/],
    ["window ends first", (d) => (d.meta.window.end = "2026-10-29 23:59 IST"), /ends before it starts/],
    ["window on 30 February", (d) => (d.meta.window.start = "2026-02-30 00:00 IST"), /real calendar day/],
  ]
  for (const [label, change, rule] of cases) {
    const data = structuredClone(COMPLETE)
    change(data)
    const errors = gateErrors(data)
    assert.ok(errors.some((item) => rule.test(item.message)), `${label}: ${JSON.stringify(errors)}`)
  }
  const folder = gateErrors(COMPLETE, "2026-10-31_2026-11-06")
  assert.ok(folder.some((item) => /folder says/.test(item.message)))
  const unreal = gateErrors(COMPLETE, "2026-02-30_2026-03-06")
  assert.ok(unreal.some((item) => item.path === "folder" && /real calendar day/.test(item.message)))
})

test("the gate warns when the layout would suffer", () => {
  const warns = (change) => {
    const data = structuredClone(COMPLETE)
    change(data)
    const findings = checkWeek(data)
    assert.deepEqual(findings.filter((item) => item.level === "error"), [])
    return findings.map((item) => item.path)
  }
  assert.ok(warns((d) => (d.themes[0].short_name = "A label far too long")).includes("themes[0].short_name"))
  assert.ok(warns((d) => (d.themes[0].why_line = "x".repeat(LIMITS.why_line + 1))).includes("themes[0].why_line"))
  assert.ok(warns((d) => (d.meta.counts.x_posts += 1)).includes("meta.counts.x_posts"))
  assert.ok(warns((d) => (d.ranking[0].accounts += 1)).includes("ranking[0].accounts"))
  assert.ok(warns((d) => (d.sources[0].date_ist = "2026-11-09 10:00")).includes("sources[0].date_ist"))
  assert.ok(warns((d) => (d.sources[0].platform = "Bluesky")).includes("sources[].platform"))
  assert.ok(warns((d) => (d.sources[0].platform = "youtube")).includes("sources[].platform"))
  assert.ok(warns((d) => d.themes[0].key_items.push(d.themes[1].key_items[0])).includes("themes[0].key_items[3]"))
  assert.ok(warns((d) => (d.themes[0].comments.sentiment.negative += 5)).includes("themes[0].comments.sentiment"))
})

test("a proposed or record-only field with a bad value only warns", () => {
  const cases = [
    ["themes[0].severity", (d) => (d.themes[0].severity = "urgent")],
    ["themes[0].tags[0]", (d) => (d.themes[0].tags[0] = "Edge Device")],
    ["themes[0].attack_techniques[0].id", (d) => (d.themes[0].attack_techniques[0].id = "1190")],
    ["themes[0].references[0].url", (d) => (d.themes[0].references[0].url = "javascript:alert(1)")],
    ["themes[0].cve_details[0].epss", (d) => (d.themes[0].cve_details[0].epss = 94)],
    ["themes[0].cve_details[0].kev", (d) => (d.themes[0].cve_details[0].kev = "yes")],
    ["sources[0].followers", (d) => (d.sources[0].followers = -1)],
    ["meta.counts.candidates", (d) => (d.meta.counts.candidates = "175")],
    ["meta.counts.comment_exclusions", (d) => (d.meta.counts.comment_exclusions = [])],
    ["themes[0].comments.count", (d) => (d.themes[0].comments.count = "many")],
  ]
  for (const [where, change] of cases) {
    const data = structuredClone(COMPLETE)
    change(data)
    const findings = checkWeek(data)
    assert.deepEqual(findings.filter((item) => item.level === "error"), [], where)
    assert.ok(
      findings.some((item) => item.path === where && /does not use this value/.test(item.message)),
      `${where}: ${JSON.stringify(findings)}`,
    )
    assertFinite(renderModels(data), where)
  }
})

test("funnels come from the optional counts and skip what is missing or wrong", () => {
  const real = weekFolders().find((week) => week.data.meta.counts.comment_exclusions)
  if (real) {
    const funnel = funnelModel(real.data)
    assert.deepEqual(funnel.sources.map((stage) => stage.count), [real.data.meta.counts.candidates, real.data.sources.length])
    assert.equal(funnel.comments.at(-1).count, real.data.meta.counts.comments_analysed_top_themes)
    for (const stages of [funnel.sources, funnel.comments]) stages.forEach((stage) => assert.ok(stage.drop >= 0, stage.label))
    assert.ok(funnel.removed.every((row) => row.count > 0))
  }
  assert.deepEqual(funnelModel(MINIMAL), { sources: [], comments: [], removed: [] })
  const data = structuredClone(COMPLETE)
  data.meta.counts.comments_retrieved = -4
  data.meta.counts.comment_exclusions = { retrieved: "lots", in_window: 30, excluded_no_text: 2 }
  delete data.meta.counts.candidates
  const funnel = funnelModel(data)
  assert.deepEqual(funnel.sources, [])
  assert.deepEqual(funnel.comments.map((stage) => stage.label), ["in the window", "kept", "in themes"])
  assert.deepEqual(funnel.removed, [{ label: "no text", count: 2 }])
  const grown = structuredClone(COMPLETE)
  grown.meta.counts.candidates = 2
  assert.ok(checkWeek(grown).some((item) => item.path === "meta.counts" && /grows/.test(item.message)))
})

test("negative counts warn and still render", () => {
  const data = structuredClone(COMPLETE)
  data.themes[0].distinct_accounts = -3
  data.themes[0].comments.sentiment.negative = -1
  data.ranking[1].accounts = -2
  data.meta.counts.youtube_videos = -1
  const findings = checkWeek(data)
  assert.deepEqual(findings.filter((item) => item.level === "error"), [])
  const paths = findings.map((item) => item.path)
  for (const where of ["themes[0].distinct_accounts", "themes[0].comments.sentiment.negative", "ranking[1].accounts", "meta.counts.youtube_videos"]) {
    assert.ok(paths.includes(where), where)
  }
  assertFinite(renderModels(data))
})

test("labels and headline numbers stay short without splitting a character", () => {
  const coder = "👩‍💻"
  assert.equal(graphemes(`${coder}e\u0301a`).length, 3)
  assert.equal(shortLabel(coder.repeat(12)), coder.repeat(12))
  assert.equal(shortLabel(coder.repeat(13)), `${coder.repeat(11)}…`)
  assert.equal(shortLabel("Café au lait outbreak"), "Café au lai…")
  assert.deepEqual([0, 99999, 100000, 1234567, -250000].map(formatKpi), ["0", "99,999", "100K", "1.2M", "-250K"])
  const named = structuredClone(COMPLETE)
  delete named.themes[0].short_name
  named.themes[0].name = coder.repeat(20)
  const finding = checkWeek(named).find((item) => item.path === "themes[0].short_name")
  assert.ok(finding && finding.message.includes(`"${coder.repeat(11)}…"`), JSON.stringify(finding))
})

test("ranks print as positions, so a gap or a repeat only warns", () => {
  assert.equal(withPositionalRanks(COMPLETE), COMPLETE)
  const gaps = structuredClone(COMPLETE)
  gaps.themes.forEach((theme, index) => (theme.rank = index * 2 + 1))
  const findings = checkWeek(gaps)
  assert.deepEqual(findings.filter((item) => item.level === "error"), [])
  assert.ok(findings.some((item) => item.path === "themes[].rank"))
  assert.deepEqual(
    withPositionalRanks(gaps).themes.map((theme) => [theme.key, theme.rank]),
    COMPLETE.themes.map((theme) => [theme.key, theme.rank]),
  )
  const ties = structuredClone(COMPLETE)
  ties.themes.forEach((theme) => (theme.rank = 1))
  assert.ok(checkWeek(ties).some((item) => item.level === "warn" && item.path === "themes[1].rank"))
  const tied = withPositionalRanks(ties)
  const byKey = [...ties.themes].map((theme) => theme.key).sort()
  assert.deepEqual(themesByRank(tied).map((theme) => [theme.key, theme.rank]), byKey.map((key, index) => [key, index + 1]))
  assertFinite(renderModels(tied))
})

test("a CVE in two themes counts once, and exploited wins", () => {
  const data = structuredClone(COMPLETE)
  const [lead, , last] = data.themes
  const shared = lead.cve_details.find((entry) => entry.exploited_in_wild === null).id
  last.cves.push(shared)
  last.cve_details.push({ id: shared, exploited_in_wild: true, basis: "Vendor advisory (Contoso)." })
  last.exploited_in_wild = true
  const rows = cveTableRows(data).filter((row) => row.id === shared)
  assert.deepEqual(rows.map((row) => [row.key, row.flag]), [[last.key, true]])
  const stats = headlineStats(data)
  assert.equal(stats.cves, cveTableRows(data).length)
  assert.equal(stats.cves, new Set(data.themes.flatMap((theme) => theme.cves)).size)
  assert.equal(stats.exploited, cveTableRows(data).filter((row) => row.flag === true).length)
  assert.equal(themeRows(data).find((row) => row.key === lead.key).cves, lead.cves.length)
  const findings = checkWeek(data)
  assert.deepEqual(findings.filter((item) => item.level === "error"), [])
  assert.ok(findings.some((item) => item.path === `themes[2].cves[${last.cves.length - 1}]` && /count it once/.test(item.message)))
})

test("an empty ranking falls back to the themes", () => {
  const data = structuredClone(COMPLETE)
  data.ranking = []
  assert.deepEqual(gateErrors(data), [])
  assert.deepEqual(
    rankRows(data).map((row) => [row.key, row.accounts]),
    themesByRank(data).map((theme) => [theme.key, theme.distinct_accounts]),
  )
  assertFinite(renderModels(data))
})

test("fractions, long words and long evidence warn", () => {
  const data = structuredClone(COMPLETE)
  data.themes[0].distinct_accounts = 12.5
  data.themes[0].comments.clusters[0].sentiment_counts.neutral = 0.5
  data.themes[0].summary += ` See https://example.com/${"a".repeat(60)} for more.`
  data.themes[0].cve_details[0].basis = "Seen in the wild. ".repeat(20)
  data.sources = [...data.sources, ...Array.from({ length: LIMITS.sources }, (_, index) => ({ ...data.sources[0], id: `extra${index}` }))]
  const findings = checkWeek(data)
  assert.deepEqual(findings.filter((item) => item.level === "error"), [])
  const at = (where, rule) => findings.some((item) => item.path === where && rule.test(item.message))
  assert.ok(at("themes[0].distinct_accounts", /whole numbers/))
  assert.ok(at("themes[0].comments.clusters[0].sentiment_counts.neutral", /whole numbers/))
  assert.ok(at("themes[0].summary", /-character word/))
  assert.ok(at("themes[0].cve_details[0].basis", /Keep it to 300/))
  assert.ok(at("sources", /Keep 200 or fewer/))
  assertFinite(renderModels(data))
})

test("the build reads a byte-order mark and stops on any gate error", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "weeks-"))
  try {
    const week = path.join(dir, "reports", "2026-10-30_2026-11-05")
    fs.mkdirSync(week, { recursive: true })
    const file = path.join(week, "data.json")
    fs.writeFileSync(file, `\uFEFF${JSON.stringify(COMPLETE)}`)
    assert.equal(loadWeeks(path.join(dir, "reports"))[0].data.meta.title, COMPLETE.meta.title)
    const checked = spawnSync(process.execPath, [path.join(ROOT, "scripts", "check_week.mjs"), file], { encoding: "utf8" })
    assert.equal(checked.status, 0, checked.stdout + checked.stderr)
    assert.match(checked.stdout, /warn {2}starts with a byte-order mark/)

    // The build's own validator accepts a folder that disagrees with the window. The gate does not.
    fs.renameSync(week, path.join(dir, "reports", "2026-10-31_2026-11-06"))
    assert.equal(loadWeeks(path.join(dir, "reports")).length, 1)
    const built = spawnSync(process.execPath, [path.join(ROOT, "scripts", "build_site.mjs")], { cwd: dir, encoding: "utf8" })
    assert.equal(built.status, 1, built.stdout + built.stderr)
    assert.match(built.stderr, /^Build stopped\.\n.*data\.json: meta\.window\.start starts on 2026-10-30 but the folder says 2026-10-31\./)
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

test("pages cope with a thin week: one theme, no CVEs, no comments, no YouTube", () => {
  const models = renderModels(MINIMAL)
  assertFinite(models)
  assert.equal(models.stats.themes, 1)
  assert.equal(models.stats.cves, 0)
  assert.deepEqual(models.cves, [])
  assert.deepEqual(models.sentiment, { positive: 0, neutral: 0, negative: 0, unclassified: 0 })
  assert.deepEqual(
    models.facets.platform.map((entry) => entry.key),
    ["X"],
  )
  assert.equal(models.themes[0].why.clamp, true)
  assert.equal(models.index.shortName, "Router botn…")
  assert.equal(models.delta.themes.routerbotnet.isNew, true)
})

test("a new platform gets counted, ordered last and given neutral units", () => {
  const data = structuredClone(COMPLETE)
  data.sources.push({
    ...data.sources[0],
    id: "bsky1",
    platform: "Bluesky",
    url: "https://bsky.app/profile/acme/post/1",
    engagement: 40,
  })
  data.meta.capture.bluesky = "2026-11-06 20:15 IST to 2026-11-06 20:16 IST"
  const models = renderModels(data)
  assertFinite(models)
  assert.equal(models.stats.sources, data.sources.length)
  assert.deepEqual(
    models.facets.platform.map((entry) => entry.key),
    ["X", "YouTube", "Bluesky"],
  )
  const acme = models.rows.find((row) => row.key === "acmegw")
  assert.deepEqual(acme.platforms.at(-1), { key: "Bluesky", count: 1 })
  assert.deepEqual(platformUnits("Bluesky"), { noun: "sources", metric: "engagement" })
  assert.deepEqual(platformUnits("YouTube"), { noun: "videos", metric: "views" })
  assert.equal(gateErrors(data).length, 0)
})

test("weeks chain: the newest week compares with the one before it", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "weeks-"))
  try {
    const put = (name, data) => {
      fs.mkdirSync(path.join(dir, name))
      fs.writeFileSync(path.join(dir, name, "data.json"), JSON.stringify(data))
    }
    for (const week of weekFolders()) put(week.name, week.data)
    put("2026-10-30_2026-11-05", COMPLETE)
    put("2026-11-06_2026-11-12", MINIMAL)
    const weeks = loadWeeks(dir)
    assert.equal(weeks[0].name, "2026-11-06_2026-11-12")
    const previous = previousDataWeek(weeks, weeks[0].name)
    assert.equal(previous.name, "2026-10-30_2026-11-05")
    const delta = weekDelta(weeks[0].data, previous.data)
    assert.equal(delta.label, windowLabel(COMPLETE))
    assert.deepEqual(
      delta.dropped.map((entry) => entry.key),
      ["acmegw", "npmworm", "contosoai"],
    )
    assert.equal(delta.totals.sources, MINIMAL.sources.length - COMPLETE.sources.length)
    for (const week of weeks) assert.match(indexRow(week).window, /^\d{4}-\d{2}-\d{2} .+ to \d{4}-\d{2}-\d{2} /)
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

test("FIELDS.md documents every schema field and every limit", () => {
  const fields = fs.readFileSync(path.join(GUIDE, "FIELDS.md"), "utf8")
  const lines = fields.split("\n")
  for (const [name, limit] of Object.entries(LIMITS)) {
    assert.ok(
      lines.some((line) => line.includes(`\`${name}\``) && new RegExp(`\\b${limit}\\b`).test(line)),
      `FIELDS.md has no row for the ${name} limit (${limit})`,
    )
  }
  const names = new Set()
  const walk = (node) => {
    if (!node || typeof node !== "object") return
    for (const [key, value] of Object.entries(node)) {
      if (key === "properties") Object.keys(value).forEach((name) => names.add(name))
      walk(value)
    }
  }
  walk(SCHEMA)
  const code = [...fields.matchAll(/`([^`]+)`/g)].map((match) => match[1]).join(" ")
  const missing = [...names].filter((name) => !new RegExp(`(^|[^\\w])${name}($|[^\\w])`).test(code))
  assert.deepEqual(missing, [], "FIELDS.md does not mention these schema fields")
  assert.equal(SCHEMA.properties.schema_version.const, 1)
})
