"""Write every file in an mdxcn registry JSON at its own path (registry/default/...),
so the '@/registry/default/...' imports resolve. Usage: python3 scripts/extract-registry.py all.json"""
import json, os, sys, urllib.request
src = sys.argv[1] if len(sys.argv) > 1 else "https://mdxcn.dev/r/all.json"
d = json.load(urllib.request.urlopen(src) if src.startswith("http") else open(src))
for f in d["files"]:
    os.makedirs(os.path.dirname(f["path"]), exist_ok=True)
    open(f["path"], "w").write(f["content"])
print(len(d["files"]), "files")
