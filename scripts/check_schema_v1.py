#!/usr/bin/env python3
"""Check a schema v1 threat-intel data file.
Usage: check_schema_v1.py <data.v1.json> [--base data.json] [--max-words 20]
--base is optional: the verbatim check against it runs only when --base is given, or when a sibling data.json exists that is not the data file itself.
Exit 0 = pass, 1 = failures. Passive-voice hits are warnings only."""
import argparse, json, pathlib, re, sys

ap = argparse.ArgumentParser()
ap.add_argument("data"); ap.add_argument("--base"); ap.add_argument("--max-words", type=int, default=20)
a = ap.parse_args()
P = pathlib.Path(a.data)
fails, warns = [], []
def fail(m): fails.append(m)

try:
    d = json.loads(P.read_text())
except Exception as e:
    print(f"FAIL invalid JSON: {e}"); sys.exit(1)
print("ok   valid JSON")

if d.get("schema_version") != 1: fail(f"schema_version is {d.get('schema_version')!r}, want 1")

S = {s["id"]: s for s in d.get("sources", [])}
themes = d.get("themes", [])
shorts = []
for t in themes:
    k = t.get("key")
    for f in ("short_name", "cves", "exploited_in_wild", "cve_details"):
        if f not in t: fail(f"{k}: missing {f}")
    sn = t.get("short_name")
    if not isinstance(sn, str) or not sn.strip(): fail(f"{k}: short_name empty")
    elif len(sn) > 12: fail(f"{k}: short_name {sn!r} is {len(sn)} chars (>12)")
    shorts.append(sn)
    if t.get("exploited_in_wild") not in (True, False, None): fail(f"{k}: exploited_in_wild not bool/null")
    cves, det = t.get("cves", []), t.get("cve_details", [])
    ids = [c.get("id") for c in det]
    if sorted(cves) != sorted(ids): fail(f"{k}: cves {cves} != cve_details ids {ids}")
    if len(set(cves)) != len(cves): fail(f"{k}: duplicate cves")
    for c in det:
        for f in ("id", "exploited_in_wild", "source_ids", "basis"):
            if f not in c: fail(f"{k}/{c.get('id')}: missing {f}")
        if c.get("exploited_in_wild") not in (True, False, None): fail(f"{k}/{c.get('id')}: exploited_in_wild not bool/null")
        if not isinstance(c.get("basis"), str) or not c["basis"].strip(): fail(f"{k}/{c.get('id')}: basis empty")
        if not c.get("source_ids"): fail(f"{k}/{c.get('id')}: no source_ids")
        for sid in c.get("source_ids", []):
            s = S.get(sid)
            if not s: fail(f"{k}/{c['id']}: source {sid} not in sources[]")
            elif c["id"] not in s.get("text", ""): fail(f"{k}/{c['id']}: source {sid} text does not name the CVE")
    flags = [c.get("exploited_in_wild") for c in det]
    if True in flags and t.get("exploited_in_wild") is not True: fail(f"{k}: a CVE is exploited but theme flag is not true")
if len(set(shorts)) != len(shorts): fail(f"theme short_names not unique: {shorts}")

tn = {t["key"]: t for t in themes}
rs = []
for r in d.get("ranking", []):
    if "short_name" not in r: fail(f"ranking {r.get('key')}: missing short_name")
    elif len(r["short_name"]) > 12: fail(f"ranking {r['key']}: short_name >12 chars")
    rs.append(r.get("short_name"))
    t = tn.get(r.get("key"))
    if t and (r.get("name") != t["name"] or r.get("short_name") != t.get("short_name")):
        fail(f"ranking {r['key']}: name/short_name differ from theme")
if len(set(rs)) != len(rs): fail(f"ranking short_names not unique: {rs}")

# verbatim: retrieved content must equal the base file
base_p = pathlib.Path(a.base) if a.base else P.with_name("data.json")
if not base_p.exists():
    if a.base: fail(f"--base file not found: {base_p}")
    else: print("skip verbatim check: no --base given and no sibling data.json")
