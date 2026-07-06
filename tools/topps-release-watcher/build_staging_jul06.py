#!/usr/bin/env python3
"""
build_staging_jul06.py — renders the Jul 6 STAGED pages into drafts/ready/ (gitignored).
These do NOT go in the current push. Promote later with promote_ready.py.
"""
import os
import page_builder as pb
import content_staging_jul06 as content
from build_jul06 import load_shell_navjson

HERE = os.path.dirname(os.path.abspath(__file__))
READY = os.path.join(HERE, "drafts", "ready")

if __name__ == "__main__":
    os.makedirs(READY, exist_ok=True)
    shell = load_shell_navjson()
    print("== Building STAGED pages (drafts/ready/, gitignored) ==")
    for fn in content.PAGES:
        slug, meta_block, body = fn()
        html = pb.render_page(meta_block, body, shell)
        path = os.path.join(READY, f"{slug}.html")
        with open(path, "w", encoding="utf-8") as f:
            f.write(html)
        o, c = html.count("<div"), html.count("</div>")
        flag = "OK" if o == c else f"DIV MISMATCH (+{o-c})"
        print(f"  {slug}.html  {len(html):>6} bytes  div {o}/{c}  {flag}")
    print("Done. Promote with: python3 tools/topps-release-watcher/promote_ready.py")
