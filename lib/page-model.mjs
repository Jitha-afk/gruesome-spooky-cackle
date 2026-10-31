// Template variables for templates/week.knap.md.
// HTML fields are escaped. Figure props stay raw for the graph components.
import {
  basePath,
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
  sparkGlyphs,
  sparkSeries,
  sparkSummary,
  themesByRank,
  waffleParts,
  weekSummary,
  whyText,
  windowDays,
} from "./brief.mjs"

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function dateUnits(text) {
  const marker = " to "
  const at = text.indexOf(marker)
  if (at === -1) return escapeHtml(text)
  return `<span class="date-unit">${escapeHtml(text.slice(0, at))}</span>${marker}<span class="date-unit">${escapeHtml(text.slice(at + marker.length))}</span>`
}

function tagClass(tag) {
  return tag === "EXPLOITED" ? "tag tag-hot" : "tag tag-muted"
}

function cveCell(tag) {
  return `[ ${tag} ]`
}

function paragraphs(items) {
  return items.map((item) => `<p>${escapeHtml(item)}</p>`).join("\n\n")
}

export function pageModel(data, sections = {}) {
  const themes = themesByRank(data)
  const top = themes[0]
  const days = windowDays(data)
  const coverage = coverageModels(data)
  const heat = heatmapModel(data)
  const stats = headlineStats(data)
  const sentiment = sentimentTotals(data)
  const waffle = waffleParts(sentiment)
  const sources = new Map(data.sources.map((source) => [source.id, source]))
  const tone = {
    positive: "text-graph-accent",
    neutral: "text-graph-muted",
    negative: "text-graph-accent-3",
    unclassified: "text-graph-faint",
  }

  const figures = {
    stat: {
      className: "stat-row",
      items: [
        { label: "Themes", value: formatCount(stats.themes), accent: true },
        { label: "Sources", value: formatCount(stats.sources) },
        { label: "Comments analysed", value: formatCount(stats.comments) },
        { label: "CVEs exploited", value: `${stats.exploited} / ${stats.cves}` },
      ],
    },
    capture: {
      className: "ledger",
      rows: [
        { label: "Posts", value: formatCount(data.meta.counts.x_posts) },
        { label: "Videos", value: formatCount(data.meta.counts.youtube_videos) },
        { label: "X capture", value: data.meta.capture.x },
        { label: "YouTube capture", value: data.meta.capture.youtube },
      ],
    },
    unread: {
      type: "note",
      body: paragraphs(data.meta.inaccessible),
    },
    rank: {
      palette: "mono",
      items: rankRows(data).map((row) => ({
        label: row.label,
        title: row.title,
        value: row.accounts,
      })),
    },
    heatmap: {
      palette: "duo",
      columns: heat.columns.map((day) => day.slice(0, 2)),
      spoken: heat.columns,
      rows: heat.rows,
    },
    stackType: {
      className: "split-type",
      palette: "multi",
      rows: coverage.accounts.map((row, index) => {
        const theme = themes[index]
        const name = theme ? shortLabel(theme.name, theme.short_name) : row.label
        const [vendor, media, independent] = row.segments.map((segment) => segment.value)
        return {
          name,
          label: name,
          counts: `${vendor} / ${media} / ${independent}`,
          segments: row.segments,
        }
      }),
    },
    stackPlatform: {
      palette: "multi",
      rows: coverage.platforms.map((row, index) => {
        const theme = themes[index]
        const name = theme ? shortLabel(theme.name, theme.short_name) : row.label
        const [x, youtube] = row.segments.map((segment) => segment.value)
        return {
          name,
          label: name,
          counts: `${x} / ${youtube}`,
          segments: row.segments,
        }
      }),
    },
    cves: {
      className: "cve-table",
      align: ["left", "left", "left", "left"],
      headers: ["CVE", "Theme", "State", "Basis"],
      rows: cveTableRows(data).map((row) => [row.id, row.theme, cveCell(row.tag), row.basis]),
    },
    waffle: {
      className: "sentiment",
      value: 1,
      description: `${formatCount(sentiment.positive)} positive, ${formatCount(sentiment.neutral)} neutral, ${formatCount(sentiment.negative)} negative, ${formatCount(sentiment.unclassified)} unclassified, of ${formatCount(sentiment.positive + sentiment.neutral + sentiment.negative + sentiment.unclassified)} comments.`,
      legendItems: [
        { key: "positive", glyph: "█", className: "text-graph-accent", label: `positive ${formatCount(sentiment.positive)}` },
        { key: "neutral", glyph: "█", className: "text-graph-muted", label: `neutral ${formatCount(sentiment.neutral)}` },
        { key: "negative", glyph: "█", className: "text-graph-accent-3", label: `negative ${formatCount(sentiment.negative)}` },
        { key: "unclassified", glyph: "░", className: "text-graph-muted", label: `unclassified ${formatCount(sentiment.unclassified)}` },
      ],
      segments: waffle.map((part) => ({
        cells: part.cells,
        className: tone[part.key] ?? "text-graph-faint",
        glyph: part.key === "unclassified" ? "░" : undefined,
      })),
    },
    sources: {
      className: "source-index",
      align: ["left", "left", "left", "right", "right", "right", "right", "right", "right", "right"],
      headers: ["Date", "Account", "Text", "Likes", "Reposts", "Replies", "Quotes", "Impressions", "Views", "Engagement"],
      rows: sourceRows(data).map((source) => ({
        attrs: {
          "data-type": source.type,
          "data-platform": source.platform,
          "data-engagement": String(source.engagement),
        },
        cells: [
          source.date_ist,
          source.account,
          { href: source.url, text: source.text },
          ...["likes", "reposts", "replies", "quotes", "impressions", "views"].map((key) =>
            typeof source.metrics?.[key] === "number" ? formatCount(source.metrics[key]) : "",
          ),
          formatCount(source.engagement),
        ],
      })),
    },
    method: {
      type: "note",
      body: `<p>${escapeHtml(data.meta.methodology)}</p>`,
    },
  }

  return {
    base: basePath,
    kicker: dateUnits(`${data.meta.window.start} to ${data.meta.window.end}`),
    title: escapeHtml(data.meta.title),
    summary: escapeHtml(weekSummary(top)),
    figures,
    top: themes.slice(0, 3).map((theme) => {
      const why = whyText(theme)
      const preview = previewCves(theme, 3)
      return {
        key: theme.key,
        rank: theme.rank,
        label: escapeHtml(shortLabel(theme.name, theme.short_name)),
        title_attr: escapeHtml(theme.name),
        why: escapeHtml(why.text),
        why_class: why.clamp ? "why-line" : "",
        cves: preview.shown.map((row) => ({
          id: escapeHtml(row.id),
          tag: escapeHtml(row.tag),
          tag_class: tagClass(row.tag),
        })),
        extra: preview.extra,
        no_cve: cveViews(theme).length === 0,
      }
    }),
    themes: themes.map((theme, index) => {
      const comments = commentModel(theme)
      const charted = comments.filter((row) => row.positive + row.neutral + row.negative > 0)
      const series = sparkSeries(theme, data)
      return {
        key: theme.key,
        open: index < 3,
        button: index >= 3,
        heading: escapeHtml(`${theme.rank}. ${theme.name}`),
        summary: theme.summary ? escapeHtml(theme.summary) : "",
        why: theme.why ? escapeHtml(theme.why) : "",
        note: sections[theme.key] ?? "",
        products: escapeHtml(theme.affected.products),
        sectors: escapeHtml(theme.affected.sectors),
        regions: escapeHtml(theme.affected.regions),
        cves: cveViews(theme).map((row) => ({
          id: escapeHtml(row.id),
          tag: escapeHtml(row.tag),
          tag_class: tagClass(row.tag),
          basis: row.basis ? escapeHtml(row.basis) : "",
        })),
        coverage: {
          className: "coverage",
          rows: [
            { label: "Accounts", value: formatCount(theme.distinct_accounts), accent: true },
            { label: "X interactions", value: formatCount(theme.x_engagement) },
            { label: "YouTube views", value: formatCount(theme.youtube_views) },
            {
              label: "By day",
              spark: sparkGlyphs(series).join(""),
              summary: sparkSummary(series, days),
            },
          ],
        },
        vendors: theme.vendors.length ? escapeHtml(theme.vendors.join(", ")) : "",
        media: theme.media.length ? escapeHtml(theme.media.join(", ")) : "",
        independent: theme.independent.length ? escapeHtml(theme.independent.join(", ")) : "",
        items: theme.key_items.flatMap((id) => {
          const source = sources.get(id)
          if (!source) return []
          return [
            {
              date: escapeHtml(source.date_ist),
              account: escapeHtml(source.account),
              url: escapeHtml(source.url),
              text: escapeHtml(source.text),
              image: typeof source.image === "string" && source.image ? escapeHtml(source.image) : "",
            },
          ]
        }),
        comment_stack: charted.length
          ? {
              className: "comment-pulse",
              palette: "multi",
              rows: charted.map((row) => ({
                label: `${row.label} (${row.positive + row.neutral + row.negative})`,
                segments: [
                  { label: "positive", value: row.positive },
                  { label: "neutral", value: row.neutral },
                  { label: "negative", value: row.negative },
                ],
              })),
            }
          : null,
        clusters: comments.map((cluster) => ({
          label: escapeHtml(cluster.label),
          unclassified: cluster.unclassified > 0 ? formatCount(cluster.unclassified) : "",
          samples: cluster.samples.map((sample) => ({
            href: escapeHtml(sample.href),
            text: escapeHtml(sample.text),
            date: sample.date ? escapeHtml(sample.date) : "",
          })),
        })),
      }
    }),
  }
}
