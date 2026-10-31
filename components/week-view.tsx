import { Callout } from "@/registry/default/callout/callout"
import { GraphRank } from "@/registry/default/graph-rank/graph-rank"
import { GraphSpec } from "@/registry/default/graph-spec/graph-spec"
import { GraphStack } from "@/registry/default/graph-stack/graph-stack"
import { GraphTable } from "@/registry/default/graph-table/graph-table"
import { Header } from "@/components/header"
import {
  commentModel,
  cveViews,
  formatCount,
  rankRows,
  shortLabel,
  sourceRows,
  splitCounts,
  themesByRank,
  weekSummary,
  type Source,
  type Theme,
  type WeekData,
} from "@/lib/brief.mjs"

const METRICS = ["likes", "reposts", "replies", "quotes", "impressions", "views"] as const

function metricCell(source: Source, key: string) {
  const value = source.metrics[key]
  return typeof value === "number" ? formatCount(value) : ""
}

function CveList({ theme, basis }: { theme: Theme; basis: boolean }) {
  const rows = cveViews(theme)
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
    </ul>
  )
}

function Shot({ source }: { source: Source }) {
  if (typeof source.image === "string" && source.image) {
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
  return (
    <a className="shot-frame shot-missing graph-frame" href={source.url}>
      This post has no image.
    </a>
  )
}

function ThemeCard({ theme, sources, open }: { theme: Theme; sources: Map<string, Source>; open: boolean }) {
  const comments = commentModel(theme)
  const charted = comments.filter((row) => row.positive + row.neutral + row.negative > 0)
  const body = (
    <>
      {theme.summary ? <p>{theme.summary}</p> : null}
      {theme.why ? <p>{theme.why}</p> : null}
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
      <div>
        <h3>Accounts</h3>
        <p className="accounts">Vendors: {theme.vendors.join(", ")}</p>
        <p className="accounts">Media: {theme.media.join(", ")}</p>
        <p className="accounts">Independent: {theme.independent.join(", ")}</p>
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
                  {source.date_ist} {source.account}
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
            label: row.label,
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
                  <a href={sample.href}>{sample.text}</a>
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
          <span className="when-closed">Show this theme.</span>
          <span className="when-open">Hide this theme.</span>
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
  const splits = splitCounts(data.sources)
  const rows = sourceRows(data)
  const align = ["left", "left", "left", "right", "right", "right", "right", "right", "right", "right"] as const

  return (
    <main className="site">
      <Header
        kicker={`${data.meta.window.start} to ${data.meta.window.end}`}
        summary={weekSummary(top)}
        title={data.meta.title}
      />

      <section>
        <h2>Top 3 themes</h2>
        <p>The first three themes this week.</p>
        <div className="top-list">
          {themes.slice(0, 3).map((theme) => (
            <article className="top-theme graph-frame" key={theme.key}>
              <p>
                <a href={`#theme-${theme.key}`} title={theme.name}>
                  {theme.rank}. {shortLabel(theme.name, theme.short_name)}
                </a>
              </p>
              <p className="why-line">{theme.why}</p>
              <CveList basis={false} theme={theme} />
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2>In numbers</h2>
        <p>Posts, videos, comments and capture time.</p>
        <GraphSpec
          className="ledger"
          rows={[
            { label: "Posts", value: formatCount(data.meta.counts.x_posts), accent: true },
            { label: "Videos", value: formatCount(data.meta.counts.youtube_videos) },
            { label: "Comments analysed", value: formatCount(data.meta.counts.comments_analysed_top_themes) },
            { label: "X capture", value: data.meta.capture.x },
            { label: "YouTube capture", value: data.meta.capture.youtube },
          ]}
          title="This week"
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
          title="Accounts"
        />
      </section>

      <section>
        <h2>Splits</h2>
        <p>Vendor, media and independent sources.</p>
        <GraphStack
          rows={[
            {
              label: "Sources",
              segments: [
                { label: "vendor", value: splits.type.vendor },
                { label: "media", value: splits.type.media },
                { label: "independent", value: splits.type.independent },
              ],
            },
          ]}
          title="By type"
        />
        <p>X and YouTube sources.</p>
        <GraphStack
          palette="duo"
          rows={[
            {
              label: "Sources",
              segments: [
                { label: "X", value: splits.platform.X },
                { label: "YouTube", value: splits.platform.YouTube },
              ],
            },
          ]}
          title="By platform"
        />
      </section>

      <section>
        <h2>Themes</h2>
        <p>Open a theme to read the detail.</p>
        <div className="theme-list">
          {themes.map((theme, index) => (
            <ThemeCard key={theme.key} open={index < 3} sources={sources} theme={theme} />
          ))}
        </div>
      </section>

      <section>
        <h2>Sources</h2>
        <p>Filter the list. Search the text. Sort by engagement.</p>
        <div className="filters">
          <fieldset>
            <legend>Source type.</legend>
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
            <legend>Platform.</legend>
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
            Show lowest first.
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
          <span className="when-closed">Show the method.</span>
          <span className="when-open">Hide the method.</span>
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
