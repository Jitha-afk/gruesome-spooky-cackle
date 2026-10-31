"""Post-process a Next static export into zero-JS HTML.
mdxcn graphs are text; JS only runs the 220ms entrance. SSR ships the 'hidden'
variant inline (opacity:0 / translateY(8px)), so we drop those and every script."""
import re, sys, pathlib
src, dst = map(pathlib.Path, sys.argv[1:3])
import shutil; shutil.rmtree(dst, ignore_errors=True); shutil.copytree(src, dst)
for f in dst.rglob("*.html"):
    h = f.read_text()
    h = re.sub(r"<script\b[^>]*>.*?</script>", "", h, flags=re.S)
    h = re.sub(r'<link[^>]+rel="(?:modulepreload|preload)"[^>]+as="script"[^>]*>', "", h)
    h = re.sub(r'<link[^>]+as="script"[^>]*/?>', "", h)

    # Only inside style attributes, so report text that mentions opacity:0 stays intact.
    def clean(m):
        s = re.sub(r"opacity:0(?![.\d]);?", "", m.group(1))
        s = re.sub(r"transform:translateY\(8px\);?", "", s)
        return f' style="{s}"' if s.strip() else ""

    h = re.sub(r' style="([^"]*)"', clean, h)
    f.write_text(h)
for f in dst.rglob("*.txt"): f.unlink()
for f in (dst / "_next").rglob("*.js"): f.unlink()
print("zero-JS export at", dst)
