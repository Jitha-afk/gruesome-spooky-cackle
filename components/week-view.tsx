import { Callout } from "@/registry/default/callout/callout"
import { GraphHeatmap } from "@/registry/default/graph-heatmap/graph-heatmap"
import { GraphRank } from "@/registry/default/graph-rank/graph-rank"
import { GraphSpark } from "@/registry/default/graph-spark/graph-spark"
import { GraphSpec } from "@/registry/default/graph-spec/graph-spec"
import { GraphStack } from "@/registry/default/graph-stack/graph-stack"
import { GraphStat } from "@/registry/default/graph-stat/graph-stat"
import { GraphTable } from "@/registry/default/graph-table/graph-table"
import { GraphWaffle } from "@/registry/default/graph-waffle/graph-waffle"
import { Header } from "@/components/header"
import {
  commentModel,
  coverageModels,
  cveTableRows,
  cveViews,
  formatCount,
  headlineStats,
  heatmapModel,
  previewCves,
  rankRows,
  sentimentTotals,
  shortLabel,
  sourceRows,
  sparkSeries,
  themesByRank,
  waffleParts,
  weekSummary,
  whyText,
  type Source,
  type Theme,
  type WeekData,
} from "@/lib/brief.mjs"

const METRICS = ["likes", "reposts", "replies", "quotes", "impressions", "views"] as const

function metricCell(source: Source, key: string) {
  const value = source.metrics[key]
  return typeof value === "number" ? formatCount(value) : ""
}

function AccountLine({ label, names }: { label: string; names: string[] }) {
  if (names.length === 0) return null
  return (
    <p className="accounts">
      {label}: {names.join(", ")}
    </p>
  )
}

function stackLabel(name: string, counts: string) {
  return (
    <span>
      {name}
      <span className="stack-counts">{counts}</span>
    </span>
  )
}

function CveList({
  theme,
  basis,
  limit,
  moreHref,
}: {
  theme: Theme
  basis: boolean
  limit?: number
  moreHref?: string
}) {
  const preview = previewCves(theme, limit)
  const rows = limit == null ? cveViews(theme) : preview.shown
  const extra = limit == null ? 0 : preview.extra
  if (rows.length === 0) return null
  return (
    <ul className="cves">
      {rows.map((row) => (
        <li className="cve" key={row.id}>
          <span>{row.id}</span>
          <span className={row.tag === "EXPLOITED" ? "tag tag-hot" : "tag tag-muted"}>[ {row.tag} ]</span>
          {basis && row.basis ? <span className="basis">{row.basis}</span> : null}
        </li>
      ))}
      {extra > 0 && moreHref ? (
        <li>
          <a href={moreHref}>+{extra} more</a>
        </li>
      ) : null}
    </ul>
  )
}

function Shot({ source }: { source: Source }) {
  if (typeof source.image !== "string" || !source.image) return null
  return (
    <figure className="shot">
      <a className="shot-frame graph-frame" href={source.url}>
        <img alt="" decoding="async" height={360} loading="lazy" src={source.image} width={640} />
      </a>
      <figcaption>
        Credit: <a href={source.url}>{source.account}</a>
      </figcaption>
    </figure>
  )
}

