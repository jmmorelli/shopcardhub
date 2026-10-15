# SHIPPED — nav logo → home + BCB26 dead-link hotfix (Sep 12 2026)

**LIVE as origin/main `90a0f1b`** (`e6e4ee6..90a0f1b`, single commit "Nav logo links home on every page + BCB26 dead-link hotfix"). Pushed by Mo from his own clone (`~/Projects/shopcardhub`, now in sync with origin) via a CoS paste-block — the source edits were re-applied there directly after the patch-file download stalled; the archived patch below is now historical. IndexNow: 77 URLs → HTTP 200. Live-verified by curl (no browser, no beacons): the logo anchor renders on `/`, `/watchlist`, `/bowman-bangers`, `/cooper-flagg-rookie-cards`.

**Rollback:** `git revert 90a0f1b && git push` (reverts both fixes together — the nav div returns AND the 9 BCB26 dead links return; don't revert unless both are acceptable).

## What shipped
1. **Nav logo clickable sitewide (Mo's ask).** `tools/build-nav.js` emitted the brand as `<div class="logo">` — dead on all 94 pages (`data/nav.json`'s `brand.href:"/"` was ignored). Now `<a class="logo" href="/">`; NAV regenerated on all 94 pages. `tools/qa/interactions.cjs` gains a `COMMON` scenario list run on every page ("nav logo → home"; suite 134 → 139).
2. **BCB26 dead links on `/` hotfixed.** First feed with the 9 BCB26 seeds (Sep 12) exposed `js/home.js`'s fallback linking them to nonexistent `/card-*` pages. Slugless `-bcb26-` cards now link to `/bowman-chrome-2026-index`. `build-home.mjs` uses the same renderer → Monday's pre-render inherits it.

## Verification trail
Cloud clone: three gates FAIL 0 (audit-terminal WARN 0 with the Sep 12 feed; interaction suite 139 scenarios FAIL 0); logo click landed on `/` from 5 pages at 1440w + 390w via the local harness; `first-bowman.mjs` clean. Mo's Mac: all three gates re-run FAIL 0 before the push (audit-terminal WARN 1 feed-unavailable only).

## Bookkeeping still owed (Monday Sep 14)
- `data/pipeline.json` pushLog entry for `90a0f1b` at the next checkpoint (alongside the five Terminal pushes).
- If Monday's `build-card-pages` ends up CREATING BCB26 pages instead of deleting them, revert the `-bcb26-` special case in `js/home.js` (grep `-bcb26-`).
- Lesson for paste-blocks: never `git add *.html` in this repo — the glob hits gitignored `card-dungeon.html` and git aborts; use `git add -u`.
