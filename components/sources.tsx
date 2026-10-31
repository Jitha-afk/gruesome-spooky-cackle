import { ArrowDownUp, Search } from "lucide-react"
import { Box } from "@/components/frame"
import { Bar, Key } from "@/components/glyph"
import { platformTone, typeTone } from "@/components/tones"
import {
  formatCount,
  platformUnits,
  rankRows,
  safeHref,
  sourceFacets,
  sourceRows,
  type Facet,
  type Source,
  type WeekData,
} from "@/lib/brief.mjs"

/** Rows shown before "show all". site.js uses the same number. */
export const SOURCE_LIMIT = 12

function metricsText(source: Source) {
  return Object.entries(source.metrics ?? {})
    .filter(([, value]) => typeof value === "number" && Number.isFinite(value))
    .map(([key, value]) => `${key} ${formatCount(value)}`)
    .join(" · ")
}

function Chips({ name, facets, tone }: { name: "type" | "platform"; facets: Facet[]; tone: (key: string) => ReturnType<typeof typeTone> }) {
  return (
    <fieldset className="chips">
      <legend className="kicker">{name}</legend>
      {facets.map((entry) => (
        <label className="chip" key={entry.key}>
          <input
            defaultChecked
            type="checkbox"
            value={entry.key}
            {...(name === "type" ? { "data-filter-type": "" } : { "data-filter-platform": "" })}
          />
          <Key tone={tone(entry.key)} />
          <span>{entry.key}</span>
          <span className="num">{formatCount(entry.count)}</span>
        </label>
      ))}
    </fieldset>
  )
}

/** Filterable source index. Filters need JS. Without it every row shows. */
export function Sources({ data }: { data: WeekData }) {
  const rows = sourceRows(data)
  const facets = sourceFacets(data)
  const typeKeys = facets.type.map((entry) => entry.key)
  const platformKeys = facets.platform.map((entry) => entry.key)
  const labels = new Map(rankRows(data).map((row) => [row.key, row.label]))
  const themes = new Set(data.themes.map((theme) => theme.key))
  const peak = Math.log10(1 + Math.max(1, ...rows.map((source) => source.engagement)))
  return (
    <>
      <div className="src-tools js-only">
        <Chips facets={facets.type} name="type" tone={(key) => typeTone(key, typeKeys)} />
        <Chips facets={facets.platform} name="platform" tone={(key) => platformTone(key, platformKeys)} />
        <div className="src-search">
          <label className="search">
            <Search aria-hidden="true" size={14} strokeWidth={1.75} />
            <span className="sr-only">Search the sources</span>
            <input autoComplete="off" data-search-input placeholder="search" spellCheck={false} type="search" />
          </label>
          <button aria-pressed="false" className="btn" data-sort type="button">
            <ArrowDownUp aria-hidden="true" size={14} strokeWidth={1.75} />
            <span className="when-off">most engaged</span>
            <span className="when-on">least engaged</span>
          </button>
        </div>
        <p aria-live="polite" className="src-count num" data-count>
          {formatCount(rows.length)} of {formatCount(rows.length)}
        </p>
      </div>
      <Box className="src-box" title="sources">
        <table className="src">
          <caption className="sr-only">Sources, most engaged first.</caption>
          <thead>
            <tr>
              <th scope="col">date</th>
              <th scope="col">account</th>
              <th scope="col">post</th>
              <th className="src-eng" scope="col">
                engagement
              </th>
            </tr>
          </thead>
          <tbody data-src-body>
            {rows.map((source) => {
              const href = safeHref(source.url)
              const label = labels.get(source.theme)
              const unit = platformUnits(source.platform).metric
              const metrics = metricsText(source)
              return (
                <tr
                  data-engagement={String(source.engagement)}
                  data-platform={String(source.platform).trim()}
                  data-type={String(source.type).trim()}
                  key={source.id}
                >
                  <td className="src-date date-unit">{String(source.date_ist).slice(0, 10)}</td>
                  <td className="src-acc">
                    <span className="src-name">{source.account}</span>
                    <span className="src-kind">
                      {source.type} · {source.platform}
                    </span>
                  </td>
                  <td className="src-post">
                    <span className="src-meta-m">
                      {source.account} · {source.platform} · <span className="date-unit">{String(source.date_ist).slice(0, 10)}</span>
                    </span>
                    {href ? (
                      <a className="src-text" dir="auto" href={href} rel="noreferrer">
                        {source.text}
                      </a>
                    ) : (
                      <span className="src-text" dir="auto">
                        {source.text}
                      </span>
                    )}
                    {label ? (
                      themes.has(source.theme) ? (
                        <a className="src-theme" href={`#theme-${source.theme}`}>
                          {label}
                        </a>
                      ) : (
                        <span className="src-theme">{label}</span>
                      )
                    ) : null}
                  </td>
                  <td className="src-eng" title={metrics || undefined}>
                    <span className="num">{formatCount(source.engagement)}</span>
                    <span className="sr-only">
                      {" "}
                      {unit}
                      {metrics ? `. ${metrics}` : ""}
                    </span>
                    <Bar tone="b" value={Math.log10(1 + Math.max(0, source.engagement)) / peak} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <p className="src-empty" data-empty hidden>
          No source matches. Clear the search or turn a filter back on.
        </p>
      </Box>
      {rows.length > SOURCE_LIMIT ? (
        <button aria-expanded="false" className="btn btn-more js-only" data-more type="button">
          <span className="when-closed">
            show all <span data-more-count>{formatCount(rows.length)}</span>
          </span>
          <span className="when-open">show fewer</span>
        </button>
      ) : null}
    </>
  )
}
