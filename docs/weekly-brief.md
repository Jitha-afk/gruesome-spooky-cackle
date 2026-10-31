# Weekly brief

cybersec writes one week as two files. The site builds the page from them. Do not add a page component for the week.

```
reports/<start>_<end>/brief.md
reports/<start>_<end>/sources.json
```

`<start>` and `<end>` are `YYYY-MM-DD`. The directory name is the window. Example: `reports/2026-10-23_2026-10-29/`.

Schema version is **2**. Field names and meanings are schema v1. Only the container changes.

## One home per text

The frontmatter is canonical for every v1 field, including `summary`, `why`, `why_line`, and `short_name`. The site renders that prose from the frontmatter.

The body is optional extra commentary. It never repeats a frontmatter field. A missing theme section is allowed. The converted week `2026-10-23_2026-10-29` has an empty body.

`sources[]` and the comment samples are not in the frontmatter. They live in `sources.json`.

## brief.md

A YAML document between `---` fences, then an optional Markdown body.

The parser is strict:

- JSON-style flow YAML is accepted. A JSON object is valid flow YAML.
- Fully double-quoted block YAML is accepted.
- There is no timestamp type. A quoted date stays a string. An unquoted ISO timestamp stays a string.
- Quoted numbers and quoted booleans stay strings. `date_ist` and ids stay strings when they are quoted.
- Unquoted numbers are numbers. Unquoted `true` / `false` are booleans.

Do not put `sources` in the frontmatter. Do not put comment `samples` on a cluster. A non-empty `samples` array in the frontmatter fails the checker.

### Frontmatter fields

`schema_version` is `2`.

`meta`

- `title` (string)
- `window.start`, `window.end` (strings, IST display text)
- `capture.x`, `capture.youtube` (strings)
- `counts.x_posts`, `counts.youtube_videos`, `counts.comments_analysed_top_themes` (numbers)
- `methodology` (string)
- `inaccessible` (array of strings)
- Other meta fields from v1 (`generated`, `also_observed`, `accounts`, and the UTC window fields) stay here when you have them. The checker keeps them. The page does not invent new ones.

`themes[]`. Each theme has the v1 fields:

- `rank` (number), `key` (string), `name` (string)
- `short_name` (string, required by the checker, at most 12 characters, unique across themes)
- `summary`, `why` (strings). `why_line` (string) is optional. The top cards use `why_line` when it is non-empty, otherwise `why`.
- `affected.products`, `affected.sectors`, `affected.regions` (strings)
- `vendors`, `media`, `independent` (arrays of strings)
- `distinct_accounts`, `x_engagement`, `youtube_views` (numbers)
- `key_items` (array of source ids). Each id must exist in `sources.json`.
- `comments.clusters[]`: `label` (string), `sentiment_counts` (object of numbers), plus any other v1 cluster fields except `samples`
- `cves` (array of CVE id strings)
- `exploited_in_wild` (`true`, `false`, or `null`)
- `cve_details[]`: `id`, `exploited_in_wild`, `source_ids`, `basis`
  - `basis` is a non-empty string in the checker
  - every `source_ids` entry exists in `sources.json`, and that source's `text` contains the CVE id
  - `cves` and the `cve_details` ids are the same set, with no duplicates
  - if any CVE is exploited, the theme flag is `true`

`ranking[]`: `key`, `name`, `accounts`, `short_name`. When `key` matches a theme, `name` and `short_name` match that theme. `short_name` is at most 12 characters and unique in the ranking.

Sentences in the authored fields (`name`, `summary`, `why`, affected text, cluster labels, CVE `basis`, `methodology`, `inaccessible`, `also_observed`, ranking names) are at most 20 words. The checker fails longer sentences. Passive voice is a warning.

Extra fields are kept.

### Body

Optional. Headings are exactly:

```markdown
## <key>
```

`<key>` is the theme `key`. Each key appears at most once. An unknown key fails. A missing key is allowed. Text before the first heading fails.

Under a heading, write extra commentary only. You may also place `::graph-*` blocks. The site parses those at build time and draws them with the same components as the rest of the page. Do not restate `summary`, `why`, `why_line`, or `short_name`.

### Minimal frontmatter

