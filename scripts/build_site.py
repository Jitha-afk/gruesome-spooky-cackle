#!/usr/bin/env python3

from __future__ import annotations

import argparse
import base64
import html
import re
import shutil
import sys
from dataclasses import dataclass
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WINDOW = re.compile(r"^(\d{4})-(\d{2})-(\d{2})_(\d{4})-(\d{2})-(\d{2})$")
FORBIDDEN_OUT = {"out", "dist", ".output"}
MONTHS = (
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
)

SHEET = "#E6E9EE"
INK = "#1C2430"
TIDE = "#7A4208"
MIST = "#3E4C59"

PAGE_CSS = f"""
:root {{
  --sheet: {SHEET};
  --ink: {INK};
  --tide: {TIDE};
  --mist: {MIST};
}}
* {{ box-sizing: border-box; }}
html {{ background: var(--sheet); color: var(--ink); }}
body {{
  margin: 0;
  font-family: Spectral, "Iowan Old Style", Palatino, "Palatino Linotype", Georgia, serif;
  font-size: 1.125rem;
  line-height: 1.45;
}}
main {{
  width: min(34rem, 100%);
  margin: 0 auto;
  padding: 1.75rem 1.25rem 3.5rem;
}}
h1 {{
  margin: 0;
  font-size: 1.35rem;
  font-weight: 400;
  line-height: 1.2;
}}
.lede {{
  margin: 0.45rem 0 0;
  max-width: 36ch;
  color: var(--mist);
}}
.latest {{ margin: 1.6rem 0 0; }}
.latest a {{
  display: block;
  max-width: 100%;
  color: var(--tide);
  font-size: clamp(2.15rem, 5vw, 2.75rem);
  line-height: 1.12;
  overflow-wrap: anywhere;
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 0.14em;
}}
h2 {{
  margin: 2.4rem 0 0.2rem;
  font-size: 1.05rem;
  font-weight: 400;
}}
ul {{
  list-style: none;
  margin: 0;
  padding: 0;
}}
li a {{
  display: block;
  max-width: 100%;
  min-height: 44px;
  padding: 0.65rem 0;
  color: var(--ink);
  overflow-wrap: anywhere;
  text-decoration-thickness: 1px;
  text-underline-offset: 0.18em;
}}
a:focus-visible {{
  outline: 2px solid var(--tide);
  outline-offset: 3px;
}}
""".strip()


class BuildFailure(Exception):
    pass


@dataclass(frozen=True)
class Week:
    start: date
    end: date
    name: str
    source: Path


def format_day(value: date, *, with_year: bool) -> str:
    text = f"{value.day} {MONTHS[value.month - 1]}"
    if with_year:
        return f"{text} {value.year}"
    return text


def label(week: Week) -> str:
    start, end = label_parts(week)
    return f"{start} {end}"


def label_parts(week: Week) -> tuple[str, str]:
    same_year = week.start.year == week.end.year
    start = format_day(week.start, with_year=not same_year)
    end = format_day(week.end, with_year=True)
    return f"{start} to", end


def parse_window(name: str, display: str) -> tuple[date, date]:
    match = WINDOW.fullmatch(name)
    if match is None:
        raise BuildFailure(
            f"{display} is not a week window. Expected YYYY-MM-DD_YYYY-MM-DD."
        )
    try:
        start = date(int(match.group(1)), int(match.group(2)), int(match.group(3)))
        end = date(int(match.group(4)), int(match.group(5)), int(match.group(6)))
    except ValueError:
        raise BuildFailure(
            f"{display} has a date that is not a real calendar day."
        ) from None
    if end < start:
        raise BuildFailure(f"{display} ends before it starts.")
    return start, end


