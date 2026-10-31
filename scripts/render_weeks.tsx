import fs from "node:fs"
import path from "node:path"
import { loadWeeks, reportsRoot } from "../lib/brief.mjs"
import { renderWeekHtml } from "../lib/render-brief"

async function main() {
  const outDir = path.join(process.cwd(), "generated")
  fs.mkdirSync(outDir, { recursive: true })
  for (const name of fs.readdirSync(outDir)) {
    if (name.endsWith(".html")) fs.rmSync(path.join(outDir, name))
  }

  for (const week of loadWeeks(reportsRoot())) {
    if (week.kind !== "brief" || !week.data) continue
    const html = await renderWeekHtml(week.data, week.sections, week.name)
    fs.writeFileSync(path.join(outDir, `${week.name}.html`), html)
  }
}

main()
