#!/usr/bin/env python3
"""
build_jul13.py — one-shot builder for the Jul 13, 2026 weekly-scan pages.

Same approach as build_jul06.py: slices the <!-- NAV:START -->…<!-- NAV:END --> region
verbatim from the template (nav is single-source via data/nav.json + tools/build-nav.js).
Nav links for the new pages are added to data/nav.json and propagated with
`node tools/build-nav.js` afterwards.

Local only — nothing is committed or pushed. Mo reviews, then pushes.
"""
import os, datetime
import page_builder as pb
import content_jul13 as content

REPO = pb.REPO
TODAY = datetime.date.today().isoformat()
TEMPLATE = os.path.join(REPO, "topps-series-1-2026.html")

NEW_SITEMAP_URLS = [
    ("topps-flagship-football", 0.85),
    ("topps-pristine-baseball", 0.85),
]

def load_shell_navjson(template_path=TEMPLATE):
    with open(template_path, encoding="utf-8") as f:
        t = f.read()
    head_common = pb._slice(t, '<link rel="preconnect" href="https://fonts.googleapis.com">',
                            '</head>', include_end=True)
    nav = pb._slice(t, '<!-- NAV:START -->', '<!-- NAV:END -->', include_end=True)
    footer = pb._slice(t, '<footer>', '</html>', include_end=True)
    return {"head_common": head_common, "nav": nav, "footer": footer}

def build_pages():
    shell = load_shell_navjson()
    written = []
    for fn in content.PAGES:
        slug, meta_block, body = fn()
        html = pb.render_page(meta_block, body, shell)
        path = os.path.join(REPO, f"{slug}.html")
        with open(path, "w", encoding="utf-8") as f:
            f.write(html)
        opens = html.count("<div"); closes = html.count("</div>")
        written.append((slug, opens, closes, len(html)))
    return written

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
    print("== Building Jul 13 release pages ==")
    for slug, o, c, n in build_pages():
        flag = "OK" if o == c else f"DIV MISMATCH (+{o-c})"
        print(f"  {slug}.html  {n:>6} bytes  div {o}/{c}  {flag}")
    print("== Updating sitemap ==")
    a = update_sitemap()
    print(f"  added {len(a)} URLs" + (": " + ", ".join(a) if a else " (already present)"))
    print("Done. Now add nav links to data/nav.json and run `node tools/build-nav.js`.")
