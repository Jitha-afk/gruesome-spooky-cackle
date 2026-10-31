import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"
import zlib from "node:zlib"

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
  assert.match(index, /href="\/gruesome-spooky-cackle\/reports\/2026-10-23_2026-10-29\/"/)
  assert.match(index, /PHP2Shell/)
  assert.match(index, /10 themes/)
  assert.match(index, /2026-10-23 00:00 IST to 2026-10-29 23:59 IST/)
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
  assert.match(week, /src="\/gruesome-spooky-cackle\/site\.js"/)
  const js = walk(site)
    .filter((file) => file.endsWith(".js"))
    .map((file) => path.relative(site, file))
  assert.deepEqual(js, ["site.js"])
  const gz = zlib.gzipSync(fs.readFileSync(path.join(site, "site.js")))
  assert.ok(gz.length < 3072, `site.js gzip ${gz.length}`)
})
