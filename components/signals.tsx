import type { CSSProperties } from "react"
import { Frame } from "@/components/frame"
import { Bar, Legend, Split, type Part } from "@/components/glyph"
import { SENTIMENT, percent, platformTone, typeTone } from "@/components/tones"
import {
  formatCount,
  rankRows,
  sentimentTotals,
  sourceFacets,
  themeRows,
  windowDays,
  type ThemeRow,
  type WeekData,
} from "@/lib/brief.mjs"
import { logIntensityLevel } from "@/lib/scale.mjs"

type Vars = CSSProperties & Record<`--${string}`, string | number>

// Order matters: CSS pairs the nth tab input with the nth panel.
const TABS = [
  { id: "days", label: "by day" },
  { id: "accounts", label: "accounts" },
  { id: "coverage", label: "coverage" },
  { id: "sentiment", label: "sentiment" },
] as const

function ThemeLink({ row }: { row: ThemeRow }) {
  return (
    <a className="row-label" href={`#theme-${row.key}`} title={row.name}>
      {row.label}
    </a>
  )
}

function Accounts({ data }: { data: WeekData }) {
  const rows = rankRows(data)
  const themes = new Set(data.themes.map((theme) => theme.key))
  const peak = Math.max(1, ...rows.map((row) => row.accounts))
  const others = rows.filter((row) => !themes.has(row.key)).length
  return (
    <Frame className="chart" title="accounts per theme">
      <ol className="rank-list">
        {rows.map((row, index) => {
          const theme = themes.has(row.key)
          const style: Vars = { "--i": index }
          return (
            <li className={theme ? undefined : "is-other"} key={row.key} style={style}>
              {theme ? (
                <a className="row-label" href={`#theme-${row.key}`} title={row.title}>
                  {row.label}
                </a>
              ) : (
                <span className="row-label" title={row.title}>
                  {row.label}
                </span>
              )}
              <Bar bracket tone={theme ? "a" : "m"} value={row.accounts / peak} />
              <span className="num">{formatCount(row.accounts)}</span>
            </li>
          )
        })}
      </ol>
      {others > 0 ? (
        <p className="chart-note">
          <span aria-hidden="true" className="key t-m" /> Muted rows were ranked but did not make a theme.
        </p>
      ) : null}
    </Frame>
  )
}

function Days({ data, rows }: { data: WeekData; rows: ThemeRow[] }) {
  const days = windowDays(data)
  const index = new Map(days.map((day, at) => [day.iso, at]))
  const totals = days.map(() => 0)
  for (const source of data.sources) {
    const at = index.get(String(source.date_ist).slice(0, 10))
    if (at != null) totals[at] += 1
  }
  const peak = Math.max(1, ...rows.flatMap((row) => row.spark))
  const all = totals.reduce((sum, value) => sum + value, 0)
  return (
    <Frame className="chart" title="sources per day">
      <div className="heat-scroll">
        <table className="heat">
          <caption className="sr-only">Sources per theme for each IST day of the window.</caption>
          <thead>
            <tr>
              <th scope="col">
                <span className="sr-only">Theme</span>
              </th>
              {days.map((day) => (
                <th key={day.iso} scope="col" title={day.iso}>
                  <span aria-hidden="true">{day.label.slice(0, 2)}</span>
                  <span className="sr-only">
                    {day.label} {day.iso}
                  </span>
                </th>
              ))}
              <th className="heat-sum" scope="col">
                all
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <th scope="row">
                  <ThemeLink row={row} />
                </th>
                {row.spark.map((value, at) => (
                  <td
                    data-l={logIntensityLevel(value, peak)}
                    key={days[at]?.iso ?? at}
                    title={`${row.label}, ${days[at]?.label ?? ""} ${days[at]?.iso ?? ""}: ${value}`}
                  >
                    {value > 0 ? value : <span className="sr-only">0</span>}
                  </td>
                ))}
                <td className="heat-sum num">{formatCount(row.spark.reduce((sum, value) => sum + value, 0))}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">all sources</th>
              {totals.map((value, at) => (
                <td className="num" key={days[at]?.iso ?? at}>
                  {formatCount(value)}
                </td>
              ))}
              <td className="heat-sum num">{formatCount(all)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="chart-note heat-key">
        <span>fewer</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <i aria-hidden="true" data-l={level} key={level} />
        ))}
        <span>more</span>
        <span className="muted">log scale · IST days</span>
      </p>
    </Frame>
  )
}

