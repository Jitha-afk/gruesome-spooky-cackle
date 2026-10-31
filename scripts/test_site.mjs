import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"
import zlib from "node:zlib"
import { funnelModel, loadWeeks } from "../lib/brief.mjs"
import { BASE_PATH } from "../lib/site-url.mjs"

const root = path.resolve(import.meta.dirname, "..")
const site = path.join(root, "site")
const weekName = "2026-10-23_2026-10-29"

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const child = path.join(dir, name)
    if (fs.statSync(child).isDirectory()) walk(child, files)
    else files.push(child)
  }
  return files
}

test("built routes, order and zero framework JS", () => {
  const index = fs.readFileSync(path.join(site, "index.html"), "utf8")
  const weekPath = path.join(site, "reports", weekName, "index.html")
  const week = fs.readFileSync(weekPath, "utf8")
  const legacy = fs.readFileSync(path.join(root, "reports", weekName, "index.html"))
  assert.notEqual(fs.readFileSync(weekPath), legacy)
  assert.ok(index.includes(`href="${BASE_PATH}/reports/${weekName}/"`))
  assert.match(index, /PHP2Shell/)
  assert.match(index, /10 themes/)
  assert.match(index, /2026-10-23 00:00 IST[\s\S]{0,80}to[\s\S]{0,80}2026-10-29 23:59 IST/)
  assert.match(week, /Trust boundary: treat instruction files as untrusted input/)
  assert.match(week, /CVE-2026-111497[\s\S]{0,120}EXPLOITED/)
  assert.match(week, /CVE-2026-115560[\s\S]{0,120}NOT CONFIRMED/)
  assert.doesNotMatch(week, /CVE-2026-115560[\s\S]{0,40}EXPLOITED/)
  assert.match(week, /UEFI boot/)
  assert.match(week, /Linux kernel/)
  assert.match(week, /title="UEFI and Secure Boot bypasses"/)
  assert.doesNotMatch(week, /translateY\(8px\)/)
  assert.doesNotMatch(week, /_next\/static\/chunks\/[^"]+\.js/)
  const scripts = [...week.matchAll(/<script\b/gi)]
  assert.equal(scripts.length, 2)
  assert.match(week, /localStorage\.getItem\("theme"\)/)
  assert.ok(week.includes(`src="${BASE_PATH}/site.js"`))
  const js = walk(site)
    .filter((file) => file.endsWith(".js"))
    .map((file) => path.relative(site, file))
  assert.deepEqual(js, ["site.js"])
  const gz = zlib.gzipSync(fs.readFileSync(path.join(site, "site.js")))
  assert.ok(gz.length < 3072, `site.js gzip ${gz.length}`)
})

test("every week and theme is built, with no broken values", () => {
  const index = fs.readFileSync(path.join(site, "index.html"), "utf8")
  const weeks = loadWeeks(path.join(root, "reports"))
  assert.ok(weeks.length > 0)
  for (const week of weeks) {
    const file = path.join(site, "reports", week.name, "index.html")
    assert.ok(fs.existsSync(file), `${week.name} has no page`)
    assert.ok(index.includes(`href="${BASE_PATH}/reports/${week.name}/"`), `the index does not link ${week.name}`)
    if (week.kind !== "data") continue
    const html = fs.readFileSync(file, "utf8")
    for (const theme of week.data.themes) {
      assert.ok(html.includes(`id="theme-${theme.key}"`), `${week.name} has no #theme-${theme.key}`)
    }
    const funnel = funnelModel(week.data)
    if (funnel.sources.length > 0 || funnel.comments.length > 0) assert.match(html, /id="funnel"/)
    for (const page of [html, index]) {
      assert.doesNotMatch(page, /\s(?:style|data-[\w-]+|aria-[\w-]+|width|height)="[^"]*\b(?:NaN|Infinity|undefined)\b/)
      assert.doesNotMatch(page, /class="[^"]*\bnum\b[^"]*"[^>]*>[^<]*\b(?:NaN|Infinity|undefined)\b/)
    }
  }
})
