# gruesome-spooky-cackle

Weekly threat intel pages. Each week is a directory under `reports/`.

## Add a week

Add `reports/YYYY-MM-DD_YYYY-MM-DD/data.json` (schema v1). The build reads that file and writes the week page. A week with no `data.json` keeps its `index.html` and the index links to that saved page.

`short_name` on a theme or ranking row is optional. A CVE `basis` is optional. The build fails when `schema_version` is not 1 or a required field is missing.

Merge to `main` to publish. The published site is [Weekly threat intel](https://jitha-afk.github.io/gruesome-spooky-cackle/).

## Preview locally

From the repository root, run `pnpm install` and `pnpm build`. The site is written to `site/`. Serve that directory under `/gruesome-spooky-cackle/`.

## Enable GitHub Pages

The workflow deploys from GitHub Actions. If Pages is not already using that source, open Settings, open Pages, and set Source to GitHub Actions.
