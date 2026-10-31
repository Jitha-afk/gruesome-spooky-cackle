import { ArrowDownUp, Search } from "lucide-react"
import { Box } from "@/components/frame"
import { Bar } from "@/components/glyph"
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

function Chips({ name, facets }: { name: "type" | "platform"; facets: Facet[] }) {
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
          <i aria-hidden="true" className="chip-box" />
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
  const labels = new Map(rankRows(data).map((row) => [row.key, row.label]))
  const themes = new Set(data.themes.map((theme) => theme.key))
  const peak = Math.log10(1 + Math.max(1, ...rows.map((source) => source.engagement)))
  return (
    <>
      <div className="src-tools js-only">
        <Chips facets={facets.type} name="type" />
        <Chips facets={facets.platform} name="platform" />
        <div className="src-search">
          <label className="search">
            <Search aria-hidden="true" size={14} strokeWidth={1.75} />
            <span className="sr-only">Search the sources</span>
            <input autoComplete="off" data-search-input placeholder="search" spellCheck={false} type="search" />
          </label>
          <button className="btn" data-on="false" data-sort type="button">
            <ArrowDownUp aria-hidden="true" size={14} strokeWidth={1.75} />
            <span className="when-off">most engagement</span>
            <span className="when-on">least engagement</span>
          </button>
        </div>
        <p aria-hidden="true" className="src-count num" data-count>
          {formatCount(rows.length)} of {formatCount(rows.length)} sources
        </p>
        <p aria-live="polite" className="sr-only" data-said>
          {formatCount(rows.length)} of {formatCount(rows.length)} sources
        </p>
      </div>
      <Box className="src-box" title="sources">
        <table className="src">
          <caption className="sr-only">Sources, most engagement first.</caption>
          <thead>
            <tr>
              <th scope="col">date</th>
              <th scope="col">account</th>
              <th scope="col">source</th>
              <th className="src-eng" scope="col">
                engagement
              </th>
            </tr>
          </thead>
          <tbody data-src-body id="src-rows">
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
                    <Bar value={Math.log10(1 + Math.max(0, source.engagement)) / peak} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <p className="src-empty" data-empty hidden>
          0 sources. Clear the search or select more types and platforms.
        </p>
      </Box>
      {rows.length > SOURCE_LIMIT ? (
        <button aria-controls="src-rows" aria-expanded="false" className="btn btn-more js-only" data-more type="button">
          <span className="when-closed">
            show all <span data-more-count>{formatCount(rows.length)}</span>
          </span>
          <span className="when-open">show fewer</span>
        </button>
      ) : null}
    </>
  )
}
