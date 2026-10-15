# Homepage Bowman-only guard + Aug 17 watcher merge — SHIPPED, verified live

> **Sep 11 2026 addendum — the homepage this doc describes no longer exists.** `/` became the Terminal dashboard (`4e96943`; see `claude/session-notes-2026-09-12-terminal.md`). The hero panel and its `index.html` script are gone. **The rule survives and is stronger:** the BOARD row in the Markets panel and the "Board movers · 30D" panel are Bowman-exclusive — `js/home.js` / `tools/build-home.mjs` filter to `cardType==='chrome-auto'` from `data/watchlist.json`, and the `board-bowman-only` check in `tools/audit-terminal.mjs` FAILs any push where a `tcg-single` card's id, label or distinctive word appears in those panels (or a tcg feed on `bowman-bangers.html`). The Pokémon set indices (PB26, CR26, AH26, PRIS25, DR25) do appear as set-level rows in the Markets panel — that is by design; the rule is about cards on the board, not indices.

Commit `63b91f9` (Mo pushed from ~/Projects/shopcardhub, Aug 17 ~2pm PT). Vercel deployed; live homepage verified rendering Bowman-only top 5 with the Aug 17 feed.

## Bug (Mo's report: Pokemon in the Bowman Bangers homepage area)
The 5 Pokemon SIRs added to the watchlist Aug 14 (all `boardHide:true`) carry the highest marks in the nightly feed — Aug 17: Umbreon ex $1,510, Mewtwo $383, Darkrai $260, Greninja $243, Lucario $213, all above Holliday's $191. /bowman-bangers' signal board filters `boardHide` via same-origin watchlist.json, but the homepage hero panel read the raw feed and took top 5 by price → panel went 100% Pokemon. **Hard content rule (Mo, Aug 17): the homepage Bowman Bangers area is Bowman-exclusive, always.**

## Fix
- `index.html`: panel now enriches from `/data/watchlist.json` (keeps only `cardType==='chrome-auto'` && `!boardHide`), with a `/1st Bowman Chrome Auto/` label-regex fallback if the watchlist fetch fails. Verified live: Holliday $191 / Kim $181 / Fischer $140 / Jump $115 / Arquette $113. *(Replaced Sep 11 by the dashboard's Markets BOARD row + Board movers panel, same filter, now gate-enforced.)*
- `tools/price-engine/snapshot-free.mjs`: feed rows in prices-latest.json now carry `cardType` + `boardHide` (starting next nightly run) so any future consumer can filter without a second fetch.

## Also in this ship — Aug 17 Topps release watcher output
Watcher ran locally on Mo's Mac the same morning (pre-Aug-14 template): built `topps-chrome-sapphire-2026.html` (drop Aug 26) + `topps-pristine-basketball.html` (pre-order Aug 25), nav + sitemap entries. I swapped its 2 topps.com CTAs for the Fanatics Impact link (`fanatics.93n6tx.net/AgROJo`, "Sealed · Fanatics" pattern from 667ac2f) per the Aug 14 Topps-retirement decision. **The one-off `content_augNN.py` watcher scripts predate the template fix — future watcher output needs the same topps.com check until the generator template is confirmed updated.**

## Repo sync saga (recurring trap — check first next time)
Mo's Mac was 5 commits behind origin (web-UI commits) AND dirty with the watcher run → `git pull` aborted. Resolution that worked: merge done in the cloud session (nav.json/sitemap three-way merged by hand — trivial since local only appended searchExtra/urlset entries; 70 per-page nav diffs regenerated via `node tools/build-nav.js`, never hand-merged), then on the Mac: `git stash -u && git pull` → 10 merged files written via device bridge → `build-nav` + `audit` + `add/commit/push`. Mo's stash@{0} (WIP on 3e09115) is now fully superseded — safe to `git stash drop`. Note: local watcher's json.dump ASCII-escapes unicode in nav.json — a text-level merge trap; always take upstream's version and re-append. *(Since Sep 9 the CoS deploys from a fresh clone via the deploy key in `Card Hub/deploy/` and never touches Mo's clone — CHARTER §5.)*

## Weekly scan status (Aug 17)
price-audit run #6 ran on schedule (Mon 15:00 UTC), green. Audit on the new tree: 0 FAIL / 29 WARN (the 2 new WARNs are word-label price cells on the watcher pages — same backlog class as the standing 27). Nightly price-snapshot healthy (run #21, feed day 2026-08-17, Justin Gonzalez still marking $0/thin).

## Open follow-ups
1. Word-label price cells now 29 WARNs (incl. 2 new watcher pages) — convert opportunistically. *(31 as of Sep 11.)*
2. Price stamps on the 5 fixed pages go stale ~Sep 2.
3. ~~Kit.com account still Priority 0 (TODO_NEXT.md).~~ *(Kit retired Sep 3 — MailerLite.)*
4. Confirm `tools/topps-release-watcher/topps_release_watcher.py` template really emits Fanatics links on next run.
