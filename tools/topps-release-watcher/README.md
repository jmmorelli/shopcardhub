# Topps Release Watcher

Weekly automation that checks the [Topps release calendar](https://www.topps.com/release-calendar)
for **new releases we don't have a page for yet**, then scaffolds draft pages using the site's
exact design system. **Nothing publishes automatically** — drafts wait for Mo + Claude to build
out and for Mo to push.

## Files

| File | What it is |
|------|-----------|
| `release-calendar-snapshot.json` | Last-known calendar state. Refreshed each run; used for diffing. |
| `known-releases.json` | `built` (Topps slug → our `/slug`) and `skip` (with reasons). The diff source of truth. |
| `page_builder.py` | The **engine**: extracts the verbatim shell (style/nav/footer/scripts) from `topps-series-1-2026.html` and renders new pages. Also holds affiliate constants + the nav-injection logic. |
| `content.py` | Full set-guide content for the 4 June-2026 releases (real Topps data). |
| `generate_release_pages.py` | Builds the 4 pages, propagates new nav links site-wide, updates `sitemap.xml`. |
| `topps_release_watcher.py` | The **watcher**: diffs calendar vs known, reports NEW releases, scaffolds draft stubs into `drafts/`. |
| `drafts/` | Auto-scaffolded stubs for new releases. **Gitignored, never deployed.** |

## How the weekly check works

1. **Refresh** the snapshot — fetch the calendar and update `release-calendar-snapshot.json`
   (the Monday scheduled task does this with `web_fetch`; or run `python3 topps_release_watcher.py --fetch`).
2. **Diff** — `python3 topps_release_watcher.py` lists releases on the calendar that are in neither
   `built` nor `skip`, and writes a `drafts/<slug>.html` stub for each.
3. **Build** — Claude fleshes a chosen draft into a full set-guide page (real checklist data, eBay
   search links, Topps Buy-Direct placeholder), moves it to the repo root, and adds it to
   `known-releases.json` `built`.
4. **Wire + review + push** — nav + sitemap updated, Mo reviews locally, Mo pushes. (The sandbox
   can commit but cannot push — Mo pushes from his own terminal.)

## Rebuilding / regenerating the 4 launch pages

```bash
cd ~/Desktop/shopcardhub
python3 tools/topps-release-watcher/generate_release_pages.py
```
Idempotent — won't duplicate nav links or sitemap entries. Edit `content.py` and re-run to update copy.

## Conventions baked in

- **Design**: shell is sliced verbatim from `topps-series-1-2026.html` → zero CSS drift.
- **Pricing**: these are unreleased products with no sold comps — copy is pre-release/qualitative
  with live **eBay search** links (which work before release). No invented hard prices.
- **Affiliate**: eBay = live EPN links (campaign 5339155990). Topps "Buy Direct" buttons are
  **placeholders** tagged `<!-- TOPPS AFFILIATE -->` — swap for Impact deep-links once the Topps
  program (account 7418994, *In Review*) is approved.
- **Approval gate**: no script pushes or deploys. Human-in-the-loop, always.

## Adding a new "skip" or "built"

Edit `known-releases.json`. Anything on the calendar not listed in either bucket shows up as NEW
on the next run.
