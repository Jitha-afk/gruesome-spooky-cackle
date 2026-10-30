# gruesome-spooky-cackle

Repo for Weekly Top News

## Add a week

Open a pull request that adds `reports/YYYY-MM-DD_YYYY-MM-DD/index.html`. Both dates are real calendar days. The second date is the same day as the first, or a later day. The file is that week's brief. A directory under `reports/` with any other name fails the build, and so does a week directory with no `index.html`. The build copies each brief unchanged and writes the root page from those directory names. Merge the pull request to `main` to publish.

The published site is [Weekly threat intel](https://jitha-afk.github.io/gruesome-spooky-cackle/). The brief for 23 Oct 2026 to 29 Oct 2026 is [23 Oct 2026 to 29 Oct 2026](https://jitha-afk.github.io/gruesome-spooky-cackle/reports/2026-10-23_2026-10-29/).

## Preview locally

From the repository root, run `python3 scripts/build_site.py`. Then run `python3 -m http.server 8000 --directory site`. Open `http://127.0.0.1:8000/`.

## Enable GitHub Pages

The workflow deploys from GitHub Actions. If Pages is not already using that source, open Settings, open Pages, and set Source to GitHub Actions.
