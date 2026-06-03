import os, zipfile

build = r"C:\Users\joest\vessel-finance\_skill-build"
skills = ["notebooklm-workflow", "karpathy-guidelines", "obsidian-wiki-workflow"]
out_log = os.path.join(build, "_repackage_out.txt")

lines = []
for s in skills:
    folder = os.path.join(build, s)
    if not os.path.isdir(folder):
        lines.append(f"SKIP (no folder): {s}")
        continue
    out = os.path.join(build, s + ".skill")
    if os.path.exists(out):
        os.remove(out)
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        for root, _dirs, files in os.walk(folder):
            for f in files:
                full = os.path.join(root, f)
                # arcname relative to build dir, with forward slashes
                arc = os.path.relpath(full, build).replace(os.sep, "/")
                z.write(full, arc)
    # verify entries
    with zipfile.ZipFile(out) as z:
        entries = [i.filename for i in z.infolist()]
    lines.append(f"OK {out} -> {entries}")

with open(out_log, "w", encoding="utf-8") as fh:
    fh.write("\n".join(lines) + "\n")
print("\n".join(lines))
