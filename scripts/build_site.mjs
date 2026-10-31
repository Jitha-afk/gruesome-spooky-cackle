// Validate week files, export the Next site, then strip framework JS.
import { spawnSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { BuildError, loadWeeks, reportsRoot } from "../lib/brief.mjs"
import { accentBoot } from "../lib/accent.mjs"
import { checkWeek } from "../lib/check.mjs"

const root = path.resolve(import.meta.dirname, "..")
const outDir = path.join(root, "out")
const siteDir = path.join(root, "site")

// A deep link lands at once: no smooth scroll and no details animation until load.
const DEEP_LINK = `if(location.hash){h.classList.add("deep");h.style.scrollBehavior="auto";var o=function(){h.classList.remove("deep");h.style.scrollBehavior=""};addEventListener("load",function(){setTimeout(o)});setTimeout(o,3e3)}`
const THEME_BOOT = `<script>(function(){var t="dark";try{var s=localStorage.getItem("theme");if(s==="light"||s==="dark")t=s;}catch(e){}var h=document.documentElement;if(t==="light")h.classList.remove("dark");else h.classList.add("dark");h.classList.add("js");${DEEP_LINK}h.style.colorScheme=t==="light"?"light":"dark";var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",t==="light"?"#fafafa":"#040404");${accentBoot()}})();</script>`
// If site.js fails to load, drop the js class so the page falls back to its no-JS layout.
const SITE_JS = `<script src="/gruesome-spooky-cackle/site.js" defer onerror="document.documentElement.classList.remove('js')"></script>`

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit" })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

function inject(html) {
  if (!html.includes("</head>") || !html.includes("</body>")) {
    throw new Error("Built HTML is missing head or body.")
  }
  return html.replace("</head>", `${THEME_BOOT}</head>`).replace("</body>", `${SITE_JS}</body>`)
}

let weeks
try {
  weeks = loadWeeks(reportsRoot())
} catch (error) {
  if (!(error instanceof BuildError)) throw error
  console.error(`Build stopped. ${error.message}\nRun: pnpm check:week for every rule.`)
  process.exit(1)
}

// The errors that fail `pnpm check:week` also stop a local build, so no build publishes a week CI rejects.
const stops = []
for (const week of weeks) {
  if (week.kind !== "data") continue
  const file = path.join(reportsRoot(), week.name, "data.json")
  const raw = JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""))
  for (const item of checkWeek(raw, week.name)) {
    if (item.level === "error") stops.push(`${path.relative(root, file)}: ${item.path ? `${item.path} ` : ""}${item.message}`)
  }
}
if (stops.length > 0) {
  console.error(`Build stopped.\n${stops.join("\n")}\nRun: pnpm check:week for every rule.`)
  process.exit(1)
}
run("pnpm", ["exec", "next", "build"])
run("python3", ["scripts/strip-js.py", outDir, siteDir])

for (const file of fs.readdirSync(siteDir, { recursive: true })) {
  if (!String(file).endsWith(".css")) continue
  const target = path.join(siteDir, String(file))
  if (!fs.statSync(target).isFile()) continue
  const css = fs.readFileSync(target, "utf8")
  const trimmed = css.replace(/@font-face\{[^}]*\}/g, (block) => {
    if (block.includes("U+??") || block.includes("2500-259F") || block.includes("Fallback") || block.includes("local(")) {
      return block
    }
    return ""
  })
  fs.writeFileSync(target, trimmed)
}

for (const file of fs.readdirSync(siteDir, { recursive: true })) {
  if (!String(file).endsWith(".html")) continue
  const target = path.join(siteDir, String(file))
  if (!fs.statSync(target).isFile()) continue
  fs.writeFileSync(target, inject(fs.readFileSync(target, "utf8")))
}

for (const week of weeks) {
  if (week.kind !== "legacy" || !week.indexPath) continue
  const destination = path.join(siteDir, "reports", week.name)
  fs.mkdirSync(destination, { recursive: true })
  fs.copyFileSync(week.indexPath, path.join(destination, "index.html"))
}

const jsFiles = []
function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const child = path.join(dir, name)
    if (fs.statSync(child).isDirectory()) walk(child)
    else if (child.endsWith(".js")) jsFiles.push(path.relative(siteDir, child))
  }
}
walk(siteDir)
const unexpected = jsFiles.filter((file) => file !== "site.js")
if (unexpected.length > 0) {
  console.error(`Framework JS remains: ${unexpected.join(", ")}`)
  process.exit(1)
}

console.log(`Wrote ${weeks.length} week${weeks.length === 1 ? "" : "s"} to ${siteDir}`)
