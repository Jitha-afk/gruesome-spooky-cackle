import type { CSSProperties } from "react"
import { Box } from "@/components/frame"
import { Bar, Delta, Legend, Spark, Split, type Part } from "@/components/glyph"
import { Callout, KeepCves, Quote } from "@/components/prose"
import { SENTIMENT, cveGlyph, pad, plural } from "@/components/tones"
import {
  commentModel,
  cveViews,
  formatCount,
  nameDetail,
  platformUnits,
  safeHref,
  sparkSummary,
  themeActions,
  windowDays,
  type CommentView,
  type CveView,
  type Source,
  type Theme,
  type ThemeRow,
  type WeekData,
  type WeekDelta,
} from "@/lib/brief.mjs"

type Vars = CSSProperties & Record<`--${string}`, string | number>

const SHOWN_ITEMS = 3

export function CveRows({ rows, themeHref }: { rows: (CveView & { theme?: string; key?: string })[]; themeHref?: boolean }) {
  return (
    <ul className="cve-list">
      {rows.map((row) => (
        <li className={row.flag === true ? "cve is-hot" : "cve"} key={`${row.key ?? ""}-${row.id}`}>
          <code className="cve-id">{row.id}</code>
          <span className="tag">[ {row.tag} ]</span>
          {row.cvss != null ? <span className="cvss num">cvss {row.cvss.toFixed(1)}</span> : null}
          {themeHref && row.key ? (
            <a className="cve-theme" href={`#theme-${row.key}`}>
              {row.theme}
            </a>
          ) : null}
          {row.basis ? (
            <p className="basis">
              <KeepCves text={row.basis} />
            </p>
          ) : null}
          {row.advisory ? (
            <a className="advisory" href={row.advisory} rel="noreferrer">
              advisory
            </a>
          ) : null}
        </li>
      ))}
    </ul>
  )
}

const flagOrder = (flag: boolean | null) => (flag === true ? 0 : flag === null ? 1 : 2)

/** Exploited first, at most four glyphs, then exploited over cited. */
function CveGlyphs({ rows }: { rows: CveView[] }) {
  if (rows.length === 0)
    return (
      <span className="muted">
        <span aria-hidden="true">—</span>
        <span className="sr-only">0 CVEs.</span>
      </span>
    )
  const hot = rows.filter((row) => row.flag === true).length
  const shown = [...rows].sort((a, b) => flagOrder(a.flag) - flagOrder(b.flag)).slice(0, 4)
  return (
    <>
      <span aria-hidden="true" className="cve-glyphs">
        {shown.map((row) => (
          <i className={cveGlyph(row.flag)} key={row.id} />
        ))}
      </span>
      <span aria-hidden="true" className="num">
        <span className={hot > 0 ? "is-hot" : undefined}>{hot}</span>/{rows.length}
      </span>
      <span className="sr-only">
        {plural(rows.length, "CVE")}, {hot} exploited.
      </span>
    </>
  )
}

/** Key for the CVE glyphs. Decorative: each glyph's state is also in text. */
export function CveKey({ className }: { className?: string }) {
  return (
    <p aria-hidden="true" className={className ? `board-key ${className}` : "board-key"}>
      <span>
        <i className="g-hot" /> exploited
      </span>
      <span>
        <i className="g-open" /> not confirmed
      </span>
      <span>
        <i className="g-cold" /> not exploited
      </span>
    </p>
  )
}

