# Fields

This page covers every field in `reports/<start>_<end>/data.json` (schema version 1). For each field it lists:

- whether the build needs it
- where the page shows it
- how long it can be
- what the page does when it is missing

The machine-readable contract is [`schema/week.v1.schema.json`](schema/week.v1.schema.json). `pnpm test` fails when this page, the schema and the checker (`lib/check.mjs`) disagree.

The **Need** column uses four values:

- **required**: the build fails without it, and `pnpm check:week` reports an error.
- **optional**: the page has a fallback, given in the notes.
- **record**: kept in the file for the record. The site ignores it, so a bad value is only a warning.
- **proposed**: typed now but not shown yet. A bad value is only a warning. See [PROPOSED.md](PROPOSED.md).

Unknown fields are allowed and ignored, so the pipeline can capture a field before the site uses it. See [Adding a field](#adding-a-field).

## Text, numbers, dates and links

- **Plain text only.** Do not use Markdown, HTML or MDX. The page prints text as written, so `**bold**` shows its asterisks. Line breaks collapse to spaces.
- **Counts are JSON numbers:** whole numbers, 0 or more.
  - A string like `"1,234"` or `"1.2K"` fails the build.
  - A negative count is a warning, and charts treat it as 0.
  - A fraction, like `12.5`, is a warning. The page prints it as written.
  - Headline numbers of 100,000 or more print short, for example `1.2M`.
- **Characters are counted as a reader sees them.** An emoji or an accented letter is one character, and a cut label never splits one.
- **Long words.** A word longer than 40 characters, usually a raw URL, breaks mid-word on phones. The checker warns. Put links in `url` or `advisory_url` instead of the text.
- **Encoding.** Save files as UTF-8 without a byte-order mark. The build skips a mark, and the checker warns about it.
- **Times are IST.**
  - The window looks like `2026-10-23 00:00 IST`. The `date_ist` fields look like `2026-10-23 07:59`.
  - A day that does not exist, like `2026-02-30`, fails the build when it is in the window or the folder name. Anywhere else, the day is skipped.
- **Links** start with `http://` or `https://`. Anything else shows as plain text, without a link.
- **Writing style:** sentences of 20 words or fewer, in the active voice. `scripts/check_schema_v1.py` checks this.

## Top level

| Field | Need | Notes |
| --- | --- | --- |
| `schema_version` | required | Always `1`. Any other value fails the build. |
| `meta` | required | The week: title, window, counts and method. |
| `themes` | required | At least one theme. 3 to 12 read best. |
| `ranking` | required | Every theme, plus storylines below the bar. Without a theme's row, the accounts chart leaves that theme out. |
| `sources` | required | Every post or video behind the themes. |

## `meta`

| Field | Need | Shows in | Notes |
| --- | --- | --- | --- |
| `title` | required | Hero kicker, browser tab | One line, the same every week, for example "Weekly cybersecurity threat-intel brief". The hero heading is the window, for example "23–29 Oct 2026". |
| `window.start`, `window.end` | required | Hero, index row, by-day chart | `YYYY-MM-DD HH:MM IST`. The days must match the folder name. The page is built for 7 days, one chart column per day. More than 7 is a warning, and the chart caps at 31 days. |
| `window.start_utc`, `window.end_utc` | record | | |
| `generated` | optional | Hero, notes, index "published" date | `YYYY-MM-DD HH:MM IST`. Without it the index shows no published date. |
| `bottom_line` | optional, warned | Hero lead, index lead | One or two sentences: what a defender should take from the week. Without it, the hero reads "N of N cited CVEs exploited in the wild. `<top theme>` led with N accounts: `<its why_line>`" and the index shows "`<top theme>` led the week." plus that theme's `why_line`. The gate warns when it is missing. |
| `capture` | required | Notes, "Capture window" | One row for each string, labelled by key. `x` and `youtube` are required. Add a key for a new platform, for example `"bluesky": "… to …"`. |
| `counts` | required | KPIs, notes | See [Counts and the funnel](#counts-and-the-funnel). |
| `methodology` | required | Notes, "How this brief is made" | One paragraph. Hidden when `method_steps` is present. |
| `method_steps` | optional | Notes, "How this brief is made" | 3 to 7 objects. Each has a `title` (one line) and an optional `detail` (one or two sentences). Replaces `methodology`. |
| `inaccessible` | required | Notes, "Not read in full" | Strings. Use `[]` when every source was read. The item is hidden when the list is empty. |
| `also_observed` | optional | Notes, "Also observed" | Stories in the window that did not make a theme. One or two sentences each. |
| `accounts` | record | | Monitored accounts by group. |

### Counts and the funnel

The first three counts are required. The rest feed the "What was kept" funnel in the notes, which shows how much the pipeline read and how much it kept. A funnel needs at least two of its stages as numbers, and is hidden otherwise.

| Field | Need | Shows in | Notes |
| --- | --- | --- | --- |
| `counts.x_posts` | required | KPIs | X rows in `sources`. The checker warns when they differ. |
| `counts.youtube_videos` | required | KPIs | YouTube rows in `sources`. The checker warns when they differ. |
| `counts.comments_analysed_top_themes` | required | Comments KPI; last stage of the comments funnel | |
| `counts.candidates` | record | Sources funnel, stage 1 | On-topic posts and videos before themes were picked. Stage 2 is the number of `sources`. |
| `counts.comments_retrieved` | record | Comments funnel, stage 1 | Every comment fetched. Falls back to `comment_exclusions.retrieved`. |
| `counts.comment_exclusions.in_window` | record | Comments funnel, stage 2 | Retrieved comments posted inside the window. |
| `counts.comments_analysed_all` | record | Comments funnel, stage 3 | Comments left after exclusions, across all candidates. |
| `counts.comment_exclusions.excluded_spam_bot_abuse`, `excluded_retweet`, `excluded_no_text`, `duplicates` | record | Line under the comments funnel | Why comments were dropped. Zeros are hidden. |
| `counts.comment_exclusions.retrieved` | record | | Used when `comments_retrieved` is missing. |
| `counts.candidates_x`, `candidates_youtube`, `sources_in_top_themes`, `themes_kept` | record | | The page counts these from the file instead. |

Each funnel stage must be no larger than the stage before it. A stage that grows is a warning, and the funnel shows "+N" in place of "−N".

## `themes[]`

| Field | Need | Shows in | Notes |
| --- | --- | --- | --- |
| `rank` | required | Everywhere themes are listed | A whole number from 1, and 1 is the most covered. Number the themes 1 to n. The page sorts by rank and prints positions, so a gap or a repeat still shows 1, 2, 3. Both are warnings. |
| `key` | required | `#theme-<key>` links, week-over-week arrows | Letters, digits, `-` or `_`, unique in the week. **Keep the same key for the same storyline every week.** See [Keys](#keys-and-week-over-week). |
| `name` | required | Theme row, tooltips | The full headline. |
| `short_name` | optional | Side menu, charts, top-3 cards, index | Unique in the week. Without it, `name` is cut at 11 characters with "…". |
| `summary` | required | Theme body | What happened. |
| `why` | required | "Why it matters" callout | |
| `why_line` | optional | Top-3 cards | One sentence. Without it the cards show `why`, cut at three lines. |
| `actions` | optional, warned | "What to do" callout | Steps for defenders, one imperative sentence each. Hidden when missing. The gate warns when no theme has any. |
| `affected.products`, `affected.sectors`, `affected.regions` | required | Theme facts | Short phrases. Use `"Not stated"` when unknown. |
| `vendors`, `media`, `independent` | required | "Who covered it" chart, theme credits | Account names, which can be empty lists. The chart uses the length of each list. |
| `distinct_accounts` | required | Rank bars, KPIs, deltas | The ranking metric. Should match the `ranking` row. |
| `x_engagement` | required | Theme facts | Interactions on the theme's X posts. |
| `youtube_views` | required | Theme facts | Views on the theme's YouTube videos. |
| `key_items` | required | "Key posts" | Source ids, best first. Each id must be in `sources`. Three show, and the rest fold behind "show more". |
| `comments` | required | "Comment pulse", sentiment chart | See below. |
| `cves` | required | CVE table, theme CVE list | CVE ids, each listed once. Use `[]` when there are none. |
| `exploited_in_wild` | required | Fallback state for a CVE with no `cve_details` entry | `true` when any CVE here is exploited, and `null` when not confirmed. |
| `cve_details` | required | CVE table | See below. Use `[]` when there are no CVEs. |
| `both_vendor_and_media`, `item_ids` | record | | |
| `severity`, `first_seen`, `tags`, `threat_actors`, `attack_techniques`, `references` | proposed | | See [PROPOSED.md](PROPOSED.md). |

### `themes[].comments`

| Field | Need | Shows in | Notes |
| --- | --- | --- | --- |
| `clusters` | required | "Comment pulse" | Usually 3 to 6. Use `[]` when the theme has no comments. |
| `clusters[].label` | required | Cluster row | What the comments say. Unique in the theme. |
| `clusters[].sentiment_counts` | required | Cluster bar | Counts for `positive`, `neutral`, `negative` and `unclassified`. Leave out a mood that has no comments. |
| `clusters[].samples` | required | Quotes under the cluster | 1 to 3 representative comments. |
| `samples[].text` | required | Quote | Copied verbatim from the comment. |
| `samples[].parent_url` | required | Quote link | The post it replies to. |
| `samples[].date_ist` | optional | Quote | `YYYY-MM-DD HH:MM`. |
| `samples[].url`, `samples[].kind` | record | | |
| `clusters[].count`, `clusters[].share`, `clusters[].sentiment` | record | | The page computes these from `sentiment_counts`. |
| `sentiment` | optional | Pulse bar, sentiment chart | Totals for the theme. Without it, the clusters are added up. The checker warns when they disagree. |
| `count`, `parents` | record | | |

### `themes[].cve_details[]`

| Field | Need | Shows in | Notes |
| --- | --- | --- | --- |
| `id` | required | CVE table | `CVE-YYYY-NNNN`. It shows only when it is also in the theme's `cves`. |
| `exploited_in_wild` | required | CVE state | `true` shows as exploited, in red. `false` shows as not exploited, and `null` as not confirmed. |
| `basis` | optional | Evidence line | The evidence for the state, with the outlet in brackets. Without it the row has no evidence line. |
| `cvss` | optional | Score chip | A number from 0 to 10. |
| `advisory_url` | optional | Advisory link | The vendor or NVD advisory. |
| `source_ids` | record | | Ids of the sources that name the CVE. `check_schema_v1.py` requires these. |
| `kev`, `kev_added`, `epss`, `vendor`, `product`, `patch`, `fixed_versions`, `published` | proposed | | See [PROPOSED.md](PROPOSED.md). |

## `ranking[]`

The accounts chart in "Where the attention went". It lists every theme, plus storylines that missed the bar. Sort it by `accounts`, most first.

| Field | Need | Notes |
| --- | --- | --- |
| `key` | required | A theme key, or a new key for a storyline below the bar. |
| `name` | required | For a theme, the same as the theme's `name`. |
| `short_name` | optional | Falls back to the theme's `short_name`, then to `name` cut at 11 characters. |
| `accounts` | required | For a theme, the same as its `distinct_accounts`. |
| `x_eng`, `yt_views` | record | |

## `sources[]`

The "Sources" table, the key posts and the by-day chart.

| Field | Need | Notes |
| --- | --- | --- |
| `id` | required | Unique in the week. The pipeline uses `x<status id>` and `yt<video id>`. |
| `platform` | required | `X` or `YouTube`. Case-sensitive. See [New platforms and types](#new-platforms-and-types). |
| `type` | required | `vendor`, `media` or `independent`. Case-sensitive. |
| `account` | required | Display name. |
| `date_ist` | required | `YYYY-MM-DD HH:MM`, inside the window. The by-day chart skips other days. |
| `text` | required | Post text or video title. Long text is clamped. |
| `url` | required | The post or video. |
| `engagement` | required | Interactions on X, views on YouTube. Sorts the table and sizes its bars. |
| `theme` | required | A theme key, or a ranking key for a storyline below the bar. |
| `metrics` | required | Raw counts by name, for example `{"views": 826905}`. Shown in the engagement tooltip. Values that are not numbers are skipped. Can be `{}`. |
| `image` | optional | Thumbnail, about 16:9, on key posts. Without it, a key post shows text only. |
| `video_id`, `org`, `date_utc`, `date_publish_raw` | record | |
| `followers`, `language` | proposed | See [PROPOSED.md](PROPOSED.md). |

## Length limits

Past a limit the page still renders, but not as designed. `pnpm check:week` warns about each overflow. To change a limit, edit `LIMITS` in `lib/check.mjs` and this table together.

| Field | Limit | `LIMITS` key | Past the limit |
| --- | --- | --- | --- |
| `meta.title` | 60 characters | `title` | The hero kicker wraps to two or more lines on phones. |
| `meta.bottom_line` | 240 characters | `bottom_line` | The hero and index leads get long. |
| `themes[].short_name`, `ranking[].short_name` | 12 characters | `short_name` | Labels are cut with "…". |
| `themes[].name` | 110 characters | `name` | The theme row cuts it with "…". |
| `themes[].why_line` | 140 characters | `why_line` | The top-3 cards get uneven. |
| `themes[].why` | 600 characters | `why` | The callout gets long. |
| `themes[].summary` | 1200 characters | `summary` | The theme body gets long. |
| `themes[].actions` | 5 items | `actions` | The callout gets long. |
| `themes[].actions[]` | 160 characters | `action` | Each action should be one sentence. |
| `clusters[].label` | 90 characters | `cluster_label` | Labels wrap on phones. |
| `samples[].text` | 400 characters | `sample` | Quotes should be short excerpts. |
| `sources[].account` | 48 characters | `account` | Account names wrap. |
| `meta.also_observed[]` | 300 characters | `also_observed` | Each item should be one or two sentences. |
| `meta.method_steps[].title` | 60 characters | `step_title` | Step titles should be one line. |
| `meta.method_steps[].detail` | 300 characters | `step_detail` | Step details should be short. |
| `themes` | 12 themes | `themes` | The board gets long. Move the tail to `ranking`. |
| `themes[].cves` | 20 CVEs | `cves` | The theme's CVE list gets long. Keep the CVEs that matter most. |
| `cve_details[].basis` | 300 characters | `basis` | The CVE row gets tall. Put the link in `advisory_url`. |
| `sources` | 200 rows | `sources` | Every row is in the page, so it gets heavy on phones. |

The checker also warns about these:

- repeated ranks, short names, cluster labels or key posts
- ranks with a gap, like 1, 2, 4
- counts that are negative or not whole numbers
- a word longer than 40 characters
- a CVE that is listed in two themes. Both themes list it, and the totals and the CVE table count it once.
- a CVE that is missing from `cves` or `cve_details`
- an exploited CVE in a theme whose flag is not `true`
- sentiment totals that disagree with the clusters
- a theme with no `ranking` row, a ranking out of order, or `accounts` that differ from `distinct_accounts`
- a source dated outside the window, a key post from another theme, or a `theme` that is not a key
- `x_posts` or `youtube_videos` that differ from `sources`
- a new or misspelled platform or type
- more new platforms or types than spare colours: 3 platforms and 2 types. Past that, new values share a colour.
- a byte-order mark at the start of the file

## Keys and week-over-week

`themes[].key` identifies a storyline across weeks. When a storyline carries on, reuse last week's key, even if the name changes. With that, the board shows:

- **rank arrows**: places moved since last week
- **account deltas**: change in `distinct_accounts`
- **a "new" badge**: the key was not in the previous week
- **dropped**: last week's themes that did not return, listed under the board

Deltas compare with the newest earlier week that has a `data.json`, so a missing week is skipped. Do not reuse a key for an unrelated storyline. Do not edit published weeks to rename keys.

`ranking[].key` uses the theme key for themes. `sources[].theme` uses a theme key or a ranking key.

## New platforms and types

A new `platform` or `type` value renders without any code change:

- It gets a spare colour.
- It sorts after the known values.
- It uses neutral units: "sources" and "engagement".

`pnpm check:week` warns until the value is pinned, and also warns about a case-only misspelling, such as `youtube` for `YouTube`.

To pin a value:

1. Add it to `PLATFORM_ORDER` or `TYPE_ORDER` in `lib/brief.mjs`. For a platform, also add its noun and metric to `PLATFORM_UNITS`, for example `{ noun: "posts", metric: "likes" }`.
2. Give it a tone in `PLATFORM` or `TYPE` in `components/tones.ts`. Keep the red tone, `d`, for exploited CVEs and negative comments.
3. Add it to `KNOWN_PLATFORMS` or `KNOWN_TYPES` in `lib/check.mjs`.
4. For a platform, add a `meta.capture` key for its capture window.

## Adding a field

1. Add the field to the schema with a description.
   - Mark it `"$comment": "soft"` while the site does not read it. That way a bad value is only a warning.
   - Start the description with `Proposed.` when you plan to show it.
2. Add it to [`examples/complete.json`](examples/complete.json). The tests require every proposed field to appear there.
3. Document it on this page. The tests require every schema field to appear here.
4. To show it on the page:
   - Read it through a helper in `lib/brief.mjs` that tolerates missing and wrong values.
   - Drop the soft marker.
   - Add the check to `validateData` or `lib/check.mjs`.
   - Move its entry from PROPOSED.md to this page.

`pnpm test` runs `scripts/test_ingestion.mjs`. It mutates every field of the complete example and fails when the schema and the checker disagree, or when a page model breaks.
