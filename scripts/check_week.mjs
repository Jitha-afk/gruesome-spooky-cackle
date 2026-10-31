// Check week files before they are published. See data-ingestion/README.md.
// Usage: node scripts/check_week.mjs [reports/<week> | path/to/file.json ...] [--strict] [--json]
// With no paths it checks every entry in reports/. A week folder or a data.json inside one gets the folder
// rules too. Exit 1 on an error, or on any warning with --strict. In GitHub Actions it also writes annotations.
import fs from "node:fs"
import path from "node:path"
import { WEEK_FOLDER, checkWeek } from "../lib/check.mjs"

const args = process.argv.slice(2)
const strict = args.includes("--strict")
const asJson = args.includes("--json")
const root = path.resolve(import.meta.dirname, "..")
const reports = path.join(root, "reports")

/** One target per week folder or file: { label, dir, file, folder }. folder is null for a loose file. */
function targets() {
  const given = args.filter((arg) => !arg.startsWith("--"))
  if (given.length === 0) {
    if (!fs.existsSync(reports)) return []
    return fs
      .readdirSync(reports)
      .filter((name) => !name.startsWith("."))
      .sort()
      .map((name) => {
        const dir = path.join(reports, name)
        return { label: path.relative(root, dir), dir, file: path.join(dir, "data.json"), folder: name }
      })
  }
  return given.map((arg) => {
    const full = path.resolve(arg)
    if (fs.existsSync(full) && fs.statSync(full).isDirectory()) {
      return { label: path.relative(root, full) || ".", dir: full, file: path.join(full, "data.json"), folder: path.basename(full) }
    }
    const parent = path.dirname(full)
    const inReports = path.dirname(parent) === reports
    const folder = inReports || WEEK_FOLDER.test(path.basename(parent)) ? path.basename(parent) : null
    return { label: path.relative(root, full), dir: null, file: full, folder }
  })
}

function check(target) {
  const findings = []
  const error = (where, message) => findings.push({ level: "error", path: where, message })
  if (target.dir && !fs.statSync(target.dir).isDirectory()) {
    error("", "is a file. reports/ may hold only week folders, so the build fails on it.")
    return findings
  }
  if (target.folder != null && !WEEK_FOLDER.test(target.folder)) {
    error("folder", `${target.folder} must be named YYYY-MM-DD_YYYY-MM-DD.`)
  }
  if (!fs.existsSync(target.file)) {
    const legacy = target.dir && fs.existsSync(path.join(target.dir, "index.html"))
    if (!legacy) error("", target.dir ? "has no data.json or index.html." : "does not exist.")
    return findings
  }
  let data
  try {
    data = JSON.parse(fs.readFileSync(target.file, "utf8"))
  } catch (failure) {
    error("", `is not valid JSON. ${failure.message}`)
    return findings
  }
  const folder = target.folder != null && WEEK_FOLDER.test(target.folder) ? target.folder : null
  findings.push(...checkWeek(data, folder))
  return findings
}

const results = targets().map((target) => ({ ...target, findings: check(target) }))
const count = (level) => results.reduce((sum, result) => sum + result.findings.filter((item) => item.level === level).length, 0)
const errors = count("error")
const warnings = count("warn")
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`

if (asJson) {
  const weeks = results.map(({ label, folder, findings }) => ({ label, folder, findings }))
  console.log(JSON.stringify({ errors, warnings, weeks }, null, 2))
} else {
  for (const result of results) {
    console.log(`${result.findings.length === 0 ? "ok  " : "    "} ${result.label}`)
    for (const item of result.findings) {
      console.log(`  ${item.level === "error" ? "error" : "warn "} ${item.path ? `${item.path} ` : ""}${item.message}`)
    }
  }
  console.log(`${plural(results.length, "week")}, ${plural(errors, "error")}, ${plural(warnings, "warning")}.`)
}

if (process.env.GITHUB_ACTIONS === "true") {
  const escape = (text) => String(text).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A")
  const property = (text) => escape(text).replace(/:/g, "%3A").replace(/,/g, "%2C")
  for (const result of results) {
    const file = path.relative(root, result.file ?? result.dir)
    for (const item of result.findings) {
      const kind = item.level === "error" ? "error" : "warning"
      console.log(`::${kind} file=${property(file)},title=${property(item.path || "week")}::${escape(item.message)}`)
    }
  }
}

process.exit(errors > 0 || (strict && warnings > 0) ? 1 : 0)