function Item({ source }: { source: Source }) {
  const href = safeHref(source.url)
  const image = safeHref(source.image)
  const unit = platformUnits(source.platform).metric
  return (
    <li className="item">
      {image ? (
        <span aria-hidden="true" className="thumb">
          {/* Static export: thumbnails are remote and small, so a plain img is right. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt=""
            data-fallback={source.platform.slice(0, 2)}
            decoding="async"
            height={90}
            loading="lazy"
            referrerPolicy="no-referrer"
            src={image}
            width={160}
          />
        </span>
      ) : (
        <span aria-hidden="true" className="thumb thumb-none">
          {source.platform.slice(0, 2)}
        </span>
      )}
      <div className="item-body">
        <p className="item-meta">
          <span>{source.platform}</span>
          <span>{source.account}</span>
          <span className="date-unit">{source.date_ist}</span>
        </p>
        {href ? (
          <a className="item-text" dir="auto" href={href} rel="noreferrer">
            {source.text}
          </a>
        ) : (
          <p className="item-text" dir="auto">
            {source.text}
          </p>
        )}
        <p className="item-eng num">
          {formatCount(source.engagement)} {unit}
        </p>
      </div>
    </li>
  )
}

function Cluster({ cluster }: { cluster: CommentView }) {
  const total = cluster.positive + cluster.neutral + cluster.negative + cluster.unclassified
  const parts: Part[] = SENTIMENT.map((entry) => ({ label: entry.key, tone: entry.tone, value: cluster[entry.key] }))
  return (
    <details className="cluster">
      <summary>
        <span className="cluster-label">{cluster.label}</span>
        <Split label={parts.map((part) => `${part.value} ${part.label}`).join(", ")} parts={parts} />
        <span className="num">{formatCount(total)}</span>
        <i aria-hidden="true" className="plus" />
      </summary>
      <div className="cluster-body">
        {cluster.samples.length === 0 ? <p className="muted">No sample comments.</p> : null}
        {cluster.samples.map((sample, index) => (
          <Quote
            date={sample.date}
            href={safeHref(sample.href)}
            key={`${sample.href}-${index}`}
            label="parent post"
            text={sample.text}
          />
        ))}
      </div>
    </details>
  )
}

function Body({
  theme,
  row,
  data,
  sources,
  delta,
}: {
  theme: Theme
  row: ThemeRow
  data: WeekData
  sources: Map<string, Source>
  delta: WeekDelta | null
}) {
  const cves = cveViews(theme)
  const items = [...new Set(theme.key_items)]
    .map((id) => sources.get(id))
    .filter((source): source is Source => Boolean(source))
  const clusters = commentModel(theme)
  const actions = themeActions(theme)
  const days = windowDays(data)
  const change = delta?.themes[theme.key]
  const accountsTotal = theme.vendors.length + theme.media.length + theme.independent.length
  const sentiment: Part[] = SENTIMENT.map((entry) => ({ label: entry.key, tone: entry.tone, value: row.sentiment[entry.key] }))
  return (
    <div className="theme-body">
      <h3 className="sr-only">{theme.name}</h3>
      <div className="theme-cols">
        <div className="theme-prose">
          <p>
            <KeepCves text={theme.summary} />
          </p>
          {theme.why ? (
            <Callout title="why it is important" type="warning">
              <p>
                <KeepCves text={theme.why} />
              </p>
            </Callout>
          ) : null}
          {actions.length > 0 ? (
            <Callout title="what to do" type="tip">
              <ul>
                {actions.map((action, index) => (
                  <li key={index}>{action}</li>
                ))}
              </ul>
            </Callout>
          ) : null}
        </div>
        <div className="theme-facts">
          <dl className="spec">
            <div>
              <dt>products</dt>
              <dd>{theme.affected.products}</dd>
            </div>
            <div>
              <dt>sectors</dt>
              <dd>{theme.affected.sectors}</dd>
            </div>
            <div>
              <dt>regions</dt>
              <dd>{theme.affected.regions}</dd>
            </div>
          </dl>
          <dl className="spec spec-num">
            <div>
              <dt>accounts</dt>
              <dd>
                <span className="num">{formatCount(theme.distinct_accounts)}</span>
                {change ? <Delta isNew={change.isNew} unit="accounts" value={change.accounts} /> : null}
              </dd>
            </div>
            <div>
              <dt>x interactions</dt>
              <dd className="num">{formatCount(theme.x_engagement)}</dd>
            </div>
            <div>
              <dt>youtube views</dt>
              <dd className="num">{formatCount(theme.youtube_views)}</dd>
            </div>
            <div>
              <dt>sources by day</dt>
              <dd>
                <Spark label={sparkSummary(row.spark, days)} series={row.spark} />
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {cves.length > 0 ? (
        <div className="theme-block">
          <h4 className="kicker">cves · {cves.length}</h4>
          <CveRows rows={cves} />
        </div>
      ) : null}

      {items.length > 0 ? (
        <div className="theme-block">
          <h4 className="kicker">key sources · {items.length}</h4>
          <ul className="items">
            {items.slice(0, SHOWN_ITEMS).map((source) => (
              <Item key={source.id} source={source} />
            ))}
          </ul>
          {items.length > SHOWN_ITEMS ? (
            <details className="more">
              <summary>
                <span className="when-closed">show {items.length - SHOWN_ITEMS} more</span>
                <span className="when-open">show fewer</span>
              </summary>
              <ul className="items">
                {items.slice(SHOWN_ITEMS).map((source) => (
                  <Item key={source.id} source={source} />
                ))}
              </ul>
            </details>
          ) : null}
        </div>
      ) : null}

      {clusters.length > 0 ? (
        <div className="theme-block">
          <h4 className="kicker">comments · {formatCount(row.comments)}</h4>
          <div className="pulse-total">
            <Split
              className="split-lg"
              label={sentiment.map((part) => `${part.value} ${part.label}`).join(", ")}
              parts={sentiment}
            />
            <Legend parts={sentiment} />
          </div>
          <div className="clusters">
            {clusters.map((cluster, index) => (
              <Cluster cluster={cluster} key={`${index}-${cluster.label}`} />
            ))}
          </div>
        </div>
      ) : null}

      {accountsTotal > 0 ? (
        <details className="more accounts">
          <summary>
            <span>named accounts · {accountsTotal}</span>
            <i aria-hidden="true" className="plus" />
          </summary>
          <dl className="spec">
            {(
              [
                ["vendors", theme.vendors],
                ["media", theme.media],
                ["independent", theme.independent],
              ] as const
            ).map(([label, names]) =>
              names.length > 0 ? (
                <div key={label}>
                  <dt>
                    {label} · {names.length}
                  </dt>
                  <dd>{names.join(", ")}</dd>
                </div>
              ) : null,
            )}
          </dl>
        </details>
      ) : null}
    </div>
  )
}

/** Ranked themes as an accordion. Every theme starts closed. */
export function ThemeBoard({
  data,
  themes,
  rows,
  delta,
}: {
  data: WeekData
  themes: Theme[]
  rows: ThemeRow[]
  delta: WeekDelta | null
}) {
  const sources = new Map(data.sources.map((source) => [source.id, source]))
  const byKey = new Map(rows.map((row) => [row.key, row]))
  const days = windowDays(data)
  return (
    <Box className={delta ? "board has-delta" : "board"} title="themes">
      <div aria-hidden="true" className="board-head">
        <span>#</span>
        <span>theme</span>
        <span>accounts</span>
        <span className="col-spark">by day</span>
        <span className="col-cve">cves</span>
        {delta ? <span className="col-delta">change</span> : null}
        <span />
      </div>
      {themes.map((theme, index) => {
        const row = byKey.get(theme.key)
        if (!row) return null
        const change = delta?.themes[theme.key]
        const detail = nameDetail(theme.name, row.label)
        const style: Vars = { "--i": index }
        return (
          <details className="theme" id={`theme-${theme.key}`} key={theme.key} style={style}>
            <summary>
              <span className="t-rank num">{pad(theme.rank)}</span>
              <span className="t-name" title={theme.name}>
                <span className="t-label">{row.label}</span>
                {detail ? (
                  <span aria-hidden="true" className="t-full">
                    {detail}
                  </span>
                ) : null}
              </span>
              <span className="t-acc">
                <Bar value={row.share} />
                <span className="num">{formatCount(row.accounts)}</span>
                <span className="sr-only"> accounts.</span>
              </span>
              <span aria-hidden="true" className="t-spark col-spark">
                <Spark label={sparkSummary(row.spark, days)} series={row.spark} />
              </span>
              <span className="t-cve col-cve">
                <CveGlyphs rows={cveViews(theme)} />
              </span>
              {delta ? (
                <span className="t-delta col-delta">
                  {change ? <Delta isNew={change.isNew} unit="places" value={change.rank} /> : null}
                </span>
              ) : null}
              <i aria-hidden="true" className="plus" />
            </summary>
            <Body data={data} delta={delta} row={row} sources={sources} theme={theme} />
          </details>
        )
      })}
      <CveKey />
    </Box>
  )
}
