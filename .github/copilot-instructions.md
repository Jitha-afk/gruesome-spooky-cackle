# Copilot Instructions

## Pull Request Merging & Deployment

- **Do not merge pull requests directly** unless the user explicitly asks you to merge. Complete review and validation, report readiness, and let a maintainer merge via the GitHub UI or their own CLI. Human merges trigger `.github/workflows/pages.yml` automatically without GitHub's `action_required` hold.
- **If explicitly asked to merge into `main`:** After merging, check the resulting `pages` workflow run on the merge commit. If it is held as `action_required`, include the run URL in your response so the maintainer can approve or manually dispatch `pages.yml` immediately, and note that the scheduled drift check in `.github/workflows/pages.yml` (`cron: '*/30 * * * *'`) will automatically build and deploy `main` if it is not manually triggered sooner.
