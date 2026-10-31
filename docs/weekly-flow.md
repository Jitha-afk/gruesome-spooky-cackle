# Weekly flow

One week moves through these hands. Nobody merges early, and nobody force-pushes.

1. **cybersec** drops the week. That is `reports/<start>_<end>/brief.md` and the sibling `sources.json`. The format is [weekly-brief.md](weekly-brief.md). The body is empty unless there is extra commentary. cybersec does not add page code.

2. **engineer** opens a draft pull request that adds only that week's files.

3. **CI** checks every `brief.md`, renders the week, builds the site, and runs the tests. A schema error fails the build. Deploy does not run on the pull request.

4. **designer** reviews the draft and gives a verdict.

5. **engineer** marks the pull request ready for review after that verdict.

6. **Jitesh** merges `main`.

7. **Pages** deploys from `main`. The engineer verifies the published week.
