import type { CSSProperties } from "react"
import Link from "next/link"
import { ArrowRight, ArrowUpRight } from "lucide-react"
import { Frame, SectionHead } from "@/components/frame"
import { Bar, Meter } from "@/components/glyph"
import { DateUnits, Hero, SiteFooter, SiteHeader } from "@/components/header"
import { pad, plural } from "@/components/tones"
import {
  bottomLine,
  formatCount,
  formatKpi,
  headlineStats,
  indexRow,
  loadWeeks,
  reportsRoot,
  sourceFacets,
  themeRows,
  themesByRank,
  whyText,
  windowLabel,
  type WeekData,
  type WeekRecord,
} from "@/lib/brief.mjs"

type Vars = CSSProperties & Record<`--${string}`, string | number>

function Latest({ week, data }: { week: WeekRecord; data: WeekData }) {
  const row = indexRow(week)
  const rows = themeRows(data).slice(0, 5)
  const stats = headlineStats(data)
  const top = themesByRank(data)[0]
  const peak = Math.max(1, ...rows.map((item) => item.accounts))
  return (
    <Frame className="latest" title="latest week">
      <div className="latest-grid">
        <div className="latest-copy">
          <p className="kicker">
            <DateUnits text={row.window} />
          </p>
          <h2 className="latest-title">
            <Link href={row.href}>{windowLabel(data)}</Link>
          </h2>
          <p className="lead">
            {bottomLine(data) ?? (
              <>
                <span title={row.title ?? undefined}>{row.shortName}</span> led the week. {top ? whyText(top).text : null}
              </>
            )}
          </p>
          <dl className="mini-kpis">
            <div>
              <dt>themes</dt>
              <dd className="num">{formatKpi(stats.themes)}</dd>
            </div>
            <div>
              <dt>sources</dt>
              <dd className="num">{formatKpi(stats.sources)}</dd>
            </div>
            <div>
              <dt>comments</dt>
              <dd className="num">{formatKpi(stats.comments)}</dd>
            </div>
            <div>
              <dt>exploited</dt>
              <dd className="num">
                {formatKpi(stats.exploited)}/{formatKpi(stats.cves)}
              </dd>
            </div>
          </dl>
          <Link className="btn btn-solid" href={row.href}>
            read the brief
            <ArrowRight aria-hidden="true" size={14} strokeWidth={1.75} />
          </Link>
        </div>
        <ol aria-label="Top themes by accounts" className="rank-list latest-rank">
          {rows.map((item, index) => {
            const style: Vars = { "--i": index }
            return (
              <li key={item.key} style={style}>
                <span aria-hidden="true" className="num muted">
                  {pad(item.rank)}
                </span>
                <span className="row-label" title={item.name}>
                  {item.label}
                </span>
                <Bar bracket tone="a" value={item.accounts / peak} />
                <span className="num">
                  {formatCount(item.accounts)}
                  <span className="sr-only"> accounts</span>
                </span>
              </li>
            )
          })}
        </ol>
      </div>
    </Frame>
  )
}

export default function IndexPage() {
  const weeks = loadWeeks(reportsRoot())
  const latest = weeks.find((week) => week.kind === "data" && week.data)
  const volume = Math.max(1, ...weeks.map((week) => (week.data ? headlineStats(week.data).sources : 0)))
  const platforms = latest?.data ? sourceFacets(latest.data).platform.map((entry) => entry.key.toLowerCase()) : []
  const read = platforms.length > 1 ? `${platforms.slice(0, -1).join(", ")} and ${platforms.at(-1)}` : platforms[0]
  return (
    <>
      <SiteHeader />
      <div className="shell">
        <main className="main" id="main" tabIndex={-1}>
          <Hero
            kicker={read ? `weekly · ${read}` : "weekly"}
            lead="What vendors, media and independent researchers talked about each week, ranked by how many accounts covered it. CVE states, key posts and the comment pulse for every theme."
            title="Weekly threat intel"
          />
          {latest?.data ? <Latest data={latest.data} week={latest} /> : null}
          <section aria-labelledby="archive-title" className="sec" id="archive">
            <SectionHead id="archive" kicker="archive" title="All weeks" />
            {weeks.length === 0 ? (
              <p className="muted">No briefs yet.</p>
            ) : (
              <ol className="log">
                {weeks.map((week, index) => {
                  const row = indexRow(week)
                  const stats = week.data ? headlineStats(week.data) : null
                  const style: Vars = { "--i": index }
                  return (
                    <li className={index === 0 ? "log-row is-latest" : "log-row"} key={week.name} style={style}>
                      <Link className="log-link" href={row.href}>
                        <span className="log-date">
                          <span className="log-label" title={row.window}>
                            {row.label}
                          </span>
                          {row.published ? <span className="date-unit">published {row.published}</span> : null}
                        </span>
                        <span aria-hidden="true" className="log-node" />
                        <span className="log-main">
                          <span className="log-title">
                            {row.shortName ? (
                              <>
                                <span className="muted">led by</span>{" "}
                                <span title={row.title ?? undefined}>{row.shortName}</span>
                              </>
                            ) : (
                              "Saved page."
                            )}
                          </span>
                          <span className="log-meta">
                            {stats ? (
                              <>
                                <span className="log-stat">{plural(stats.themes, "theme")}</span>
                                <span className="log-stat">
                                  {plural(stats.sources, "source")}
                                  <Bar value={stats.sources / volume} />
                                </span>
                                {stats.cves > 0 ? (
                                  <span className="log-stat">
                                    <span aria-hidden="true">
                                      {stats.exploited}/{stats.cves} exploited
                                    </span>
                                    <Meter
                                      hot={stats.exploited}
                                      label={`${stats.exploited} of ${stats.cves} CVEs exploited.`}
                                      max={12}
                                      total={stats.cves}
                                    />
                                  </span>
                                ) : null}
                              </>
                            ) : (
                              <span>archived HTML</span>
                            )}
                          </span>
                        </span>
                        <ArrowUpRight aria-hidden="true" className="log-go" size={16} strokeWidth={1.75} />
                      </Link>
                    </li>
                  )
                })}
              </ol>
            )}
          </section>
        </main>
      </div>
      <SiteFooter>
        <p>{plural(weeks.length, "week")} published. A new brief lands every week.</p>
      </SiteFooter>
    </>
  )
}
