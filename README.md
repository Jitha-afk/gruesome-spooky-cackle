# gruesome-spooky-cackle

Weekly threat intel pages. Each week is a directory under `reports/`.

The brief format is [docs/weekly-brief.md](docs/weekly-brief.md). The weekly handoff is [docs/weekly-flow.md](docs/weekly-flow.md).

## Add a week

Add `reports/YYYY-MM-DD_YYYY-MM-DD/brief.md` and `sources.json` (schema v2). The build reads those files and writes the week page from `templates/week.knap.md`. A week with only `data.json` (schema v1) still builds from that file. A week with no `brief.md` and no `data.json` keeps its `index.html`, and the index links to that saved page.

`short_name` on a theme or ranking row is optional in the site build and required by the checker. A CVE `basis` is optional in the site build and required by the checker. The build fails when `schema_version` is wrong or a required field is missing.

Merge to `main` to publish. The published site is [Weekly threat intel](https://jitha-afk.github.io/gruesome-spooky-cackle/).

## Preview locally

From the repository root, run `pnpm install` and `pnpm build`. The site is written to `site/`. Serve that directory under `/gruesome-spooky-cackle/`.

## Enable GitHub Pages

The workflow deploys from GitHub Actions. If Pages is not already using that source, open Settings, open Pages, and set Source to GitHub Actions.
