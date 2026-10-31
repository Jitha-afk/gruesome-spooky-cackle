import { Fragment, type CSSProperties } from "react"
import { ChevronsUpDown } from "lucide-react"
import { Box, Corners, Frame, SectionHead } from "@/components/frame"
import { Bar, Delta, Legend, Meter, Spark, Split, type Part } from "@/components/glyph"
import { DateUnits, Hero, SiteFooter, SiteHeader, Toc, type TocItem } from "@/components/header"
import { Callout, KeepCves, Steps } from "@/components/prose"
import { Signals } from "@/components/signals"
import { Sources } from "@/components/sources"
import { CveKey, CveRows, ThemeBoard } from "@/components/theme-board"
import { SENTIMENT, cveGlyph, pad, percent, platformTone, plural } from "@/components/tones"
import {
  alsoObserved,
  cveTableRows,
  formatCount,
  formatKpi,
  funnelModel,
  headlineStats,
  heroLead,
  methodSteps,
  platformUnits,
  previewCves,
  sentimentTotals,
  sourceFacets,
  sparkSummary,
  themeRows,
  themesByRank,
  weekDelta,
  whyText,
  windowDays,
  windowLabel,
  type FunnelStage,
  type Theme,
  type ThemeRow,
  type WeekData,
  type WeekDelta,
} from "@/lib/brief.mjs"

type Vars = CSSProperties & Record<`--${string}`, string | number>

function Kpis({ data, rows, delta }: { data: WeekData; rows: ThemeRow[]; delta: WeekDelta | null }) {
  const stats = headlineStats(data)
  const cves = cveTableRows(data)
  const unconfirmed = cves.filter((row) => row.flag === null).length
  const facets = sourceFacets(data)
  const platformKeys = facets.platform.map((entry) => entry.key)
  const platforms: Part[] = facets.platform.map((entry) => ({
    label: entry.key,
    tone: platformTone(entry.key, platformKeys),
    value: entry.count,
  }))
  const sentiment = sentimentTotals(data)
  const moods: Part[] = SENTIMENT.map((entry) => ({ label: entry.key, tone: entry.tone, value: sentiment[entry.key] }))
  const read = moods.reduce((sum, part) => sum + part.value, 0)
  // A negative count is a warned data error. Count it as 0 so the share stays within 0 to 100%.
  const counted = (row: ThemeRow) => Math.max(0, row.accounts)
  const accounts = rows.reduce((sum, row) => sum + counted(row), 0)
  const lead = rows.slice(0, 3)
  const leadAccounts = lead.reduce((sum, row) => sum + counted(row), 0)
  const leadShare = percent(leadAccounts, accounts)
  const concentration: Part[] = [
    ...lead.map((row, index) => ({ label: row.label, tone: (["a", "b", "m"] as const)[index], value: counted(row) })),
    { label: "other themes", tone: "f", value: accounts - leadAccounts },
  ]
  const describe = (parts: Part[]) => parts.map((part) => `${part.value} ${part.label}`).join(", ")
  return (
    <Frame className="kpi-frame" title="this week">
      <dl className="kpis">
        <div className="kpi">
          <dt>themes</dt>
          <dd className="kpi-value">
            <span className="num">{formatKpi(stats.themes)}</span>
            {delta ? <Delta unit="themes" value={delta.totals.themes} /> : null}
          </dd>
          <dd className="kpi-viz">
            <Split label={`Accounts by theme: ${describe(concentration)}.`} parts={concentration} />
          </dd>
          <dd className="kpi-note">
            {accounts <= 0 ? (
              "0 accounts"
            ) : lead.length > 1 ? (
              <>
                <span className="num t-n">{leadShare}%</span> in the top {lead.length}
              </>
            ) : (
              plural(lead.length, "theme")
            )}
          </dd>
        </div>
        <div className="kpi">
          <dt>sources</dt>
          <dd className="kpi-value">
            <span className="num">{formatKpi(stats.sources)}</span>
            {delta ? <Delta unit="sources" value={delta.totals.sources} /> : null}
          </dd>
          <dd className="kpi-viz">
            <Split label={`Sources by platform: ${describe(platforms)}.`} parts={platforms} />
          </dd>
          <dd className="kpi-note">
            {platforms.map((part, index) => (
              <Fragment key={part.label}>
                {index > 0 ? " " : null}
                <span className="kpi-part">
                  <span className={`num t-${part.tone}`}>{formatCount(part.value)}</span> {part.label}
                </span>
              </Fragment>
            ))}
          </dd>
        </div>
        <div className="kpi">
          <dt>comments</dt>
          <dd className="kpi-value">
            <span className="num">{formatKpi(stats.comments)}</span>
            {delta ? <Delta unit="comments" value={delta.totals.comments} /> : null}
          </dd>
          <dd className="kpi-viz">
            <Split label={`Comment sentiment: ${describe(moods)}.`} parts={moods} />
          </dd>
          <dd className="kpi-note">
            {read > 0 ? (
              <>
                <span className="kpi-part">
                  <span className="num t-d">{percent(sentiment.negative, read)}%</span> negative
                </span>{" "}
                <span className="kpi-part">
                  <span className="num t-a">{percent(sentiment.positive, read)}%</span> positive
                </span>
              </>
            ) : (
              "0 comments"
            )}
          </dd>
        </div>
        <div className="kpi kpi-hot">
          <dt>exploited</dt>
          <dd className="kpi-value">
            <span className="num">{formatKpi(stats.exploited)}</span>
            <span className="kpi-of num">/{formatKpi(stats.cves)}</span>
            {delta ? <Delta invert unit="exploited CVEs" value={delta.totals.exploited} /> : null}
          </dd>
          <dd className="kpi-viz">
            <Meter
              hot={stats.exploited}
              label={`${stats.exploited} of ${stats.cves} CVEs exploited.`}
              max={12}
              total={stats.cves}
            />
          </dd>
          <dd className="kpi-note">
            {stats.cves === 0
              ? "0 CVEs"
              : unconfirmed > 0
                ? `${formatCount(unconfirmed)} not confirmed`
                : "all states confirmed"}
          </dd>
        </div>
      </dl>
      {delta ? <p className="chart-note">Arrows show the change from {delta.label}.</p> : null}
    </Frame>
  )
}

