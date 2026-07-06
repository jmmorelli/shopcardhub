#!/usr/bin/env python3
"""
promote_ready.py — promotes STAGED pages from drafts/ready/ to the live site tree.

For each page in drafts/ready/:
  1. Copies it to the repo root.
  2. Adds its URL to sitemap.xml (idempotent).
  3. Adds its nav link to data/nav.json (idempotent; placement defined in NAV_PLACEMENT).
  4. Marks topps-tribute-baseball as "built" in known-releases.json if promoted.

Then regenerates the nav on every page:  node tools/build-nav.js
(run automatically if node is available; otherwise run it yourself).

After running: review, commit, push. Promote everything, or pass slugs to promote a subset:
  python3 tools/topps-release-watcher/promote_ready.py jacob-misiorowski-rookie-cards
"""
import os, sys, json, shutil, datetime, subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
READY = os.path.join(HERE, "drafts", "ready")
TODAY = datetime.date.today().isoformat()

# slug -> (category label, group label, nav link label)
NAV_PLACEMENT = {
    "jacob-misiorowski-rookie-cards": ("Baseball", "Players", "Jacob Misiorowski"),
    "pete-crow-armstrong-cards":      ("Baseball", "Players", "Pete Crow-Armstrong"),
    "chase-delauter-rookie-cards":    ("Baseball", "Players", "Chase DeLauter"),
    "topps-tribute-baseball":         ("Baseball", "Set Guides", "Topps Tribute — Jul 29"),
}

def promote(slugs):
    # 1) copy pages
    for slug in slugs:
        src = os.path.join(READY, f"{slug}.html")
        if not os.path.exists(src):
            print(f"  !! missing {src} — skipped"); continue
        shutil.copy2(src, os.path.join(REPO, f"{slug}.html"))
        print(f"  promoted {slug}.html")

    # 2) sitemap
    sm_path = os.path.join(REPO, "sitemap.xml")
    with open(sm_path, encoding="utf-8") as f:
        xml = f.read()
    for slug in slugs:
        loc = f"https://www.shopcardhub.com/{slug}"
        if loc in xml:
            continue
        entry = (f"  <url>\n    <loc>{loc}</loc>\n    <lastmod>{TODAY}</lastmod>\n"
                 f"    <changefreq>weekly</changefreq>\n    <priority>0.85</priority>\n  </url>\n")
        xml = xml.replace("</urlset>", entry + "</urlset>")
        print(f"  sitemap + /{slug}")
    with open(sm_path, "w", encoding="utf-8") as f:
        f.write(xml)

    # 3) nav.json
    nav_path = os.path.join(REPO, "data", "nav.json")
    with open(nav_path, encoding="utf-8") as f:
        nav = json.load(f)
    for slug in slugs:
        if slug not in NAV_PLACEMENT:
            continue
        cat_label, group_label, link_label = NAV_PLACEMENT[slug]
        href = f"/{slug}"
        for cat in nav["categories"]:
            if cat["label"] != cat_label:
                continue
            for grp in cat["groups"]:
                if grp["label"] != group_label:
                    continue
                if any(l["href"] == href for l in grp["links"]):
                    break
                grp["links"].append({"href": href, "label": link_label})
                print(f"  nav.json + {cat_label} > {group_label} > {link_label}")
    with open(nav_path, "w", encoding="utf-8") as f:
        json.dump(nav, f, indent=2, ensure_ascii=False)
        f.write("\n")

    # 4) known-releases (tribute only)
    if "topps-tribute-baseball" in slugs:
        kr_path = os.path.join(HERE, "known-releases.json")
        with open(kr_path, encoding="utf-8") as f:
            kr = json.load(f)
        if "topps-tribute-baseball" not in kr["built"]:
            kr["built"]["topps-tribute-baseball"] = "/topps-tribute-baseball"
            with open(kr_path, "w", encoding="utf-8") as f:
                json.dump(kr, f, indent=2, ensure_ascii=False)
                f.write("\n")
            print("  known-releases.json: tribute -> built")

    # 5) rebuild nav site-wide
    try:
        out = subprocess.run(["node", os.path.join(REPO, "tools", "build-nav.js")],
                             capture_output=True, text=True, cwd=REPO, timeout=120)
        print("  " + (out.stdout or out.stderr).strip())
    except Exception as e:
        print(f"  !! node not run ({e}) — run manually: node tools/build-nav.js")
    print("Done. Review locally, then commit + push.")

if __name__ == "__main__":
    args = sys.argv[1:]
    slugs = args if args else [f[:-5] for f in sorted(os.listdir(READY)) if f.endswith(".html")]
    print(f"Promoting: {', '.join(slugs)}")
    promote(slugs)
