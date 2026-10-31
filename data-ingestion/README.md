# Data ingestion

The site's theme and components are fixed. Each week a pipeline adds one JSON file of content, and the build turns it into pages. This folder is the contract for that file. If a file meets it, the new week publishes without breaking the layout. If it does not, the build stops and the live site stays as it was.

| File | What it is |
| --- | --- |
| [FIELDS.md](FIELDS.md) | Every field: whether it is required, where it shows, length limits and fallbacks. |
| [PROPOSED.md](PROPOSED.md) | What the pipeline should start capturing next, by priority. |
| [`schema/week.v1.schema.json`](schema/week.v1.schema.json) | JSON Schema (2020-12) for one week. |
| [`examples/complete.json`](examples/complete.json) | A fictional week with every field filled in. Copy its shape. It passes every check with no warnings. |
| [`examples/minimal.json`](examples/minimal.json) | The least the build accepts. It shows the fallbacks, so do not aim for it. |

## Weekly checklist

1. **Pick the window.** Use 7 IST days, from `00:00` on the first day to `23:59` on the last.
2. **Write the file.** Save it as `reports/<start>_<end>/data.json`, for example `reports/2026-10-30_2026-11-05/data.json`.
   - The folder name must match `meta.window`.
   - The build reads only `data.json`. It ignores an `index.html` next to it.
   - Leave earlier weeks as they are.
3. **Check it.** All of these must pass:

   ```sh
   pnpm install --frozen-lockfile
   pnpm check:week reports/2026-10-30_2026-11-05
   python3 scripts/check_schema_v1.py reports/2026-10-30_2026-11-05/data.json
   pnpm test
   pnpm build && pnpm test:site
   ```

4. **Commit and push only the new folder.** CI runs the same checks, then deploys `main` to GitHub Pages.

`pnpm check:week` with no paths checks every week. Two flags change its behaviour:

- `--strict` fails on warnings too.
- `--json` prints machine-readable findings for the pipeline to act on.

In GitHub Actions it also adds annotations to the pull request.

## When something is wrong

- **Errors stop the publish.** These include:
  - a missing required field or a wrong type
  - a source id that two posts share, or a key post that is not in `sources`
  - a day that does not exist, or a window that does not match its folder

  CI fails before the build, so GitHub Pages keeps serving the last good site. A broken week never goes live half-built.
- **Warnings publish, but not as designed.** Long labels are cut with "…" and long paragraphs clamp. Missing optional fields use their fallbacks, and an unknown platform gets a spare colour. Each warning names the field and its effect, so fix them when you can.
- **The page never crashes on a strange value.** The tests mutate every field of the complete example: they delete it, change its type, make it negative, empty or very long, and swap in a bad URL. They then check that every page model still renders finite numbers. Any file the checker accepts renders.

## Why JSON, not MDX

The week is data more than prose. Counts feed charts, ids link posts to themes, and CVE states pick colours. JSON keeps these values typed and checkable:

- **It can be validated before the build.** A schema and `pnpm check:week` reject a bad file with a clear message. An MDX file is only checked when it compiles, and a stray `<` or `{` in a scraped post breaks the compile.
- **Scraped text stays text.** JSON strings print as plain text. In MDX the same text would be parsed as markup, so a post containing `<script>` or `{…}` becomes code.
- **Every week looks the same.** The theme board, charts and callouts live in code, and the file only supplies values. A week cannot drift in layout.

The written parts, such as `bottom_line`, `summary`, `why` and `actions`, are plain-text fields. They render inside the same callouts and cards that an MDX page would use.

## The checks

| Check | Command | In CI | What it covers |
| --- | --- | --- | --- |
| Week checker | `pnpm check:week` | blocks | Everything the build requires, layout warnings, and warnings for record and proposed fields. |
| Editorial checker | `python3 scripts/check_schema_v1.py <file>` | advisory | Short names (required there), CVE `source_ids` whose source text names the CVE, sentences of 20 words or fewer, passive voice, and a verbatim match against a base file (`--base`). |
| Contract tests | `pnpm test` | blocks | The schema, the checker, the examples and the page models agree. |
| Site tests | `pnpm test:site` | blocks | The built pages contain every week, theme and chart, with no broken values. |

## The schema

- **Dialect:** JSON Schema 2020-12. Any validator works: ajv, or `jsonschema` in Python. A file the schema accepts passes `pnpm check:week` with no errors, except for the cross-field rules a schema cannot express. Those are listed in its description.
- **Unknown fields** are allowed and ignored.
- **`"$comment": "soft"`** marks fields the site does not read: record-only fields, the funnel counts and the proposed fields. A bad value there is only a warning.
- **Versions:**
  - New optional fields keep `schema_version: 1`.
  - A breaking change bumps `schema_version` and needs code in `lib/brief.mjs` that accepts the new version. Breaking changes include renaming a field, changing a type or adding a required field.
  - Published weeks are not rewritten.

## Weeks over time

- **Keys:** reuse a storyline's theme `key` every week. This drives the rank arrows, account deltas, "new" badges and the dropped list. See [Keys](FIELDS.md#keys-and-week-over-week).
- **The index** lists every folder in `reports/`, newest first. Older weeks that have only an `index.html` are listed and served as they are.
- **Comparisons** are with the newest earlier week that has a `data.json`, so a skipped week does not break them.
