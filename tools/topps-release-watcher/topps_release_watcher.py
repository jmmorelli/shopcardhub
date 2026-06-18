#!/usr/bin/env python3
"""
topps_release_watcher.py — Weekly Topps release-calendar watcher for ShopCardHub.

WHAT IT DOES
  Diffs the Topps release calendar against what the site already covers, reports any
  NEW releases that have no page yet, and scaffolds a draft stub (using the site's exact
  design shell) for each new one. It NEVER pushes, deploys, or publishes — drafts land in
  ./drafts/ for Mo + Claude to flesh out and approve.

INPUTS
  release-calendar-snapshot.json  — last-known calendar state (refreshed each run)
  known-releases.json             — {built: {toppsSlug: ourHref}, skip: {toppsSlug: reason}}

USAGE
  # Normal weekly run (reads the snapshot, which the Monday Claude run refreshes first):
  python3 topps_release_watcher.py
  # Best-effort live fetch of the calendar before diffing (updates the snapshot):
  python3 topps_release_watcher.py --fetch

OUTPUT
  Prints a scannable report and writes drafts/<slug>.html stubs for new releases.
"""
import os, re, sys, json, datetime
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import page_builder as pb

SNAPSHOT = os.path.join(HERE, "release-calendar-snapshot.json")
KNOWN = os.path.join(HERE, "known-releases.json")
DRAFTS = os.path.join(HERE, "drafts")
CALENDAR_URL = "https://www.topps.com/release-calendar"

SPORT_HINTS = [("baseball","baseball"),("football","football"),("basketball","basketball"),
               ("ucc","soccer"),("uwcl","soccer"),("soccer","soccer"),("ufc","ufc"),
               ("marvel","entertainment"),("disney","entertainment")]

def guess_sport(slug, title=""):
    s = (slug + " " + title).lower()
    for key, sport in SPORT_HINTS:
        if key in s:
            return sport
    return "other"

# ── optional best-effort live fetch (default path is the snapshot) ───────────
def fetch_calendar():
    import urllib.request
    req = urllib.request.Request(CALENDAR_URL, headers={"User-Agent": "Mozilla/5.0 ShopCardHubWatcher"})
    html = urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "ignore")
    # release tiles link to /pages/<slug>; capture unique product links
    slugs = []
    for m in re.finditer(r'href="/pages/([a-z0-9\-]+)"', html):
        sl = m.group(1)
        if sl not in slugs and sl not in ("supplies-apparel", "promotions"):
            slugs.append(sl)
    if not slugs:
        return None
    return [{"slug": s, "title": s.replace("-", " ").title(), "date": "", "sport": guess_sport(s)} for s in slugs]

def load_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)

