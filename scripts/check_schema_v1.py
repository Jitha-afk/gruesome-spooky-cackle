#!/usr/bin/env python3
"""Check a threat-intel week.

v1: check_schema_v1.py <data.json> [--base data.json] [--max-words 20]
v2: check_schema_v1.py <brief.md> [--base data.json] [--max-words 20]

brief.md is schema v2. YAML frontmatter holds every v1 field except sources[]
and comment samples. Those live in the sibling sources.json and are joined by
source id and by theme key + cluster index. The body is optional. A heading
must be exactly `## <theme key>`, each key at most once. A missing key is
allowed. An unknown key fails.

--base is optional. The verbatim check against it runs only when --base is
given, or when a sibling data.json exists that is not the file itself.
Exit 0 = pass, 1 = failures. Passive-voice hits are warnings only.
"""
import argparse, json, pathlib, re, sys

import yaml


class StrictLoader(yaml.SafeLoader):
    """Safe YAML with no timestamp type. Quoted scalars stay strings."""


StrictLoader.yaml_implicit_resolvers = {
    key: [item for item in items if item[0] != "tag:yaml.org,2002:timestamp"]
    for key, items in yaml.SafeLoader.yaml_implicit_resolvers.items()
}


def parse_yaml(text):
    return yaml.load(text, Loader=StrictLoader)


def split_frontmatter(text, path):
    normalized = text.lstrip("\ufeff")
    if not (normalized.startswith("---\n") or normalized.startswith("---\r\n")):
        raise ValueError(f"{path} must start with a YAML frontmatter fence")
    lines = normalized.splitlines()
    end = None
    for index, line in enumerate(lines[1:], start=1):
        if line == "---":
            end = index
            break
    if end is None:
        raise ValueError(f"{path} frontmatter is missing a closing fence")
    return "\n".join(lines[1:end]), "\n".join(lines[end + 1 :])


def join_brief(front, sidecar, path, fail):
    if not isinstance(front, dict):
        fail(f"{path} frontmatter must be a mapping")
        return None
    if "sources" in front:
        fail(f"{path} must not include sources. Put them in sources.json")
    if not isinstance(sidecar, dict):
        fail(f"{path} sources.json must be an object")
        return None
    sources = sidecar.get("sources")
    samples = sidecar.get("samples")
    if not isinstance(sources, list):
        fail("sources.json sources must be an array")
        sources = []
    if not isinstance(samples, dict):
        fail("sources.json samples must be an object keyed by theme key")
        samples = {}
    themes = front.get("themes")
    if not isinstance(themes, list):
        fail("themes must be an array")
        return {**front, "sources": sources}
    keys = set()
    for theme in themes:
        if isinstance(theme, dict) and isinstance(theme.get("key"), str):
            keys.add(theme["key"])
        for cluster in (theme or {}).get("comments", {}).get("clusters", []) if isinstance(theme, dict) else []:
            if isinstance(cluster, dict) and cluster.get("samples"):
                fail(f"{theme.get('key')}: comment samples belong in sources.json")
    for key in samples:
        if key not in keys:
            fail(f"sources.json samples key {key!r} is not a theme key")
    joined = []
    for theme in themes:
        if not isinstance(theme, dict):
            joined.append(theme)
            continue
        clusters = (theme.get("comments") or {}).get("clusters")
        if not isinstance(clusters, list):
            joined.append(theme)
            continue
        group = samples.get(theme.get("key"))
        if not isinstance(group, list):
            fail(f"sources.json samples.{theme.get('key')} is missing")
            group = []
        if len(group) != len(clusters):
            fail(
                f"sources.json samples.{theme.get('key')} has {len(group)} cluster lists, want {len(clusters)}"
            )
        new_clusters = []
        for index, cluster in enumerate(clusters):
            listing = group[index] if index < len(group) else []
            if not isinstance(listing, list):
                fail(f"sources.json samples.{theme.get('key')}[{index}] must be an array")
                listing = []
            new_clusters.append({**cluster, "samples": listing})
        comments = {**(theme.get("comments") or {}), "clusters": new_clusters}
        joined.append({**theme, "comments": comments})
    return {**front, "sources": sources, "themes": joined}


def check_body(body, keys, fail):
    if body is None or not str(body).strip():
        return
    current = None
    seen = set()
    preamble = []
    for line in str(body).splitlines():
        if line.startswith("##"):
            match = re.fullmatch(r"## (\S+)", line)
            if not match:
                fail(f"body heading must be exactly '## <theme key>': {line}")
                continue
            key = match.group(1)
            if key not in keys:
                fail(f"body heading {key!r} is not a theme key")
            elif key in seen:
                fail(f"body heading {key!r} appears more than once")
            seen.add(key)
            current = key
            continue
        if current is None:
            preamble.append(line)
    if "".join(preamble).strip():
        fail("body has text before a theme heading")