elif base_p.resolve() == P.resolve():
    print("skip verbatim check: base is the data file itself")
else:
    b = json.loads(base_p.read_text())
    if b.get("sources") != d.get("sources"):
        bs = {s["id"]: s for s in b.get("sources", [])}
        diff = [i for i in set(bs) | set(S) if bs.get(i) != S.get(i)]
        fail(f"sources[] differ from {base_p.name}: {sorted(diff)[:10]} ({len(diff)} ids)")
    bt = {t["key"]: t for t in b.get("themes", [])}
    n = 0
    for k, t in tn.items():
        bc = bt.get(k, {}).get("comments", {}).get("clusters", [])
        dc = t.get("comments", {}).get("clusters", [])
        if len(bc) != len(dc): fail(f"{k}: cluster count differs from base"); continue
        for x, y in zip(bc, dc):
            for sx, sy in zip(x.get("samples", []), y.get("samples", [])):
                n += 1
                if (sx.get("text"), sx.get("url")) != (sy.get("text"), sy.get("url")): fail(f"{k}: sample differs: {sx.get('url')}")
            if len(x.get("samples", [])) != len(y.get("samples", [])): fail(f"{k}: sample count differs")
            if {kk: v for kk, v in x.items() if kk != "label"} != {kk: v for kk, v in y.items() if kk != "label"}:
                fail(f"{k}: cluster {y.get('label')!r} changed beyond its label")
    print(f"ok   compared {len(S)} sources and {n} comment samples against {base_p.name}" if not any("differ" in f for f in fails) else "")

# authored STE fields
ABBR = r"(?<!\bU\.S)(?<!\be\.g)(?<!\bi\.e)(?<!\betc)(?<!\bvs)"
SPLIT = re.compile(ABBR + r"(?<=[.!?])\s+(?=[\"'(A-Z0-9@.])")
PASSIVE = re.compile(r"\b(is|are|was|were|be|been|being)\s+\w+ed\b", re.I)
fields = []
for t in themes:
    k = t["key"]
    fields += [(f"{k}.name", t.get("name", "")), (f"{k}.summary", t.get("summary", "")), (f"{k}.why", t.get("why", ""))]
    fields += [(f"{k}.affected.{x}", v) for x, v in t.get("affected", {}).items()]
    fields += [(f"{k}.cluster[{i}].label", c.get("label", "")) for i, c in enumerate(t.get("comments", {}).get("clusters", []))]
    fields += [(f"{k}.{c['id']}.basis", c.get("basis", "")) for c in t.get("cve_details", [])]
m = d.get("meta", {})
fields.append(("meta.methodology", m.get("methodology", "")))
fields += [(f"meta.inaccessible[{i}]", x) for i, x in enumerate(m.get("inaccessible", []))]
fields += [(f"meta.also_observed[{i}]", x) for i, x in enumerate(m.get("also_observed", []))]
fields += [(f"ranking.{r['key']}.name", r.get("name", "")) for r in d.get("ranking", [])]
nsent, longest = 0, 0
for where, txt in fields:
    for s in SPLIT.split(txt.strip()):
        n = len(s.split()); nsent += 1; longest = max(longest, n)
        if n > a.max_words: fail(f"STE {where}: {n} words: {s!r}")
    for mm in PASSIVE.finditer(txt): warns.append(f"passive? {where}: {mm.group(0)!r}")
print(f"ok   STE length: {len(fields)} authored fields, {nsent} sentences, longest {longest} words" if not any(f.startswith("STE") for f in fails) else "")

for w in warns: print("warn", w)
for f in fails: print("FAIL", f)
print(f"{'PASS' if not fails else 'FAIL'}: {len(themes)} themes, {sum(len(t.get('cve_details', [])) for t in themes)} cve_details, {len(fails)} failures, {len(warns)} warnings")
sys.exit(1 if fails else 0)