```yaml
---
schema_version: 2
meta:
  title: "Synthetic week"
  window:
    start: "2026-04-01 00:00 IST"
    end: "2026-04-07 23:59 IST"
  capture:
    x: "X capture."
    youtube: "YouTube capture."
  counts:
    x_posts: 1
    youtube_videos: 0
    comments_analysed_top_themes: 1
  methodology: "Count the posts."
  inaccessible:
    - "One item was not read."
themes:
  - rank: 1
    key: "alpha"
    name: "Alpha theme"
    short_name: "Alpha"
    summary: "Alpha led the synthetic week."
    why: "Alpha is the only theme."
    why_line: "Alpha is the only theme."
    affected:
      products: "Alpha product."
      sectors: "Software."
      regions: "Global."
    vendors: ["Vendor"]
    media: []
    independent: []
    distinct_accounts: 1
    x_engagement: 4
    youtube_views: 0
    key_items: ["s1"]
    comments:
      clusters:
        - label: "Main cluster"
          sentiment_counts:
            positive: 1
            neutral: 0
            negative: 0
            unclassified: 0
    cves: ["CVE-2026-1"]
    exploited_in_wild: false
    cve_details:
      - id: "CVE-2026-1"
        exploited_in_wild: false
        source_ids: ["s1"]
        basis: "The source names the CVE."
ranking:
  - key: "alpha"
    name: "Alpha theme"
    short_name: "Alpha"
    accounts: 1
---
```

The same document as one JSON object between the fences is also valid. Quote every date and every id.

## sources.json

A JSON object. No YAML.

```json
{
  "sources": [],
  "samples": {}
}
```

`sources` is the v1 `sources[]` array. Each object keeps the v1 fields: `id`, `platform`, `type`, `account`, `date_ist`, `text`, `url`, `engagement`, `theme`, `metrics`, and any other v1 fields (`image`, `video_id`, `org`, `date_utc`, `date_publish_raw`). `id` is a string. `date_ist` is a string.

`samples` is an object keyed by theme `key`. Each value is an array with one entry per cluster, in the same order as `comments.clusters`. Each entry is an array of v1 sample objects: `text`, `url`, `parent_url`, `date_ist`, `kind`, and any other sample fields. Do not add a wrapper field.

The checker joins sources by `id` (`key_items`, `cve_details.source_ids`). It joins samples by theme key and cluster index. A missing theme key, an unknown key, or a cluster-count mismatch fails.

```json
{
  "sources": [
    {
      "id": "s1",
      "platform": "X",
      "type": "vendor",
      "account": "Vendor",
      "date_ist": "2026-04-02 01:00",
      "text": "Patch CVE-2026-1 now.",
      "url": "https://example.test/s1",
      "engagement": 4,
      "theme": "alpha",
      "metrics": { "likes": 4 }
    }
  ],
  "samples": {
    "alpha": [
      [
        {
          "text": "A synthetic comment.",
          "url": "https://example.test/c1",
          "parent_url": "https://example.test/s1",
          "date_ist": "2026-04-02 02:00"
        }
      ]
    ]
  }
}
```

When a sibling `data.json` exists, the checker compares `sources` and the comment samples to that file. Sample `text` and `url` must match. That comparison is the retrieved-data check. Pass `--base path/to/data.json` to point it at a different file.

## Optional body

```markdown
## alpha

A note for the alpha theme.

::graph-stat
---
title: "Hand placed"
items:
  - { label: Notes, value: "1" }
---
::
```

`fixtures/synthetic-week/` is this example on disk. It is not a published week.

## Checker

From the repository root:

```bash
python3 scripts/check_schema_v1.py reports/2026-10-23_2026-10-29/brief.md
python3 scripts/check_schema_v1.py reports/2026-10-23_2026-10-29/data.json
python3 scripts/check_schema_v1.py path/to/brief.md --base path/to/data.json
```

Exit 0 is pass. Exit 1 is fail. The same script still checks a v1 `data.json`. CI runs it on every `reports/*/brief.md` and fails the build on schema errors.

`pnpm test` runs the checker tests, including the quoted-date and quoted-numeric-id cases.

## What the site does with the file

`templates/week.knap.md` is the page layout. It pipes the week through `graph_stat`, `graph_rank`, `graph_heatmap`, `graph_stack`, `graph_table`, `graph_waffle`, and `graph_spec`. The filter argument is the frame title. The build always emits `::graph-*` blocks. The heatmap uses one log1p scale across every row. Each theme card's Coverage figure includes the By day row.

The build parses that Markdown, plus the body, with Comark and draws it with the existing graph components. No client parser is shipped. A week that has only `data.json`, or only `index.html`, still builds the way it did before `brief.md`.