def load_document(path):
    text = path.read_text()
    if path.suffix == ".md":
        front_text, body = split_frontmatter(text, path)
        try:
            front = parse_yaml(front_text)
        except Exception as error:
            raise ValueError(f"invalid YAML: {error}") from error
        print("ok   valid YAML")
        sidecar_path = path.with_name("sources.json")
        if not sidecar_path.is_file():
            raise ValueError(f"missing sibling sources.json: {sidecar_path}")
        try:
            sidecar = json.loads(sidecar_path.read_text())
        except Exception as error:
            raise ValueError(f"invalid sources.json: {error}") from error
        return front, sidecar, body
    try:
        data = json.loads(text)
    except Exception as error:
        raise ValueError(f"invalid JSON: {error}") from error
    print("ok   valid JSON")
    return data, None, None


def run_check(path, base=None, max_words=20):
    path = pathlib.Path(path)
    fails, warns = [], []

    def fail(message):
        fails.append(message)

    try:
        front, sidecar, body = load_document(path)
    except ValueError as error:
        print(f"FAIL {error}")
        return 1

    kind = "v2" if sidecar is not None else "v1"
    if kind == "v2":
        data = join_brief(front, sidecar, path, fail)
    else:
        data = front
    if not isinstance(data, dict):
        fail("document is not an object")
        data = {}

    want = 2 if kind == "v2" else 1
    if data.get("schema_version") != want:
        fail(f"schema_version is {data.get('schema_version')!r}, want {want}")

    sources = {source["id"]: source for source in data.get("sources", []) if isinstance(source, dict) and "id" in source}
    themes = data.get("themes", [])
    shorts = []
    for theme in themes:
        key = theme.get("key")
        for field in ("short_name", "cves", "exploited_in_wild", "cve_details"):
            if field not in theme:
                fail(f"{key}: missing {field}")
        short = theme.get("short_name")
        if not isinstance(short, str) or not short.strip():
            fail(f"{key}: short_name empty")
        elif len(short) > 12:
            fail(f"{key}: short_name {short!r} is {len(short)} chars (>12)")
        shorts.append(short)
        if theme.get("exploited_in_wild") not in (True, False, None):
            fail(f"{key}: exploited_in_wild not bool/null")
        cves, details = theme.get("cves", []), theme.get("cve_details", [])
        ids = [entry.get("id") for entry in details]
        if sorted(cves) != sorted(ids):
            fail(f"{key}: cves {cves} != cve_details ids {ids}")
        if len(set(cves)) != len(cves):
            fail(f"{key}: duplicate cves")
        for entry in details:
            for field in ("id", "exploited_in_wild", "source_ids", "basis"):
                if field not in entry:
                    fail(f"{key}/{entry.get('id')}: missing {field}")
            if entry.get("exploited_in_wild") not in (True, False, None):
                fail(f"{key}/{entry.get('id')}: exploited_in_wild not bool/null")
            if not isinstance(entry.get("basis"), str) or not entry["basis"].strip():
                fail(f"{key}/{entry.get('id')}: basis empty")
            if not entry.get("source_ids"):
                fail(f"{key}/{entry.get('id')}: no source_ids")
            for source_id in entry.get("source_ids", []):
                source = sources.get(source_id)
                if not source:
                    fail(f"{key}/{entry['id']}: source {source_id} not in sources[]")
                elif entry["id"] not in source.get("text", ""):
                    fail(f"{key}/{entry['id']}: source {source_id} text does not name the CVE")
        flags = [entry.get("exploited_in_wild") for entry in details]
        if True in flags and theme.get("exploited_in_wild") is not True:
            fail(f"{key}: a CVE is exploited but theme flag is not true")
    if len(set(shorts)) != len(shorts):
        fail(f"theme short_names not unique: {shorts}")

    if kind == "v2":
        check_body(body, {theme.get("key") for theme in themes if isinstance(theme, dict)}, fail)

    by_key = {theme["key"]: theme for theme in themes if isinstance(theme, dict) and "key" in theme}
    rank_shorts = []
    for row in data.get("ranking", []):
        if "short_name" not in row:
            fail(f"ranking {row.get('key')}: missing short_name")
        elif len(row["short_name"]) > 12:
            fail(f"ranking {row['key']}: short_name >12 chars")
        rank_shorts.append(row.get("short_name"))
        theme = by_key.get(row.get("key"))
        if theme and (row.get("name") != theme["name"] or row.get("short_name") != theme.get("short_name")):
            fail(f"ranking {row['key']}: name/short_name differ from theme")
    if len(set(rank_shorts)) != len(rank_shorts):
        fail(f"ranking short_names not unique: {rank_shorts}")

    base_path = pathlib.Path(base) if base else path.with_name("data.json")
    if not base_path.exists():
        if base:
            fail(f"--base file not found: {base_path}")
        else:
            print("skip verbatim check: no --base given and no sibling data.json")
    elif base_path.resolve() == path.resolve():
        print("skip verbatim check: base is the data file itself")
    else:
        base_doc = json.loads(base_path.read_text())
        if base_doc.get("sources") != data.get("sources"):
            base_sources = {source["id"]: source for source in base_doc.get("sources", [])}
            diff = [item for item in set(base_sources) | set(sources) if base_sources.get(item) != sources.get(item)]
            fail(f"sources[] differ from {base_path.name}: {sorted(diff)[:10]} ({len(diff)} ids)")
        base_themes = {theme["key"]: theme for theme in base_doc.get("themes", [])}
        compared = 0
        for key, theme in by_key.items():
            base_clusters = base_themes.get(key, {}).get("comments", {}).get("clusters", [])
            clusters = theme.get("comments", {}).get("clusters", [])
            if len(base_clusters) != len(clusters):
                fail(f"{key}: cluster count differs from base")
                continue
            for left, right in zip(base_clusters, clusters):
                for sample, other in zip(left.get("samples", []), right.get("samples", [])):
                    compared += 1
                    if (sample.get("text"), sample.get("url")) != (other.get("text"), other.get("url")):
                        fail(f"{key}: sample differs: {sample.get('url')}")
                if len(left.get("samples", [])) != len(right.get("samples", [])):
                    fail(f"{key}: sample count differs")
                left_rest = {item: value for item, value in left.items() if item != "label"}
                right_rest = {item: value for item, value in right.items() if item != "label"}
                if left_rest != right_rest:
                    fail(f"{key}: cluster {right.get('label')!r} changed beyond its label")
        if not any("differ" in item for item in fails):
            print(f"ok   compared {len(sources)} sources and {compared} comment samples against {base_path.name}")

    abbr = r"(?<!\bU\.S)(?<!\be\.g)(?<!\bi\.e)(?<!\betc)(?<!\bvs)"
    split = re.compile(abbr + r"(?<=[.!?])\s+(?=[\"'(A-Z0-9@.])")
    passive = re.compile(r"\b(is|are|was|were|be|been|being)\s+\w+ed\b", re.I)
    fields = []
    for theme in themes:
        key = theme["key"]
        fields += [(f"{key}.name", theme.get("name", "")), (f"{key}.summary", theme.get("summary", "")), (f"{key}.why", theme.get("why", ""))]
        fields += [(f"{key}.affected.{name}", value) for name, value in theme.get("affected", {}).items()]
        fields += [
            (f"{key}.cluster[{index}].label", cluster.get("label", ""))
            for index, cluster in enumerate(theme.get("comments", {}).get("clusters", []))
        ]
        fields += [(f"{key}.{entry['id']}.basis", entry.get("basis", "")) for entry in theme.get("cve_details", [])]
    meta = data.get("meta", {})
    fields.append(("meta.methodology", meta.get("methodology", "")))
    fields += [(f"meta.inaccessible[{index}]", item) for index, item in enumerate(meta.get("inaccessible", []))]
    fields += [(f"meta.also_observed[{index}]", item) for index, item in enumerate(meta.get("also_observed", []))]
    fields += [(f"ranking.{row['key']}.name", row.get("name", "")) for row in data.get("ranking", [])]
    sentences, longest = 0, 0
    for where, text in fields:
        if not isinstance(text, str):
            continue
        for sentence in split.split(text.strip()):
            count = len(sentence.split())
            sentences += 1
            longest = max(longest, count)
            if count > max_words:
                fail(f"STE {where}: {count} words: {sentence!r}")
        for match in passive.finditer(text):
            warns.append(f"passive? {where}: {match.group(0)!r}")
    if not any(item.startswith("STE") for item in fails):
        print(f"ok   STE length: {len(fields)} authored fields, {sentences} sentences, longest {longest} words")

    for warning in warns:
        print("warn", warning)
    for item in fails:
        print("FAIL", item)
    print(
        f"{'PASS' if not fails else 'FAIL'}: {len(themes)} themes, "
        f"{sum(len(theme.get('cve_details', [])) for theme in themes)} cve_details, "
        f"{len(fails)} failures, {len(warns)} warnings"
    )
    return 1 if fails else 0


def main(argv=None):
    parser = argparse.ArgumentParser()
    parser.add_argument("data")
    parser.add_argument("--base")
    parser.add_argument("--max-words", type=int, default=20)
    args = parser.parse_args(argv)
    return run_check(args.data, args.base, args.max_words)


if __name__ == "__main__":
    sys.exit(main())
