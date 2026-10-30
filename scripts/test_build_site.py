#!/usr/bin/env python3

from __future__ import annotations

import subprocess
import sys
import tempfile
import unittest
from datetime import date
from pathlib import Path

import build_site

SCRIPT = Path(__file__).resolve().parent / "build_site.py"
FONT = build_site.ROOT / "assets" / "fonts" / "spectral-latin-400.woff2"
FACE = "/* face */"


def contrast(foreground: str, background: str) -> float:
    def channel(value: int) -> float:
        scaled = value / 255
        if scaled <= 0.04045:
            return scaled / 12.92
        return ((scaled + 0.055) / 1.055) ** 2.4

    def luminance(hex_color: str) -> float:
        red = int(hex_color[1:3], 16)
        green = int(hex_color[3:5], 16)
        blue = int(hex_color[5:7], 16)
        return 0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue)

    lighter = max(luminance(foreground), luminance(background))
    darker = min(luminance(foreground), luminance(background))
    return (lighter + 0.05) / (darker + 0.05)


class BuildSiteTest(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        self.reports = self.root / "reports"
        self.reports.mkdir()
        self.out = self.root / "site"

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def add_week(self, name: str, body: bytes = b"<p>brief</p>\n") -> Path:
        directory = self.reports / name
        directory.mkdir()
        index = directory / "index.html"
        index.write_bytes(body)
        return index

    def build(self) -> str:
        build_site.publish(build_site.load_weeks(self.reports), self.out, FACE)
        return (self.out / "index.html").read_text(encoding="utf-8")

    def test_newest_week_is_the_prominent_link(self) -> None:
        self.add_week("2026-10-01_2026-10-07", b"older")
        self.add_week("2026-10-23_2026-10-29", b"newer")
        self.add_week("2026-11-01_2026-11-02", b"newest")
        page = self.build()
        newest = page.index('href="reports/2026-11-01_2026-11-02/"')
        middle = page.index('href="reports/2026-10-23_2026-10-29/"')
        older = page.index('href="reports/2026-10-01_2026-10-07/"')
        self.assertLess(newest, middle)
        self.assertLess(middle, older)
        self.assertLess(page.index('class="latest"'), newest)
        self.assertIn("1 Nov to", page)
        self.assertIn("2 Nov 2026", page)
        self.assertIn("23 Oct to 29 Oct 2026", page)
        self.assertIn("<h2>Earlier</h2>", page)
        self.assertNotIn("<script", page)
        self.assertNotIn("https://", page)
        self.assertNotIn("http://", page)
        self.assertIn('width=device-width', page)

    def test_single_week_has_no_earlier_heading(self) -> None:
        self.add_week("2026-10-23_2026-10-29")
        page = self.build()
        self.assertIn('class="latest"', page)
        self.assertNotIn("<h2>Earlier</h2>", page)
        self.assertIn("23 Oct to", page)
        self.assertIn("29 Oct 2026", page)

    def test_cross_year_label(self) -> None:
        self.add_week("2026-12-28_2027-01-03")
        page = self.build()
        self.assertIn("28 Dec 2026 to", page)
        self.assertIn("3 Jan 2027", page)

    def test_week_file_is_copied_verbatim_and_siblings_are_not_published(self) -> None:
        body = b"<!doctype html><p>keep me &amp; exactly</p>\n"
        source = self.add_week("2026-10-23_2026-10-29", body)
        (source.parent / "notes.txt").write_text("secret", encoding="utf-8")
        self.build()
        copied = self.out / "reports" / "2026-10-23_2026-10-29" / "index.html"
        self.assertEqual(copied.read_bytes(), body)
        self.assertFalse((self.out / "reports" / "2026-10-23_2026-10-29" / "notes.txt").exists())
        published = [path.relative_to(self.out).as_posix() for path in self.out.rglob("*") if path.is_file()]
        self.assertEqual(
            published,
            ["index.html", "reports/2026-10-23_2026-10-29/index.html"],
        )

    def test_rebuild_drops_a_removed_week(self) -> None:
        self.add_week("2026-10-01_2026-10-07", b"gone")
        self.add_week("2026-10-23_2026-10-29", b"stay")
        self.build()
        removed = self.reports / "2026-10-01_2026-10-07"
        (removed / "index.html").unlink()
        removed.rmdir()
        self.build()
        self.assertFalse((self.out / "reports" / "2026-10-01_2026-10-07").exists())
        self.assertTrue((self.out / "reports" / "2026-10-23_2026-10-29" / "index.html").is_file())

    def test_empty_reports_says_there_are_no_briefs(self) -> None:
        page = self.build()
        self.assertIn("No briefs yet.", page)
        self.assertNotIn("reports/", page)
        self.assertEqual(list(self.out.rglob("reports")), [])

    def test_bad_folder_name_fails(self) -> None:
        (self.reports / "not-a-week").mkdir()
        with self.assertRaises(build_site.BuildFailure) as caught:
            build_site.load_weeks(self.reports)
        message = str(caught.exception)
        self.assertIn("not-a-week", message)
        self.assertIn("YYYY-MM-DD_YYYY-MM-DD", message)

    def test_impossible_day_fails(self) -> None:
        (self.reports / "2026-02-31_2026-03-02").mkdir()
        with self.assertRaises(build_site.BuildFailure) as caught:
            build_site.load_weeks(self.reports)
        self.assertIn("not a real calendar day", str(caught.exception))

    def test_end_before_start_fails(self) -> None:
        (self.reports / "2026-10-29_2026-10-23").mkdir()
        with self.assertRaises(build_site.BuildFailure) as caught:
            build_site.load_weeks(self.reports)
        self.assertIn("ends before it starts", str(caught.exception))

    def test_missing_index_fails(self) -> None:
        (self.reports / "2026-10-23_2026-10-29").mkdir()
        with self.assertRaises(build_site.BuildFailure) as caught:
            build_site.load_weeks(self.reports)
        message = str(caught.exception)
        self.assertIn("index.html", message)
        self.assertIn("missing", message)

    def test_stray_file_fails(self) -> None:
        (self.reports / "notes.txt").write_text("no", encoding="utf-8")
        with self.assertRaises(build_site.BuildFailure) as caught:
            build_site.load_weeks(self.reports)
        self.assertIn("notes.txt", str(caught.exception))

    def test_dot_directory_is_not_a_week(self) -> None:
        (self.reports / ".keep").mkdir()
        page = self.build()
        self.assertIn("No briefs yet.", page)

    def test_leap_day(self) -> None:
        self.add_week("2024-02-29_2024-03-01", b"leap")
        page = self.build()
        self.assertIn("29 Feb to", page)
        (self.reports / "2026-02-29_2026-03-01").mkdir()
        with self.assertRaises(build_site.BuildFailure):
            build_site.load_weeks(self.reports)

    def test_same_end_date_orders_the_later_start_first(self) -> None:
        self.add_week("2026-10-01_2026-10-29", b"long")
        self.add_week("2026-10-20_2026-10-29", b"short")
        page = self.build()
        self.assertLess(
            page.index("reports/2026-10-20_2026-10-29/"),
            page.index("reports/2026-10-01_2026-10-29/"),
        )

    def test_refuses_gitignored_output_names(self) -> None:
        for name in ("dist", "out", ".output"):
            target = self.root / name
            with self.assertRaises(build_site.BuildFailure) as caught:
                build_site.publish((), target, FACE)
            self.assertIn(name, str(caught.exception))
            self.assertFalse(target.exists())

    def test_colors_meet_contrast_and_are_on_the_page(self) -> None:
        self.add_week("2026-10-23_2026-10-29")
        page = self.build()
        self.assertGreaterEqual(contrast(build_site.TIDE, build_site.SHEET), 4.5)
        self.assertGreaterEqual(contrast(build_site.INK, build_site.SHEET), 4.5)
        self.assertGreaterEqual(contrast(build_site.MIST, build_site.SHEET), 4.5)
        for color in (build_site.SHEET, build_site.INK, build_site.TIDE, build_site.MIST):
            self.assertIn(color, page)

    def test_cli_failure_and_success(self) -> None:
        (self.reports / "nope").mkdir()
        failed = subprocess.run(
            [
                sys.executable,
                str(SCRIPT),
                "--reports",
                str(self.reports),
                "--out",
                str(self.out),
            ],
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(failed.returncode, 1)
        self.assertIn("nope", failed.stderr)
        self.assertIn("YYYY-MM-DD_YYYY-MM-DD", failed.stderr)
        self.assertFalse(self.out.exists())

        (self.reports / "nope").rmdir()
        self.add_week("2026-10-23_2026-10-29", b"seed-bytes")
        succeeded = subprocess.run(
            [
                sys.executable,
                str(SCRIPT),
                "--reports",
                str(self.reports),
                "--out",
                str(self.out),
                "--font",
                str(FONT),
            ],
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(succeeded.returncode, 0, succeeded.stderr)
        page = (self.out / "index.html").read_text(encoding="utf-8")
        self.assertIn("data:font/woff2;base64,", page)
        self.assertEqual(
            (self.out / "reports" / "2026-10-23_2026-10-29" / "index.html").read_bytes(),
            b"seed-bytes",
        )

    def test_label_for_a_same_year_window(self) -> None:
        week = build_site.Week(date(2026, 10, 23), date(2026, 10, 29), "n", Path("n"))
        self.assertEqual(build_site.label(week), "23 Oct to 29 Oct 2026")


if __name__ == "__main__":
    unittest.main()
