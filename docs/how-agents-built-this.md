# How agents built this

By [Jitesh Thakur](https://www.linkedin.com/in/jithamsft/). I use Grok, Cursor and Copilot. Agents write the code. CI blocks a bad week, and I merge each change.

This is the build story of [Weekly threat intel](https://jitha-afk.github.io/gruesome-spooky-cackle/), from the first commit to the redesign. Each fact links to a pull request, a commit or an Actions run. Times are UTC. The [README](../README.md) explains what the report shows and how it works.

## At a glance

| | |
| --- | --- |
| Repository created | 30 Oct 2026, 16:03 |
| Site live | 30 Oct, 16:58, 55 minutes later |
| Redesign merged | 31 Oct, 14:52, less than 23 hours after the start |
| Pull requests | Five: three merged, one closed without a merge, one open |
| Agents named in the commits | Cursor ("Cursor Agent") in #1–#3, Copilot in #4 and #5 |
| Who merges | Jitesh, each time |

## Before the first commit

The week-1 data is older than the repository. Its `meta.generated` field says 30 Oct 2026, 20:25 IST (14:55 UTC). The X capture ran from 20:11 to 20:22 IST, about an hour before the first commit.

The method in that file names the tools. `get_users_by_usernames` checked the vendor and media handles on X. `search_posts_all` searched each handle and each keyword inside the week. YouTube videos came from web search and YouTube search pages, and then from each watch page.

## Day 1: 30 Oct 2026

| Time | What happened | Record |
| --- | --- | --- |
| 16:03 | Jitesh creates the repository. | [608010a](https://github.com/Jitha-afk/gruesome-spooky-cackle/commit/608010a) |
| 16:53 | PR #1 opens: a Python build script with 18 tests, the GitHub Pages workflow and the week-1 report as uploaded. The commits name Cursor Agent. CI passes. | [#1](https://github.com/Jitha-afk/gruesome-spooky-cackle/pull/1), [run](https://github.com/Jitha-afk/gruesome-spooky-cackle/actions/runs/41093925421) |
| 16:55 | Jitesh merges PR #1. The deploy fails at Configure Pages, because Pages is off. The agent tried to turn Pages on, and its token got HTTP 403. | [cb7eae8](https://github.com/Jitha-afk/gruesome-spooky-cackle/commit/cb7eae8), [run](https://github.com/Jitha-afk/gruesome-spooky-cackle/actions/runs/41094244405) |
| 16:58 | Pages is on. Jitesh runs the workflow by hand, and the site goes live. | [run](https://github.com/Jitha-afk/gruesome-spooky-cackle/actions/runs/41094681104) |

## Day 2: 31 Oct 2026

| Time | What happened | Record |
| --- | --- | --- |
| 09:22 | PR #2 opens: a rebuild as a static Next.js site that reads one `data.json` for each week. The commits name Cursor Agent. Two of its seven commits fix findings from a design review. | [#2](https://github.com/Jitha-afk/gruesome-spooky-cackle/pull/2) |
| 10:53 | Jitesh merges PR #2, and it deploys. | [040b91b](https://github.com/Jitha-afk/gruesome-spooky-cackle/commit/040b91b), [run](https://github.com/Jitha-afk/gruesome-spooky-cackle/actions/runs/41194557847) |
| 11:22 | PR #3 opens: each week as a Markdown file and a sources file, built through Knap and Comark. The commit names Cursor Agent. | [#3](https://github.com/Jitha-afk/gruesome-spooky-cackle/pull/3) |
| 13:13 | The redesign commit, with Copilot as co-author: the new layout, the data contract and the week checker. | [d24bb5c](https://github.com/Jitha-afk/gruesome-spooky-cackle/commit/d24bb5c) |
| 13:55 | Fixes from four audits: design, motion, accessibility and mobile, and code. | [fe5fb9c](https://github.com/Jitha-afk/gruesome-spooky-cackle/commit/fe5fb9c) |
| 14:22 | Fixes from the break test, below. | [99a6e01](https://github.com/Jitha-afk/gruesome-spooky-cackle/commit/99a6e01) |
| 14:41 | PR #4 opens. CI passes. | [#4](https://github.com/Jitha-afk/gruesome-spooky-cackle/pull/4), [run](https://github.com/Jitha-afk/gruesome-spooky-cackle/actions/runs/41211283854) |
| 14:52 | Jitesh merges PR #4, and it deploys. | [b41410a](https://github.com/Jitha-afk/gruesome-spooky-cackle/commit/b41410a), [run](https://github.com/Jitha-afk/gruesome-spooky-cackle/actions/runs/41212164558) |
| 15:11 | The first PR #5 commit, with Copilot as co-author, moves the design credit from the site footer to the README. | [a7804ca](https://github.com/Jitha-afk/gruesome-spooky-cackle/commit/a7804ca) |
| 16:23 | Jitesh closes PR #3 without a merge. | [#3](https://github.com/Jitha-afk/gruesome-spooky-cackle/pull/3) |
| 16:41 | PR #5 opens: plain-English site copy, coloured numbers, the byline and the accent menu. CI passes. It is still open. | [#5](https://github.com/Jitha-afk/gruesome-spooky-cackle/pull/5), [run](https://github.com/Jitha-afk/gruesome-spooky-cackle/actions/runs/41220920992) |

## One agent tried to break the site

PR #4 added a contract for the weekly file, because "an agent will refresh the content every week". Then a fifth agent tried to break the layout with odd weeks. The PR #4 description records 14 of them: long names, huge and negative counts, empty sections, 30 themes, repeated ranks, a byte-order mark and more.

The fixes, in [99a6e01](https://github.com/Jitha-afk/gruesome-spooky-cackle/commit/99a6e01):

- Ranks render by position, so a repeated or missing rank still reads 1 to n. The checker warns.
- A CVE that two themes cite counts once.
- Big numbers are compact, for example 1.2M. Long words wrap. Labels are cut at whole characters, so emoji and accented letters are not split.
- The build runs the week checker again and stops with the file, the field and the message.

The PR #4 description records the result. The odd weeks built with 0 errors, and 75 page loads had no sideways overflow. Five broken weeks stopped the build, with one line for each error.

## Agents that review agents

**PR #4.** Four auditor agents reviewed the first pass: design, motion, accessibility and mobile, and code. The description records these results:

- The week page went from 39,733 px to 5,127 px tall at 1440 px wide, and from 45,453 px to 6,944 px at 390 px.
- axe found 0 violations in 32 states.
- Contrast passes WCAG AA for every accent in light and dark mode, except the decorative `/` in the breadcrumb.
- No page scrolls sideways at eight widths from 320 to 1440 px.
- Tab reaches every control, and each control shows a focus ring.

**PR #5.** Four reviews checked the first pass: STE, design, accessibility and code.

- STE ([c1993f6](https://github.com/Jitha-afk/gruesome-spooky-cackle/commit/c1993f6)): the hero lead for each CVE count, the CVE table lead, the skip link, the empty states and the byline.
- Design ([8161b5d](https://github.com/Jitha-afk/gruesome-spooky-cackle/commit/8161b5d)): `background-clip: text` painted the underline of the gradient name at full strength, so the name got a border underline.
- Accessibility ([bcc28da](https://github.com/Jitha-afk/gruesome-spooky-cackle/commit/bcc28da)): the name underline now clears 3:1 in all 28 colour states.
- Code: no findings.

## What stops a bad week

Each week is one `data.json`. CI runs the unit tests, the week check and the build on each pull request, and again on `main`. A test failure or a week-check error stops the build, and nothing deploys. The live site stays as it was. The README has [the full list of checks](../README.md#how-it-works).

## What went wrong

- **Pages was off.** The agent could not turn on GitHub Pages, so the first deploy failed. Three minutes later, Jitesh ran the deploy by hand.
- **A very long page.** Before PR #4, the week page was 39,733 px tall. To reach the fifth theme, a reader scrolled past every post in the first four.
- **A claim given as a fact.** The first plain-English lead, in PR #5, gave the exploitation of 7 of the 8 CVEs as a fact. The report does not check claims, so the lead now names the sources.
- **A dead end.** PR #3 split a week into two files. Jitesh closed it without a merge, and each week stays one `data.json`.

<!-- [confirm] Lessons, in Jitesh's words, before they go public:
- Write the data contract before the prompt.
- Make failure safe: a bad week does not deploy.
- Ask one agent to try to break the work of another.
- Keep a person on the merge button.
-->
