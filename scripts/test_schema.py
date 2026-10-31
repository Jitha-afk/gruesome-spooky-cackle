#!/usr/bin/env python3
"""Checker tests: strict YAML types, brief.md rules, and v1 data.json."""
import json, pathlib, sys, tempfile, textwrap, unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import check_schema_v1 as checker

ROOT = pathlib.Path(__file__).resolve().parents[1]
WEEK = ROOT / "reports" / "2026-10-23_2026-10-29"


class StrictYamlTest(unittest.TestCase):
    def test_quoted_date_and_numeric_id_stay_strings(self):
        flow = '{ "date_ist": "2026-10-23", "id": "00123", "count": 4, "flag": false, "quoted_flag": "false" }'
        flow_doc = checker.parse_yaml(flow)
        self.assertEqual(flow_doc["date_ist"], "2026-10-23")
        self.assertIsInstance(flow_doc["date_ist"], str)
        self.assertEqual(flow_doc["id"], "00123")
        self.assertIsInstance(flow_doc["id"], str)
        self.assertEqual(flow_doc["count"], 4)
        self.assertIs(flow_doc["flag"], False)
        self.assertEqual(flow_doc["quoted_flag"], "false")

        block = textwrap.dedent(
            """\
            date_ist: "2026-10-23"
            id: "00123"
            raw: 2026-10-22T18:30:00Z
            count: 4
            """
        )
        block_doc = checker.parse_yaml(block)
        self.assertEqual(block_doc["date_ist"], "2026-10-23")
        self.assertIsInstance(block_doc["date_ist"], str)
        self.assertEqual(block_doc["id"], "00123")
        self.assertIsInstance(block_doc["id"], str)
        self.assertEqual(block_doc["raw"], "2026-10-22T18:30:00Z")
        self.assertIsInstance(block_doc["raw"], str)
        self.assertIsInstance(block_doc["count"], int)

    def test_real_week_brief_passes_when_present(self):
        brief = WEEK / "brief.md"
        if not brief.exists():
            self.skipTest("brief.md is not in the week yet")
        self.assertEqual(checker.run_check(brief), 0)

    def test_v1_data_json_still_passes(self):
        data = WEEK / "data.json"
        if not data.exists():
            self.skipTest("data.json was removed after parity")
        self.assertEqual(checker.run_check(data), 0)

    def test_unknown_heading_fails_and_missing_heading_is_allowed(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            front = {
                "schema_version": 2,
                "meta": {
                    "title": "Brief",
                    "window": {"start": "2026-01-01 00:00 IST", "end": "2026-01-07 23:59 IST"},
                    "capture": {"x": "x", "youtube": "y"},
                    "counts": {"x_posts": 1, "youtube_videos": 0, "comments_analysed_top_themes": 1},
                    "methodology": "Count the posts.",
                    "inaccessible": ["One limit."],
                },
                "themes": [
                    {
                        "rank": 1,
                        "key": "alpha",
                        "name": "Alpha",
                        "short_name": "Alpha",
                        "summary": "Alpha led.",
                        "why": "Alpha matters.",
                        "affected": {"products": "Product.", "sectors": "Software.", "regions": "Global."},
                        "vendors": ["Vendor"],
                        "media": [],
                        "independent": [],
                        "distinct_accounts": 1,
                        "x_engagement": 1,
                        "youtube_views": 0,
                        "key_items": ["s1"],
                        "comments": {
                            "clusters": [
                                {"label": "Main", "sentiment_counts": {"positive": 1}, "samples": []}
                            ]
                        },
                        "cves": ["CVE-2026-1"],
                        "exploited_in_wild": False,
                        "cve_details": [
                            {
                                "id": "CVE-2026-1",
                                "exploited_in_wild": False,
                                "source_ids": ["s1"],
                                "basis": "The source names the CVE.",
                            }
                        ],
                    }
                ],
                "ranking": [{"key": "alpha", "name": "Alpha", "short_name": "Alpha", "accounts": 1}],
            }
            sidecar = {
                "sources": [
                    {
                        "id": "s1",
                        "platform": "X",
                        "type": "vendor",
                        "account": "Vendor",
                        "date_ist": "2026-01-02 01:00",
                        "text": "Patch CVE-2026-1 now.",
                        "url": "https://example.test/s1",
                        "engagement": 1,
                        "theme": "alpha",
                        "metrics": {"likes": 1},
                    }
                ],
                "samples": {"alpha": [[{"text": "A comment.", "url": "https://example.test/c", "parent_url": "https://example.test/s1", "date_ist": "2026-01-02 02:00"}]]},
            }
            brief = root / "brief.md"
            brief.write_text("---\n" + json.dumps(front) + "\n---\n")
            (root / "sources.json").write_text(json.dumps(sidecar))
            self.assertEqual(checker.run_check(brief), 0)
            brief.write_text("---\n" + json.dumps(front) + "\n---\n## missing\n\nNope.\n")
            self.assertEqual(checker.run_check(brief), 1)
            brief.write_text("---\n" + json.dumps(front) + "\n---\n## alpha\n\n## alpha\n")
            self.assertEqual(checker.run_check(brief), 1)


if __name__ == "__main__":
    unittest.main()
