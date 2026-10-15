# Session notes — Sep 11–12 2026: the Terminal (dashboard homepage) ships

Mo-initiated chat session, Mac-linked (dropped ~22:30 UTC Sep 11, back ~23:15). Chief of Staff running under full authority (CHARTER §3). **Mo, Sep 12: "I like it a lot compared to the old version."**

## What changed, in one paragraph
www.shopcardhub.com/ is no longer a hero + guide grid. It is a dashboard in the Seeking Alpha shape: a left rail (Home · Bowman Bangers board · Set indices · Auction Desk · Tuesday Tape · Guides by category · **Portfolios** with 5-day change pills · **Saved screens**), a Markets panel (the Bangers board 30-day composite plus all seven set indices, click a row to chart it), "From the engine last night" (the nightly run written as a feed — cards marked, gates, published BUY/SELL, index moves), an In Focus strip, Board movers · 30D, the Auction Desk top 5 vs mark, and a Screens table over every tracked card with σ / skew / excess kurtosis as columns. The same rail wraps `/watchlist`, `/indices`, `/auctions` and `/bowman-bangers`. The Vault got **portfolios** (named lists, portfolio header with value and 5-day change, tiles, warning banners generated from the numbers, "on the tape" and distribution panels). The seven engine-host player/set pages now open on a nine-cell stat band and the chart, with the essay folded underneath — Holliday went from ~14,000 px to ~6,300.

## Why (Mo's words, Sep 11)
The site was "getting a little sloppy or starting to look like AI slop, especially on individual pages for players." He showed his Seeking Alpha home + a family IRA portfolio page and asked for that layout with our colours; then "the main page just becomes that dashboard — kind of like Seeking Alpha?"; then "do what you need to do to get it live. Make agents if you need assistance." Diagnosis and feasibility: `claude/cos/terminal-vision-2026-09-11.md` (the slop was composition, not tokens — every colour and font is unchanged).

## Production, in order (all pushed via the fresh-clone recipe, three gates FAIL 0 on the Mac, curl-verified, IndexNow 200)
| Step | origin sha | What |
|---|---|---|
| 1 | `e5421cc` (+ `7287545`, `c88701e`) | Card-page composition on the 7 engine hosts; third gate `tools/audit-terminal.mjs` |
| 2 | `4e96943` (+ `771adac`, `4eff6c7`) | `/` = dashboard; `data/rail.json` + `build-rail.mjs`; `build-home.mjs` pre-renders every panel from the nightly feed; `js/home.js`, `js/engine-stats.js`; `tools/qa/render-local.cjs` |
| 3 | `7019c74` (+ `36afcb2`) | Portfolios in the Vault: `js/vault-schema.js` v2 (lists + listId, lossless migration, `tools/qa/vault-migration.test.cjs` 193/0), `vault-track.js` v3 Portfolio ▾, `css/terminal-shell.css` |
| 4 | `6f9a9cd` | Rail + shell on `/indices`, `/auctions`, `/bowman-bangers`; rail pills |
| hotfix | `e6e4ee6` (Sep 12) | Saved screens were dead to the eye (Mo caught it) — pre-rendered screens, scroll + flash, per-panel isolation; `tools/qa/interactions.cjs` click-through gate (134 scenarios) |

Rollbacks, newest first: `git revert e6e4ee6 …` (see `git log 6f9a9cd..e6e4ee6`) · `git revert 6f9a9cd` · `git revert 7019c74 36afcb2` · `git revert 4e96943 771adac 4eff6c7` · `git revert e5421cc 7287545 c88701e`.

## Agents created (CHARTER §2, room `claude/rooms/terminal.md`)
Terminal Builder (code) · Wiring Keeper (integrity of code + connections; owns the third gate and `tools/qa/`) · Terminal Product (weekly GA4 read of the terminal surfaces, one proposal a week) · Bug Sweeper (click-through suite daily on the tree, nightly on production with beacons aborted, weekly full crawl — created after Mo found the dead links: "we gotta make an agent to sweep this site and check for bugs").

## Rules that changed
- **Three gates before any push**: `audit-prices` · `audit-site` · `audit-terminal --feed <dir> --run-tests` (the last runs the migration test and the interaction suite). Standing one-liner in `tools/audit-terminal-README.md`.
- **Generated blocks, never hand-edited:** NAV, DEST, ENGINE, FOLD, RAIL, HOME:*. Monday build order: `build-bow26 --remark` → `build-engine-blocks` → `build-guide-fold` → `build-card-pages` → `build-home` → `build-rail` → `build-nav` → gates → push → `indexnow-ping`.
- Only `watchlist.html` and `js/vault-track.js` write the Vault. The rail reads the mirror, never writes.
- Homepage Bowman-only rule (Aug 17) is now a gate (`board-bowman-only`), not a code comment.
- Hammer closes stay off the public Home (closes count only) and portfolios stay device-local — both Mo's to change (NEEDS-MO).
- Lesson pinned in the room: a static gate proves wiring exists, not that it responds — every interactive surface ships with a scenario in the interaction suite.

## Numbers at ship
Mo's live rail: My cards 536 · $4,229 · Hunting 5. Auction Desk: 98 live · 50 under the mark. Page heights at 1440: `/` 3,109 · `/watchlist` 1,317 · `/indices` 1,799 · `/auctions` 1,489 · Holliday 6,333 (was 14,062) · Pitch Black 4,667 (was 16,389) · Bowman Bangers 14,410 (essay not yet folded — step 5).

## Still open
Step 5 (`rooms/terminal.md`): fold the Bangers essay; the 11 host-less `/card-*` pages; skew/kurtosis computed in the nightly engine (the band computes client-side today); Topps Update page (Sep 14). Terminal Product's first read Monday Sep 14 (returning % vs 7.5% baseline; Home must not become a lander). `data/pipeline.json` pushLog entries for the five pushes. Mo's roadmap idea — paid contributors, SA-style — filed in `claude/cos/ROADMAP.md` with its trigger. Mo's own clone is 12 commits behind (`git pull origin main`).

## Files that describe the OLD homepage and were amended today
`TODO_NEXT.md` (Terminal section added; "homepage positioning" item closed; Kit item marked retired), `claude/rooms/growth.md` (pinned decisions), `claude/homepage-bowman-guard-2026-08-17.md` (addendum), project `index.html` snapshot replaced with the live one, `Card Hub/Card-Hub-Agent-System-Reference.md` + `Bowman-Bangers-System-Reference.md` (changelog lines), `Card Hub/INDEX.md` (rows), memory. Older audit docs (`claude/ux-audit-2026-09-01.md`, `reaudit-*.md`, `overnight-to-green-*.md`) describe the pre-Terminal homepage on purpose — they are the baseline the Sep 14 audit re-scores against.
