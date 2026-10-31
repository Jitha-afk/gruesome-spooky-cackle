# gruesome-spooky-cackle

Weekly threat intel pages. Each week is a directory under `reports/`.

## Add a week

Add `reports/YYYY-MM-DD_YYYY-MM-DD/data.json` (schema v1), then run `pnpm check:week` on it. The build reads that file and writes the week page. A week with no `data.json` keeps its `index.html`, and the index links to that saved page.

`short_name` on a theme or ranking row is optional. A CVE `basis` is optional. The build fails when `schema_version` is not 1 or a required field is missing, and CI does not deploy a failed build, so the live site stays as it was.

[`data-ingestion/`](data-ingestion/README.md) is the contract for the weekly file. It holds:

- the weekly checklist
- every field, where it shows and its length limit
- the JSON Schema
- a complete example and a minimal one
- the fields to start capturing next

Merge to `main` to publish. The published site is [Weekly threat intel](https://jitha-afk.github.io/gruesome-spooky-cackle/).

## Preview locally

From the repository root, run `pnpm install` and `pnpm build`. The site is written to `site/`. Serve that directory under `/gruesome-spooky-cackle/`.

## GitHub Pages

The workflow deploys from GitHub Actions.

## Credits

Design inspired by [mdxcn](https://www.mdxcn.dev). 