function Coverage({ data, rows }: { data: WeekData; rows: ThemeRow[] }) {
  const facets = sourceFacets(data)
  const platformKeys = facets.platform.map((entry) => entry.key)
  const kinds = ["vendor", "media", "independent"] as const
  const outlets = (row: ThemeRow): Part[] =>
    kinds.map((kind) => ({ label: kind, tone: typeTone(kind, [...kinds]), value: row.mix[kind] }))
  const platforms = (row: ThemeRow): Part[] =>
    row.platforms.map((entry) => ({ label: entry.key, tone: platformTone(entry.key, platformKeys), value: entry.count }))
  const sum = (pick: (row: ThemeRow) => Part[]) => {
    const first = rows[0] ? pick(rows[0]) : []
    return first.map((part, at) => ({ ...part, value: rows.reduce((total, row) => total + (pick(row)[at]?.value ?? 0), 0) }))
  }
  const describe = (parts: Part[]) => parts.map((part) => `${part.value} ${part.label}`).join(", ")
  return (
    <Frame className="chart" title="who covered it">
      <div className="cov">
        <div aria-hidden="true" className="cov-head">
          <span />
          <span>named outlets by type</span>
          <span>sources by platform</span>
        </div>
        <ul className="cov-list">
          {rows.map((row) => (
            <li key={row.key}>
              <ThemeLink row={row} />
              <span className="cov-cell">
                <Split label={`${row.label} named outlets: ${describe(outlets(row))}.`} parts={outlets(row)} />
                <span aria-hidden="true" className="num">
                  {outlets(row)
                    .map((part) => part.value)
                    .join("·")}
                </span>
              </span>
              <span className="cov-cell">
                <Split label={`${row.label} sources: ${describe(platforms(row))}.`} parts={platforms(row)} />
                <span aria-hidden="true" className="num">
                  {platforms(row)
                    .map((part) => part.value)
                    .join("·")}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="chart-legends">
        <Legend parts={sum(outlets)} />
        <Legend parts={sum(platforms)} />
      </div>
    </Frame>
  )
}

function Sentiment({ data, rows }: { data: WeekData; rows: ThemeRow[] }) {
  const totals = sentimentTotals(data)
  const all = totals.positive + totals.neutral + totals.negative + totals.unclassified
  const parts = (value: ThemeRow["sentiment"]): Part[] =>
    SENTIMENT.map((entry) => ({ label: entry.key, tone: entry.tone, value: value[entry.key] }))
  const describe = (value: ThemeRow["sentiment"]) =>
    SENTIMENT.map((entry) => `${value[entry.key]} ${entry.key}`).join(", ")
  return (
    <Frame className="chart" title="comment sentiment">
      {all === 0 ? (
        <p className="chart-note">No comments were analysed this week.</p>
      ) : (
        <>
          <div className="sent-total">
            <Split className="split-lg" label={`All comments: ${describe(totals)}.`} parts={parts(totals)} />
            <Legend parts={parts(totals)} />
          </div>
          <ul className="sent-list">
            {rows.map((row) => (
              <li key={row.key}>
                <ThemeLink row={row} />
                <Split label={`${row.label}: ${describe(row.sentiment)}.`} parts={parts(row.sentiment)} />
                <span className="num">{formatCount(row.comments)}</span>
                <span className="num muted">{percent(row.sentiment.negative, row.comments)}% neg</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Frame>
  )
}

/** Four charts behind CSS radio tabs. Without :has() every panel shows. */
export function Signals({ data }: { data: WeekData }) {
  const rows = themeRows(data)
  const style: Vars = { "--n": TABS.length }
  return (
    <div aria-label="Signals view" className="tabs" role="group" style={style}>
      {TABS.map((tab, index) => (
        <input
          aria-controls={`panel-${tab.id}`}
          className="tab-input"
          defaultChecked={index === 0}
          id={`tab-${tab.id}`}
          key={tab.id}
          name="signals"
          type="radio"
          value={tab.id}
        />
      ))}
      <div className="tab-list">
        {TABS.map((tab, index) => {
          const vars: Vars = { "--i": index }
          return (
            <label htmlFor={`tab-${tab.id}`} key={tab.id} style={vars}>
              {tab.label}
            </label>
          )
        })}
        <span aria-hidden="true" className="tab-thumb" />
      </div>
      <div className="tab-panels">
        <div aria-label="Sources per day" className="tab-panel" id="panel-days" role="region">
          <Days data={data} rows={rows} />
        </div>
        <div aria-label="Accounts per theme" className="tab-panel" id="panel-accounts" role="region">
          <Accounts data={data} />
        </div>
        <div aria-label="Coverage" className="tab-panel" id="panel-coverage" role="region">
          <Coverage data={data} rows={rows} />
        </div>
        <div aria-label="Comment sentiment" className="tab-panel" id="panel-sentiment" role="region">
          <Sentiment data={data} rows={rows} />
        </div>
      </div>
    </div>
  )
}