function ThemeCard({
  theme,
  sources,
  open,
  spark,
}: {
  theme: Theme
  sources: Map<string, Source>
  open: boolean
  spark: number[]
}) {
  const comments = commentModel(theme)
  const charted = comments.filter((row) => row.positive + row.neutral + row.negative > 0)
  const body = (
    <>
      {theme.summary ? <p>{theme.summary}</p> : null}
      {theme.why ? (
        <>
          <h3>Why it is important</h3>
          <p>{theme.why}</p>
        </>
      ) : null}
      <div>
        <h3>Affected</h3>
        <p>Products: {theme.affected.products}</p>
        <p>Sectors: {theme.affected.sectors}</p>
        <p>Regions: {theme.affected.regions}</p>
      </div>
      <CveList basis theme={theme} />
      <GraphSpec
        className="coverage"
        rows={[
          { label: "Accounts", value: formatCount(theme.distinct_accounts), accent: true },
          { label: "X interactions", value: formatCount(theme.x_engagement) },
          { label: "YouTube views", value: formatCount(theme.youtube_views) },
        ]}
        title="Coverage"
      />
      <GraphSpark data={spark} palette="mono" title="By day" />
      <div>
        <h3>Accounts</h3>
        <AccountLine label="Vendors" names={theme.vendors} />
        <AccountLine label="Media" names={theme.media} />
        <AccountLine label="Independent" names={theme.independent} />
      </div>
      <div>
        <h3>Key items</h3>
        <div className="key-list">
          {theme.key_items.map((id) => {
            const source = sources.get(id)
            if (!source) return null
            return (
              <article className="key-item graph-frame" key={id}>
                <p className="item-meta">
                  <span className="date-unit">{source.date_ist}</span> {source.account}
                </p>
                <a href={source.url}>{source.text}</a>
                <Shot source={source} />
              </article>
            )
          })}
        </div>
      </div>
      {charted.length > 0 ? (
        <GraphStack
          className="comment-pulse"
          palette="multi"
          rows={charted.map((row) => ({
            label: `${row.label} (${row.positive + row.neutral + row.negative})`,
            segments: [
              { label: "positive", value: row.positive },
              { label: "neutral", value: row.neutral },
              { label: "negative", value: row.negative },
            ],
          }))}
          title="Comments"
        />
      ) : null}
      {comments.map((cluster) => (
        <div key={cluster.label}>
          <h3>{cluster.label}</h3>
          {cluster.unclassified > 0 ? <p>Unclassified comments: {formatCount(cluster.unclassified)}.</p> : null}
          {cluster.samples.length > 0 ? (
            <ul className="samples">
              {cluster.samples.map((sample, index) => (
                <li key={`${sample.href}-${index}`}>
                  <a dir="auto" href={sample.href}>
                    {sample.text}
                  </a>
                  {sample.date ? <span className="sample-date">{sample.date}</span> : null}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ))}
    </>
  )

  return (
    <article className="theme-card" id={`theme-${theme.key}`} {...(open ? {} : { "data-collapse": "" })}>
      <h3>
        {theme.rank}. {theme.name}
      </h3>
      {open ? null : (
        <button aria-expanded="false" data-collapse-toggle type="button">
          <span className="when-closed">Show this theme</span>
          <span className="when-open">Hide this theme</span>
        </button>
      )}
      {open ? body : <div data-collapse-body>{body}</div>}
    </article>
  )
}

export function WeekView({ data }: { data: WeekData }) {
  const themes = themesByRank(data)
  const top = themes[0]
  const sources = new Map(data.sources.map((source) => [source.id, source]))
  const coverage = coverageModels(data)
  const heat = heatmapModel(data)
  const stats = headlineStats(data)
  const cveRows = cveTableRows(data)
  const sentiment = sentimentTotals(data)
  const waffle = waffleParts(sentiment)
  const tone: Record<string, string> = {
    positive: "text-graph-accent",
    neutral: "text-graph-muted",
    negative: "text-graph-accent-3",
    unclassified: "text-graph-faint",
  }
  const rows = sourceRows(data)
  const align = ["left", "left", "left", "right", "right", "right", "right", "right", "right", "right"] as const

  return (
    <main className="site font-sans">
      <Header
        kicker={`${data.meta.window.start} to ${data.meta.window.end}`}
        summary={weekSummary(top)}
        title={data.meta.title}
      />

      <section>
        <h2>Top 3 themes</h2>
        <div className="top-list">
          {themes.slice(0, 3).map((theme) => {
            const why = whyText(theme)
            return (
              <article className="top-theme graph-frame" key={theme.key}>
                <p>
                  <a href={`#theme-${theme.key}`} title={theme.name}>
                    {theme.rank}. {shortLabel(theme.name, theme.short_name)}
                  </a>
                </p>
                <p className={why.clamp ? "why-line" : undefined}>{why.text}</p>
                <CveList basis={false} limit={3} moreHref={`#theme-${theme.key}`} theme={theme} />
                {cveViews(theme).length === 0 ? <p className="tag tag-muted">No CVE in the sources.</p> : null}
              </article>
            )
          })}
        </div>
      </section>

      <section>
        <h2>In numbers</h2>
        <p>Themes, sources, comments and exploited CVEs.</p>
        <GraphStat
          items={[
            { label: "Themes", value: formatCount(stats.themes), accent: true },
            { label: "Sources", value: formatCount(stats.sources) },
            { label: "Comments analysed", value: formatCount(stats.comments) },
            { label: "CVEs exploited", value: `${stats.exploited} / ${stats.cves}` },
          ]}
          title="This week"
        />
        <p>Capture time.</p>
        <GraphSpec
          className="ledger"
          rows={[
            { label: "Posts", value: formatCount(data.meta.counts.x_posts) },
            { label: "Videos", value: formatCount(data.meta.counts.youtube_videos) },
            { label: "X capture", value: data.meta.capture.x },
            { label: "YouTube capture", value: data.meta.capture.youtube },
          ]}
          title="Capture"
        />
        <p>These items were not read in full.</p>
        <Callout title="Not read">
          {data.meta.inaccessible.map((item, index) => (
            <p key={index}>{item}</p>
          ))}
        </Callout>
      </section>

      <section>
        <h2>Ranking</h2>
        <p>Accounts in each theme.</p>
        <GraphRank
          items={rankRows(data).map((row) => ({
            label: row.label,
            title: row.title,
            value: row.accounts,
          }))}
          palette="mono"
          title="Accounts"
        />
        <p>Sources per day.</p>
        <GraphHeatmap
          columns={heat.columns.map((day) => day.slice(0, 2))}
          palette="duo"
          rows={heat.rows}
          spoken={heat.columns}
          title="By day"
        />
      </section>

      <section>
        <h2>Coverage</h2>
        <p>Accounts by outlet type.</p>
        <GraphStack
          className="split-type"
          palette="multi"
          rows={coverage.accounts.map((row, index) => {
            const theme = themes[index]
            const name = theme ? shortLabel(theme.name, theme.short_name) : row.label
            const [v, m, i] = row.segments.map((segment) => segment.value)
            return {
              name,
              label: stackLabel(name, `${v} / ${m} / ${i}`),
              segments: row.segments,
            }
          })}
          title="By type"
        />
        <p>Sources by platform.</p>
        <GraphStack
          palette="multi"
          rows={coverage.platforms.map((row, index) => {
            const theme = themes[index]
            const name = theme ? shortLabel(theme.name, theme.short_name) : row.label
            const [x, yt] = row.segments.map((segment) => segment.value)
            return {
              name,
              label: stackLabel(name, `${x} / ${yt}`),
              segments: row.segments,
            }
          })}
          title="By platform"
        />
      </section>

      <section>
        <h2>CVEs</h2>
        <p>Each CVE has its own state.</p>
        <GraphTable
          align={["left", "left", "left", "left"]}
          className="cve-table"
          headers={["CVE", "Theme", "State", "Basis"]}
          rows={cveRows.map((row) => [
            row.id,
            row.theme,
            <span className={row.tag === "EXPLOITED" ? "tag tag-hot" : "tag tag-muted"} key={row.id}>
              [ {row.tag} ]
            </span>,
            row.basis,
          ])}
          title="CVEs"
        />
      </section>

      <section>
        <h2>Comments</h2>
        <p>Sentiment of analysed comments.</p>
        <GraphWaffle
          className="sentiment"
          description={`${formatCount(sentiment.positive)} positive, ${formatCount(sentiment.neutral)} neutral, ${formatCount(sentiment.negative)} negative, ${formatCount(sentiment.unclassified)} unclassified, of ${formatCount(sentiment.positive + sentiment.neutral + sentiment.negative + sentiment.unclassified)} comments.`}
          legend={
            <ul className="waffle-key">
              <li>
                <span aria-hidden="true" className="text-graph-accent">
                  █
                </span>
                <span>positive {formatCount(sentiment.positive)}</span>
              </li>
              <li>
                <span aria-hidden="true" className="text-graph-muted">
                  █
                </span>
                <span>neutral {formatCount(sentiment.neutral)}</span>
              </li>
              <li>
                <span aria-hidden="true" className="text-graph-accent-3">
                  █
                </span>
                <span>negative {formatCount(sentiment.negative)}</span>
              </li>
              <li>
                <span aria-hidden="true" className="text-graph-muted">
                  ░
                </span>
                <span>unclassified {formatCount(sentiment.unclassified)}</span>
              </li>
            </ul>
          }
          segments={waffle.map((part) => ({
            cells: part.cells,
            className: tone[part.key] ?? "text-graph-faint",
            glyph: part.key === "unclassified" ? "░" : undefined,
          }))}
          title="Sentiment"
        />
      </section>

      <section>
        <h2>Themes</h2>
        <p>Open a theme to read the detail.</p>
        <div className="theme-list">
          {themes.map((theme, index) => (
            <ThemeCard
              key={theme.key}
              open={index < 3}
              sources={sources}
              spark={sparkSeries(theme, data)}
              theme={theme}
            />
          ))}
        </div>
      </section>

      <section>
        <h2>Sources</h2>
        <p>Filter the list. Search the text. Sort by engagement.</p>
        <div className="filters">
          <fieldset>
            <legend>Source type</legend>
            <label>
              <input data-filter-type defaultChecked type="checkbox" value="vendor" />
              Vendor
            </label>
            <label>
              <input data-filter-type defaultChecked type="checkbox" value="media" />
              Media
            </label>
            <label>
              <input data-filter-type defaultChecked type="checkbox" value="independent" />
              Independent
            </label>
          </fieldset>
          <fieldset>
            <legend>Platform</legend>
            <label>
              <input data-filter-platform defaultChecked type="checkbox" value="X" />X
            </label>
            <label>
              <input data-filter-platform defaultChecked type="checkbox" value="YouTube" />
              YouTube
            </label>
          </fieldset>
          <label className="search-label">
            Search the source text.
            <input data-search-input type="search" />
          </label>
          <button data-sort type="button">
            Show lowest first
          </button>
        </div>
        <GraphTable
          align={[...align]}
          className="source-index"
          headers={["Date", "Account", "Text", "Likes", "Reposts", "Replies", "Quotes", "Impressions", "Views", "Engagement"]}
          rows={rows.map((source) => ({
            attrs: {
              "data-type": source.type,
              "data-platform": source.platform,
              "data-engagement": String(source.engagement),
            },
            cells: [
              source.date_ist,
              source.account,
              <a href={source.url} key={source.id}>
                {source.text}
              </a>,
              ...METRICS.map((key) => metricCell(source, key)),
              formatCount(source.engagement),
            ],
          }))}
          title="Sources"
        />
        <p data-empty hidden>
          No source matches.
        </p>
      </section>

      <section data-collapse>
        <h2>Method</h2>
        <button aria-expanded="false" data-collapse-toggle type="button">
          <span className="when-closed">Show the method</span>
          <span className="when-open">Hide the method</span>
        </button>
        <div data-collapse-body>
          <Callout title="Method">
            <p>{data.meta.methodology}</p>
          </Callout>
        </div>
      </section>
    </main>
  )
}