def load_weeks(reports: Path) -> tuple[Week, ...]:
    if not reports.is_dir():
        raise BuildFailure(f"{reports} is not a directory.")
    weeks: list[Week] = []
    for child in sorted(reports.iterdir(), key=lambda path: path.name):
        if child.name.startswith("."):
            continue
        if not child.is_dir():
            raise BuildFailure(
                f"{child} is not a week directory. Expected a directory named YYYY-MM-DD_YYYY-MM-DD."
            )
        start, end = parse_window(child.name, str(child))
        index = child / "index.html"
        if not index.exists():
            raise BuildFailure(f"{index} is missing.")
        if not index.is_file():
            raise BuildFailure(f"{index} is not a file.")
        weeks.append(Week(start, end, child.name, index))
    weeks.sort(key=lambda week: (week.end, week.start), reverse=True)
    return tuple(weeks)


def font_css(font_file: Path) -> str:
    if not font_file.is_file():
        raise BuildFailure(f"{font_file} is missing.")
    encoded = base64.b64encode(font_file.read_bytes()).decode("ascii")
    return (
        '@font-face{font-family:Spectral;'
        f'src:url("data:font/woff2;base64,{encoded}") format("woff2");'
        "font-weight:400;font-style:normal;font-display:block}"
    )


def render(weeks: tuple[Week, ...], face_css: str) -> str:
    if not weeks:
        body = "<h1>Weekly threat intel</h1>\n<p>No briefs yet.</p>"
    else:
        lines = [
            "<h1>Weekly threat intel</h1>",
            '<p class="lede">Open the newest brief.</p>',
            (
                f'<p class="latest"><a href="reports/{weeks[0].name}/">'
                f"{html.escape(label(weeks[0]))}</a></p>"
            ),
        ]
        if len(weeks) > 1:
            lines.append("<h2>Earlier</h2>")
            lines.append("<ul>")
            for week in weeks[1:]:
                lines.append(
                    f'<li><a href="reports/{week.name}/">{html.escape(label(week))}</a></li>'
                )
            lines.append("</ul>")
        body = "\n".join(lines)
    return (
        "<!DOCTYPE html>\n"
        '<html lang="en">\n'
        "<head>\n"
        '<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
        '<meta name="color-scheme" content="light">\n'
        "<title>Weekly threat intel</title>\n"
        "<style>\n"
        f"{face_css}\n"
        f"{PAGE_CSS}\n"
        "</style>\n"
        "</head>\n"
        "<body>\n"
        "<main>\n"
        f"{body}\n"
        "</main>\n"
        "</body>\n"
        "</html>\n"
    )


def publish(weeks: tuple[Week, ...], out: Path, face_css: str) -> None:
    if out.name in FORBIDDEN_OUT:
        raise BuildFailure(
            f"Refusing to write the site to {out.name}. That directory name is gitignored."
        )
    out.parent.mkdir(parents=True, exist_ok=True)
    temporary = out.parent / f".{out.name}.build"
    if temporary.exists():
        shutil.rmtree(temporary)
    temporary.mkdir()
    try:
        for week in weeks:
            destination = temporary / "reports" / week.name
            destination.mkdir(parents=True)
            (destination / "index.html").write_bytes(week.source.read_bytes())
        (temporary / "index.html").write_text(render(weeks, face_css), encoding="utf-8")
        if out.exists():
            shutil.rmtree(out)
        temporary.rename(out)
    except Exception:
        if temporary.exists():
            shutil.rmtree(temporary, ignore_errors=True)
        raise


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Build the weekly threat-intel site.")
    parser.add_argument("--reports", type=Path, default=ROOT / "reports")
    parser.add_argument("--out", type=Path, default=ROOT / "site")
    parser.add_argument(
        "--font",
        type=Path,
        default=ROOT / "assets" / "fonts" / "spectral-latin-400.woff2",
    )
    args = parser.parse_args(argv)
    try:
        weeks = load_weeks(args.reports)
        publish(weeks, args.out, font_css(args.font))
    except BuildFailure as failure:
        print(failure, file=sys.stderr)
        return 1
    noun = "week" if len(weeks) == 1 else "weeks"
    print(f"Wrote {len(weeks)} {noun} to {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
