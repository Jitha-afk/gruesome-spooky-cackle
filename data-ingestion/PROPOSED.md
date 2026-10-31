# Proposed fields

This page covers what next week's pipeline should start capturing. It has two parts:

1. **Supported fields that are still empty.** The site already shows these, so filling them needs no code change.
2. **Proposed fields.** These are typed in the schema but not shown yet. Capture them now, so that when the UI ships, past weeks already have the data.

Every proposed field is soft in the schema. A wrong or missing value is a warning in `pnpm check:week` and never fails the build. [`examples/complete.json`](examples/complete.json) shows each one filled in.

## Rules for every new field

- **Only write what a source says.** Do not infer a value.
  - Use `null` when you checked and found nothing. Leave the field out when you did not check.
  - For example, `kev: false` means "checked, and not in KEV".
- **Capture lookups at generation time.** KEV and EPSS change daily, and `meta.generated` records when the file was written.
- **Do not backfill published weeks** unless the value was captured at the time.
- **Plain text only.** Respect the limits in [FIELDS.md](FIELDS.md#length-limits).

## 1. Supported, still empty

Fill rates are from the week of 23–29 Oct 2026.

| Field | Filled | What it adds | How to capture |
| --- | --- | --- | --- |
| `meta.bottom_line` | no | An editor's lead in the hero and on the index. Today both fall back to a sentence built from the top theme. | One or two sentences, up to 240 characters: what a defender should take from the week. |
| `meta.method_steps` | no | Numbered steps in "How this brief is made", instead of one paragraph. | 3 to 7 steps, each a `title` with an optional `detail`. |
| `themes[].actions` | 0 of 10 | A "What to do" callout in each theme. This is the most useful field for defenders. | Up to 5 imperative sentences taken from advisories and vendor posts, for example "Patch to 9.4.2" or "Rotate session secrets". |
| `cve_details[].cvss` | 0 of 8 | A score chip on each CVE row. | The CVSS base score from NVD or the vendor advisory. |
| `cve_details[].advisory_url` | 0 of 8 | A link to the advisory on each CVE row. | The vendor advisory, or `https://nvd.nist.gov/vuln/detail/<id>`. |

## 2. Proposed

Priorities:

- **P1:** capture from next week. These are cheap to look up, and the UI for them is planned first.
- **P2:** capture when the source states them.
- **P3:** nice to have.

### P1

| Field | Type | Where to get it | Planned UI |
| --- | --- | --- | --- |
| `cve_details[].kev` | `true`, `false` or `null` | The [CISA KEV catalog](https://www.cisa.gov/known-exploited-vulnerabilities-catalog) JSON feed | A "KEV" chip on the CVE row and a KEV count in the exploitation chart. Also a cross-check for `exploited_in_wild`. |
| `cve_details[].epss` | A number from 0 to 1, or `null` | The [FIRST EPSS API](https://www.first.org/epss/api), `?cve=<id>` | A probability bar next to CVSS, and a sort key for the CVE table. |
| `cve_details[].patch` | `"available"`, `"mitigation"`, `"none"` or `null` | The vendor advisory | A patch chip on the CVE row. "No patch" becomes the loudest state after "exploited". |
| `cve_details[].vendor`, `cve_details[].product` | Strings | The advisory, or NVD CPE data | Group the CVE table by vendor and product. |
| `themes[].tags` | Up to 5 lowercase kebab-case strings | Editorial. Use the vocabulary below. | Tag chips on theme rows, a tag filter, and topic trends across weeks on the index. |
| `themes[].threat_actors` | Strings | Actor names exactly as a vendor source writes them | Actor chips, and an actor index across weeks. |
| `themes[].references` | Up to 5 objects: `title`, `url` and `kind` | Advisories, vendor research and government alerts that the sources link to | A "Read more" list in the theme body. `kind` is one of `advisory`, `research`, `government` or `media`. |

Use these tags where they fit, and add a new one only when none fits:

`ransomware`, `supply-chain`, `phishing`, `identity`, `edge-device`, `cloud`, `zero-day`, `rce`, `data-leak`, `botnet`, `malware`, `web-shell`, `ai`, `mobile`, `ics`, `npm`, `aitm`

### P2

| Field | Type | Where to get it | Planned UI |
| --- | --- | --- | --- |
| `themes[].severity` | `"critical"`, `"high"`, `"medium"` or `"low"` | Editorial, by the rubric below | A severity mark on theme rows and a "critical" KPI. |
| `themes[].first_seen` | `YYYY-MM-DD` | The earliest report in any source | Age on the theme row, for example "first seen 3 days before the week", to separate new stories from continuing ones. |
| `themes[].attack_techniques` | `{ id, name }` objects, with `id` like `T1190` or `T1505.003` | Techniques that the vendor sources name. Do not map them yourself. | Technique chips that link to [MITRE ATT&CK](https://attack.mitre.org/), and a heat strip for the week. |
| `cve_details[].published` | `YYYY-MM-DD` | NVD | The patch gap: days from publication to KEV or to the first exploitation report. |
| `cve_details[].kev_added` | `YYYY-MM-DD` | The KEV catalog, `dateAdded` | The same timeline. |
| `cve_details[].fixed_versions` | Strings | The vendor advisory | "Fixed in 9.4.2" on the CVE row. |

The severity rubric:

- **critical:** exploited, and pre-auth or on internet-facing gear with no patch
- **high:** exploited or trivially exploitable, with a patch
- **medium:** needs a precondition such as user action, credentials or local access
- **low:** awareness only

### P3

| Field | Type | Where to get it | Planned UI |
| --- | --- | --- | --- |
| `sources[].followers` | A whole number from 0 | The platform API, at capture time | Reach in the sources tooltip, and an attention metric weighted by reach. |
| `sources[].language` | BCP 47, for example `en` or `pt-BR` | Platform metadata | The language mix. It shows how much non-English coverage the brief reads. |

## Ideas that are not typed yet

To add any of these, follow [Adding a field](FIELDS.md#adding-a-field).

- **`affected.region_codes`:** ISO 3166-1 alpha-2 codes, or `"global"`. With these, a small region chart could replace the free-text `regions`.
- **`meta.corrections`:** errata for earlier weeks, as `{ week, text }`. The page would show them in the notes.
- **`themes[].ioc_feed`:** a link to indicators of compromise hosted elsewhere. Indicators do not belong in the page itself.
