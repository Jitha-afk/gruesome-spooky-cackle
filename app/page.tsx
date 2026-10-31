import Link from "next/link"
import { Header } from "@/components/header"
import { indexRow, loadWeeks, reportsRoot } from "@/lib/brief.mjs"

export default function IndexPage() {
  const weeks = loadWeeks(reportsRoot())
  return (
    <main className="site font-mono">
      <Header home title="Weekly threat intel" summary="Open a week." />
      {weeks.length === 0 ? (
        <p>No briefs yet.</p>
      ) : (
        <ul className="week-list">
          {weeks.map((week) => {
            const row = indexRow(week)
            const count =
              row.themeCount == null
                ? null
                : row.themeCount === 1
                  ? "1 theme"
                  : `${row.themeCount} themes`
            return (
              <li key={week.name}>
                <Link className="week-row graph-frame" href={row.href}>
                  <span>{row.window}</span>
                  {row.shortName ? <span title={row.title ?? undefined}>{row.shortName}</span> : <span>Saved page.</span>}
                  {count ? <span className="week-count">{count}</span> : null}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
