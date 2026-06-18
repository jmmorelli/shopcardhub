#!/usr/bin/env python3
"""
generate_release_pages.py — Build the 4 Topps release pages + wire them into the site.

Run:  python3 tools/topps-release-watcher/generate_release_pages.py
Effects (all local — nothing is pushed; Mo reviews then pushes):
  1. Writes the 4 full set-guide pages to the repo root from content.py.
  2. Propagates the new nav/dropdown + mobile-drawer links across every existing page.
  3. Adds the 4 new URLs to sitemap.xml.
Idempotent: re-running won't duplicate nav links or sitemap entries.
"""
import os, glob, datetime
import page_builder as pb
import content

REPO = pb.REPO
TODAY = datetime.date.today().isoformat()

NEW_SITEMAP_URLS = [
    ("topps-inception-baseball", 0.85),
    ("topps-cosmic-chrome-football", 0.85),
    ("topps-chrome-cactus-jack-basketball", 0.85),
    ("topps-chrome-baseball-2026", 0.85),
]

def build_pages():
    shell = pb.load_shell()
    written = []
    for fn in content.PAGES:
        slug, meta_block, body = fn()
        html = pb.render_page(meta_block, body, shell)
        path = os.path.join(REPO, f"{slug}.html")
        with open(path, "w", encoding="utf-8") as f:
            f.write(html)
        # quick structural sanity: balanced <div>
        opens = html.count("<div"); closes = html.count("</div>")
        written.append((slug, opens, closes, len(html)))
    return written

def propagate_nav():
    skip = {"card-dungeon.html"}
    touched = []
    for path in glob.glob(os.path.join(REPO, "*.html")):
        name = os.path.basename(path)
        if name in skip:
            continue
        with open(path, encoding="utf-8") as f:
            html = f.read()
        new = pb.inject_nav(html)
        if new != html:
            with open(path, "w", encoding="utf-8") as f:
                f.write(new)
            touched.append(name)
    return touched

def update_sitemap():
    path = os.path.join(REPO, "sitemap.xml")
    with open(path, encoding="utf-8") as f:
        xml = f.read()
    added = []
    for slug, prio in NEW_SITEMAP_URLS:
        loc = f"https://www.shopcardhub.com/{slug}"
        if loc in xml:
            continue
        entry = (f"  <url>\n    <loc>{loc}</loc>\n"
                 f"    <lastmod>{TODAY}</lastmod>\n"
                 f"    <changefreq>weekly</changefreq>\n"
                 f"    <priority>{prio}</priority>\n  </url>\n")
        xml = xml.replace("</urlset>", entry + "</urlset>")
        added.append(slug)
    with open(path, "w", encoding="utf-8") as f:
        f.write(xml)
    return added

if __name__ == "__main__":
    print("== Building release pages ==")
    for slug, o, c, n in build_pages():
        flag = "OK" if o == c else f"DIV MISMATCH (+{o-c})"
        print(f"  {slug}.html  {n:>6} bytes  div {o}/{c}  {flag}")
    print("== Propagating nav site-wide ==")
    t = propagate_nav()
    print(f"  updated {len(t)} pages" + (": " + ", ".join(t) if t else " (already current)"))
    print("== Updating sitemap ==")
    a = update_sitemap()
    print(f"  added {len(a)} URLs" + (": " + ", ".join(a) if a else " (already present)"))
    print("Done. Review locally, then push.")
