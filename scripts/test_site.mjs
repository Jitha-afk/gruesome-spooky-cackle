import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"
import zlib from "node:zlib"
import { funnelModel, loadWeeks } from "../lib/brief.mjs"
import { BASE_PATH, SITE_URL } from "../lib/site-url.mjs"

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

test("share metadata has absolute URLs and a served card", () => {
  const index = fs.readFileSync(path.join(site, "index.html"), "utf8")
  const week = fs.readFileSync(path.join(site, "reports", weekName, "index.html"), "utf8")
  const head = (html, pattern) => html.match(pattern)?.[1]
  assert.ok(fs.existsSync(path.join(site, "og.png")), "og.png is missing")
  assert.equal(head(index, /<link rel="canonical" href="([^"]+)"/), SITE_URL)
  assert.equal(head(week, /<link rel="canonical" href="([^"]+)"/), `${SITE_URL}reports/${weekName}/`)
  assert.equal(head(index, /<meta property="og:image" content="([^"]+)"/), `${SITE_URL}og.png`)
  assert.match(head(week, /<title>([^<]+)<\/title>/) ?? "", /^PHP2Shell, AI offence and Brotli CVE · 23–29 Oct 2026 · /)
})

test("each week has a 1200×630 card in its head and a 1080×1350 share card", () => {
  for (const week of loadWeeks(path.join(root, "reports")).filter((item) => item.kind === "data")) {
    for (const [file, size] of [["og.png", [1200, 630]], ["share.png", [1080, 1350]]]) {
      const png = fs.readFileSync(path.join(site, "reports", week.name, file))
      assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", `${week.name}/${file} is not a PNG`)
      assert.equal(png.subarray(12, 16).toString("latin1"), "IHDR")
      assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], size, `${week.name}/${file} size`)
    }
    const html = fs.readFileSync(path.join(site, "reports", week.name, "index.html"), "utf8")
    const card = `${SITE_URL}reports/${week.name}/og.png`
    for (const name of ["og:image", "twitter:image"]) {
      const tags = [...html.matchAll(new RegExp(`<meta (?:property|name)="${name}" content="([^"]+)"`, "g"))].map((match) => match[1])
      assert.deepEqual(tags, [card], `${week.name} ${name}`)
    }
    assert.match(html, /<meta property="og:image:alt" content="Weekly threat intel report for Jitesh Thakur, [^"]+\. A chart shows the top themes by the number of accounts\."/)
  }
})

test("the Atom feed is built, with absolute links, and every page links it", () => {
  const feed = fs.readFileSync(path.join(site, "feed.xml"), "utf8")
  assert.match(feed, /^<\?xml version="1\.0" encoding="utf-8"\?>\n<feed xmlns="http:\/\/www\.w3\.org\/2005\/Atom">/)
  assert.ok(feed.includes(`<link rel="self" type="application/atom+xml" href="${SITE_URL}feed.xml"/>`))
  assert.ok(feed.includes(`<id>${SITE_URL}reports/${weekName}/</id>`))
  assert.doesNotMatch(feed, /&(?!amp;|lt;|gt;|quot;)/)
  for (const [, href] of feed.matchAll(/href="([^"]+)"/g)) assert.ok(href.startsWith(SITE_URL), href)
  const dataWeeks = loadWeeks(path.join(root, "reports")).filter((week) => week.kind === "data")
  assert.equal(feed.match(/<entry>/g)?.length, dataWeeks.length)
  const pages = ["index.html", "404.html", path.join("reports", weekName, "index.html")]
  for (const page of pages) {
    const html = fs.readFileSync(path.join(site, page), "utf8")
    const links = html.match(/<link\b[^>]*type="application\/atom\+xml"[^>]*>/g) ?? []
    assert.equal(links.length, 1, `${page} has ${links.length} feed links`)
    assert.ok(links[0].includes(`href="${SITE_URL}feed.xml"`), links[0])
    assert.ok(html.includes(`href="${BASE_PATH}/feed.xml"`), `${page} has no footer feed link`)
  }
})