# ── draft scaffold (uses the real site shell) ────────────────────────────────
def scaffold_draft(rel, shell):
    slug, title = rel["slug"], rel["title"]
    sport = rel.get("sport") or guess_sport(slug, title)
    date = rel.get("date", "")
    accent = {"baseball":"cyan","basketball":"cyan","football":"orange"}.get(sport, "cyan")
    meta_block = (f'  <title>{title} — Set Guide (DRAFT) | ShopCardHub</title>\n'
                  f'  <meta name="description" content="DRAFT scaffold for {title}. Flesh out before publishing.">\n'
                  f'  <link rel="canonical" href="https://www.shopcardhub.com/{slug}">')
    body = f'''<section class="hero" style="border-top:none; padding-bottom:0;">
  <div class="container">
    <div class="hero-eyebrow">Set Guide &middot; {sport.title()} &middot; DRAFT</div>
    <h1>{title}<br><em>Draft Scaffold</em></h1>
    <p class="hero-sub">Auto-generated stub from the Topps release calendar. Fill in: at-a-glance stats, the chase table, the parallel rainbow, box math, where-to-buy, watch list, and related links &mdash; then remove the DRAFT banners.</p>
    <div class="hero-meta"><span>{('Releases ' + date) if date else 'Date TBD'}</span><span>Source: Topps calendar</span><span>Status: NEEDS BUILD</span></div>
  </div>
</section>
  <div class="container">
  <div class="alert-bar red" style="margin-top:48px;">
    &#128679; <strong>DRAFT &mdash; not for publishing.</strong> This is an auto-scaffold for <strong>{title}</strong>. Replace with real set data from
    <a href="https://www.topps.com/pages/{slug}" target="_blank" rel="noopener">topps.com/pages/{slug}</a>, then move to the repo root and add to nav + sitemap.
  </div>
  <section style="border-top:none; padding-top:20px;">
    <div class="set-banner">
      <div class="entry-tag {accent}" style="margin-bottom:8px;">Topps &middot; {sport.title()}</div>
      <h2 style="margin-bottom:4px;">{title} — At a Glance</h2>
      <p style="font-size:15px; color:var(--text-dim);">TODO: base set size, format, top chase, autos, parallels, MSRP/secondary.</p>
      <div class="set-banner-grid">
        {pb.banner_stat("Release Date", date or "TBD", "green")}
        {pb.banner_stat("Base Set", "TODO")}
        {pb.banner_stat("Top Chase", "TODO", "gold")}
        {pb.banner_stat("Launch", "Cart / EQL?", "")}
      </div>
    </div>
  </section>
  <section>
    <div class="section-eyebrow {accent}">Build Checklist</div>
    <h2>Sections To Complete</h2>
    <div class="avoid-list" style="border-left-color:var(--accent);">
      {pb.avoid_item("<strong>Chase table</strong> &mdash; real subsets/inserts/autos from the official checklist + eBay search links.").replace("&#10007;","&#9633;")}
      {pb.avoid_item("<strong>Parallel rainbow</strong> &mdash; confirmed serial numbering tiers.").replace("&#10007;","&#9633;")}
      {pb.avoid_item("<strong>Box ROI</strong> &mdash; format, hit rate, ROI-calculator link.").replace("&#10007;","&#9633;")}
      {pb.avoid_item("<strong>Where to buy</strong> &mdash; singles vs sealed; Topps Buy-Direct placeholder tagged.").replace("&#10007;","&#9633;")}
      {pb.avoid_item("<strong>Watch list + Avoid + Related</strong> &mdash; cross-link existing pages.").replace("&#10007;","&#9633;")}
    </div>
  </section>
  </div>'''
    html = pb.render_page(meta_block, body, shell)
    os.makedirs(DRAFTS, exist_ok=True)
    out = os.path.join(DRAFTS, f"{slug}.html")
    with open(out, "w", encoding="utf-8") as f:
        f.write(html)
    return out

def main():
    do_fetch = "--fetch" in sys.argv
    snap = load_json(SNAPSHOT)
    if do_fetch:
        try:
            live = fetch_calendar()
            if live:
                # merge live slugs into snapshot, preserving known dates/titles
                by_slug = {r["slug"]: r for r in snap["releases"]}
                merged = []
                for r in live:
                    merged.append(by_slug.get(r["slug"], r))
                snap["releases"] = merged
                snap["captured"] = datetime.date.today().isoformat()
                with open(SNAPSHOT, "w", encoding="utf-8") as f:
                    json.dump(snap, f, indent=2)
                print(f"[--fetch] refreshed snapshot: {len(merged)} releases on calendar")
            else:
                print("[--fetch] no release links parsed; using existing snapshot")
        except Exception as e:
            print(f"[--fetch] live fetch failed ({e}); using existing snapshot")

    known = load_json(KNOWN)
    built, skip = known["built"], known["skip"]
    releases = snap["releases"]

    new = [r for r in releases if r["slug"] not in built and r["slug"] not in skip]

    print("\n" + "=" * 64)
    print(f"TOPPS RELEASE WATCHER — {datetime.date.today().isoformat()}")
    print(f"Calendar snapshot: {snap.get('captured')}  ({len(releases)} releases)")
    print("=" * 64)
    print(f"\nCovered (built): {len(built)}   Skipped: {len(skip)}   NEW: {len(new)}")

    if not new:
        print("\nNo new releases need a page. Nothing to scaffold.")
        return

    shell = pb.load_shell()
    print("\nNEW RELEASES NEEDING A PAGE:")
    for r in sorted(new, key=lambda x: x.get("date", "")):
        sport = r.get("sport") or guess_sport(r["slug"], r["title"])
        path = scaffold_draft(r, shell)
        print(f"  • {r.get('date','TBD'):<11} {r['title']}")
        print(f"      sport: {sport}   draft: {os.path.relpath(path, pb.REPO)}")
    print("\nDrafts scaffolded in tools/topps-release-watcher/drafts/ (gitignored, NOT deployed).")
    print("Next: Claude fleshes a draft into a full page → moves to repo root → Mo reviews → push.")

if __name__ == "__main__":
    main()