function Leads({ themes, rows, days }: { themes: Theme[]; rows: ThemeRow[]; days: { label: string }[] }) {
  const byKey = new Map(rows.map((row) => [row.key, row]))
  return (
    <ol className="leads">
      {themes.slice(0, 3).map((theme, index) => {
        const row = byKey.get(theme.key)
        if (!row) return null
        const why = whyText(theme)
        const preview = previewCves(theme, 3)
        const style: Vars = { "--i": index }
        return (
          <li className="frame lead-card" key={theme.key} style={style}>
            <Corners />
            <p aria-hidden="true" className="lead-rank num">
              {pad(theme.rank)}
            </p>
            <h3 className="lead-title">
              <a href={`#theme-${theme.key}`} title={theme.name}>
                <span className="sr-only">Rank {theme.rank}: </span>
                {row.label}
              </a>
            </h3>
            <p className={why.clamp ? "lead-why is-clamped" : "lead-why"}>
              <KeepCves text={why.text} />
            </p>
            {preview.shown.length > 0 ? (
              <ul aria-label="CVEs" className="lead-cves">
                {preview.shown.map((cve) => (
                  <li key={cve.id}>
                    <code className={cve.flag === true ? "cve-chip is-hot" : "cve-chip"}>
                      <i aria-hidden="true" className={cveGlyph(cve.flag)} />
                      {cve.id}
                      <span className="sr-only"> {cve.tag.toLowerCase()}</span>
                    </code>
                  </li>
                ))}
                {preview.extra > 0 ? <li className="num muted">+{preview.extra}</li> : null}
              </ul>
            ) : (
              <p className="lead-cves muted">0 CVEs</p>
            )}
            <div className="lead-foot">
              <span className="lead-acc">
                <Bar value={row.share} />
                <span className="num">{formatCount(row.accounts)}</span>
                <span className="muted">accounts</span>
              </span>
              <Spark label={sparkSummary(row.spark, days)} series={row.spark} />
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function Funnel({ title, stages }: { title: string; stages: FunnelStage[] }) {
  const peak = Math.max(1, ...stages.map((stage) => stage.count))
  return (
    <figure className="funnel-block">
      <figcaption className="funnel-head">{title}</figcaption>
      <ol className="funnel">
        {stages.map((stage, index) => {
          const style: Vars = { "--i": index }
          const drop = index === 0 || stage.drop === 0 ? "" : `${stage.drop > 0 ? "−" : "+"}${formatCount(Math.abs(stage.drop))}`
          return (
            <li key={stage.label} style={style}>
              <span className="row-label">{stage.label}</span>
              <Bar bracket tone={index === stages.length - 1 ? "a" : "m"} value={stage.count / peak} />
              <span className={index === stages.length - 1 ? "num t-a" : "num"}>{formatCount(stage.count)}</span>
              <span className="num drop">{drop}</span>
            </li>
          )
        })}
      </ol>
    </figure>
  )
}

function Notes({ data }: { data: WeekData }) {
  const steps = methodSteps(data)
  const also = alsoObserved(data)
  const funnels = funnelModel(data)
  const removed = funnels.removed.reduce((sum, row) => sum + row.count, 0)
  const hidden = data.meta.inaccessible ?? []
  // One row per platform read, so a new platform shows without a code change.
  const captures = Object.entries(data.meta.capture).filter(
    (entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].trim() !== "",
  )
  const platforms = sourceFacets(data).platform
  return (
    <Box className="faq" title="notes">
      <details className="faq-item" id="method">
        <summary>
          <span>How we make this report</span>
          <i aria-hidden="true" className="plus" />
        </summary>
        <div className="faq-body">
          {steps.length > 0 ? (
            <Steps steps={steps} />
          ) : (
            <p className="prose-text">{data.meta.methodology}</p>
          )}
        </div>
      </details>
      {funnels.sources.length > 0 || funnels.comments.length > 0 ? (
        <details className="faq-item" id="funnel">
          <summary>
            <span>What we kept</span>
            <i aria-hidden="true" className="plus" />
          </summary>
          <div className="faq-body funnels">
            {funnels.sources.length > 0 ? <Funnel stages={funnels.sources} title="sources" /> : null}
            {funnels.comments.length > 0 ? <Funnel stages={funnels.comments} title="comments" /> : null}
            {removed > 0 ? (
              <p className="chart-note">
                We removed {formatCount(removed)} comments:{" "}
                {funnels.removed.map((row) => `${row.label} ${formatCount(row.count)}`).join(" · ")}.
              </p>
            ) : null}
          </div>
        </details>
      ) : null}
      <details className="faq-item" id="capture">
        <summary>
          <span>Dates and counts</span>
          <i aria-hidden="true" className="plus" />
        </summary>
        <div className="faq-body">
          <dl className="spec">
            <div>
              <dt>window</dt>
              <dd>
                <DateUnits text={`${data.meta.window.start} to ${data.meta.window.end}`} />
              </dd>
            </div>
            {captures.map(([platform, text]) => (
              <div key={`capture-${platform}`}>
                <dt>{platform.toLowerCase()} capture</dt>
                <dd>
                  <DateUnits text={text} />
                </dd>
              </div>
            ))}
            {platforms.map((entry) => (
              <div key={`count-${entry.key}`}>
                <dt>
                  {entry.key.toLowerCase()} {platformUnits(entry.key).noun}
                </dt>
                <dd className="num">{formatCount(entry.count)}</dd>
              </div>
            ))}
            <div>
              <dt>comments</dt>
              <dd className="num">{formatCount(data.meta.counts.comments_analysed_top_themes)}</dd>
            </div>
            {data.meta.generated ? (
              <div>
                <dt>generated</dt>
                <dd>
                  <DateUnits text={data.meta.generated} />
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      </details>
      {hidden.length > 0 ? (
        <details className="faq-item" id="not-read">
          <summary>
            <span>Limits</span>
            <span className="num muted">{hidden.length}</span>
            <i aria-hidden="true" className="plus" />
          </summary>
          <div className="faq-body">
            <ul className="dash-list">
              {hidden.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        </details>
      ) : null}
      {also.length > 0 ? (
        <details className="faq-item" id="also-observed">
          <summary>
            <span>Also seen</span>
            <span className="num muted">{also.length}</span>
            <i aria-hidden="true" className="plus" />
          </summary>
          <div className="faq-body">
            <ul className="dash-list">
              {also.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        </details>
      ) : null}
    </Box>
  )
}

export function WeekView({ data, previous = null }: { data: WeekData; previous?: WeekData | null }) {
  const themes = themesByRank(data)
  const rows = themeRows(data)
  const stats = headlineStats(data)
  const cves = cveTableRows(data)
  const days = windowDays(data)
  const delta = weekDelta(data, previous)
  const exploited = cves.filter((row) => row.flag === true).length
  const unconfirmed = cves.filter((row) => row.flag === null).length
  const notExploited = cves.filter((row) => row.flag === false).length
  const toc: TocItem[] = [
    { id: "overview", label: "overview" },
    { id: "cves", label: "cves", count: cves.length },
    { id: "signals", label: "charts" },
    {
      id: "themes",
      label: "themes",
      count: themes.length,
      sub: rows.map((row) => ({ id: `theme-${row.key}`, label: row.label, count: formatCount(row.accounts) })),
    },
    { id: "sources", label: "sources", count: formatCount(data.sources.length) },
    { id: "notes", label: "notes" },
  ]

  return (
    <>
      <SiteHeader crumb={windowLabel(data)} toc={toc} />
      <div className="shell has-side">
        <div className="side">
          <Toc items={toc} label="Sections" />
        </div>
        <main className="main" id="main" tabIndex={-1}>
          <Hero kicker={data.meta.title} lead={<KeepCves text={heroLead(data)} />} title={windowLabel(data)}>
            {data.meta.generated ? (
              <span>
                generated <span className="date-unit">{data.meta.generated}</span>
              </span>
            ) : null}
          </Hero>

          <section aria-labelledby="overview-title" className="sec sec-first" id="overview">
            <h2 className="sr-only" id="overview-title">
              Overview
            </h2>
            <Kpis data={data} delta={delta} rows={rows} />
            {themes.length > 0 ? (
              <>
                <p className="kicker sub-kicker">top {Math.min(3, themes.length)}</p>
                <Leads days={days} rows={rows} themes={themes} />
                {themes.slice(0, 3).some((theme) => previewCves(theme).shown.length > 0) ? (
                  <CveKey className="leads-key" />
                ) : null}
              </>
            ) : null}
          </section>

          <section aria-labelledby="cves-title" className="sec" id="cves">
            <SectionHead
              id="cves"
              kicker="cves"
              lead={
                cves.length > 0
                  ? "The sources give the state of each CVE. The order is by state, then by theme rank."
                  : undefined
              }
              title={
                cves.length > 0
                  ? `${formatCount(exploited)} of ${plural(cves.length, "CVE")} exploited`
                  : "No CVEs this week"
              }
            />
            {cves.length > 0 ? (
              <Frame className="cve-frame" title="cve states">
                <div className="cve-meter">
                  <Meter
                    hot={exploited}
                    label={`${exploited} of ${cves.length} CVEs exploited.`}
                    max={20}
                    total={cves.length}
                  />
                  <Legend
                    parts={(
                      [
                        { label: "exploited", tone: "d", value: exploited },
                        { label: "not confirmed", tone: "f", value: unconfirmed },
                        { label: "not exploited", tone: "m", value: notExploited },
                      ] satisfies Part[]
                    ).filter((part) => part.value > 0)}
                  />
                </div>
                <CveRows rows={cves} themeHref />
              </Frame>
            ) : (
              <Callout title="no cves" type="note">
                <p>No source gives a CVE for these themes.</p>
              </Callout>
            )}
          </section>

          <section aria-labelledby="signals-title" className="sec" id="signals">
            <SectionHead
              id="signals"
              kicker="charts"
              title="Sources, accounts and comments per theme"
            />
            <Signals data={data} />
          </section>

          <section aria-labelledby="themes-title" className="sec" id="themes">
            <SectionHead
              action={
                themes.length > 1 ? (
                  <button className="btn js-only" data-expand-all data-on="false" type="button">
                    <ChevronsUpDown aria-hidden="true" size={14} strokeWidth={1.75} />
                    <span className="when-off">open all</span>
                    <span className="when-on">close all</span>
                  </button>
                ) : null
              }
              id="themes"
              kicker="themes"
              lead="Open a theme to see its summary, CVEs, key sources and comments."
              title={`${plural(themes.length, "theme")}, most accounts first`}
            />
            <ThemeBoard data={data} delta={delta} rows={rows} themes={themes} />
            {delta && delta.dropped.length > 0 ? (
              <p className="chart-note">
                Themes from {delta.label} that are not in this report: {delta.dropped.map((entry) => entry.label).join(", ")}.
              </p>
            ) : null}
          </section>

          <section aria-labelledby="sources-title" className="sec" id="sources">
            <SectionHead
              id="sources"
              kicker="sources"
              lead="Each source is a post or a video."
              title={plural(data.sources.length, "source")}
            />
            <Sources data={data} />
          </section>

          <section aria-labelledby="notes-title" className="sec" id="notes">
            <SectionHead id="notes" kicker="notes" title="Method and limits" />
            <Notes data={data} />
          </section>
        </main>
      </div>
      <SiteFooter>
        <p>
          {plural(stats.themes, "theme")} from {plural(stats.sources, "source")}
          {data.meta.generated ? (
            <>
              {" "}
              · generated <span className="date-unit">{data.meta.generated}</span>
            </>
          ) : null}
        </p>
      </SiteFooter>
    </>
  )
}
