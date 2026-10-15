# Overnight "To Green" build — night of Sep 1 2026

**State this morning:** three commits are on `main` in `~/Projects/shopcardhub` on the Mac, verified, NOT pushed (no GitHub credential is reachable from the session). Working tree clean.

## The one thing Mo has to do
```
cd ~/Projects/shopcardhub && git push origin main
```
Vercel deploys from that push (~1 min). Rollback if anything looks wrong: `git revert c0b6b17 3aeb08d 89a0e0d && git push`.
Housekeeping after the push (harmless leftovers from git running inside the sandbox): `rm -f .git/stale-* ; rm -rf .git/stale-rebase-apply.* ; rm -rf _to_delete/*.patch` (the patches are also attached in the chat as backups).

## Commits (105 files, +7,074 / −1,902)
1. `89a0e0d` Card photos everywhere + P0 mobile fixes
2. `3aeb08d` To-green pass: mobile, fonts, gtag deferral, Vault above the fold, photos on 55 more pages
3. `c0b6b17` Wow pass: holo-tilt hero cards, Bowman board table with FLIP, movers, alerts, photos on the last 15 pages

## What changed, by audit dimension

**Card imagery (was 1/10).** 72 of 78 public pages now show real card photos; the 6 without are about/privacy/affiliate-disclosure and three pre-release pages with nothing listed yet (bowman-football, topps-museum-collection, pokemon-30th). Mechanism: `js/card-img.js` — feed photo → `data/card-images.json` → name lookup through `/api/comps` → SVG placeholder; photos are verified eBay listing images hot-linked from eBay's CDN inside EPN links (every picture is an affiliate click, `customid=img-<surface>`). The nightly engine now stores a verified listing photo per card (`image` in prices-latest.json); `tools/price-engine/resolve-images.mjs` resolves on demand (16/20 watchlist cards; the 4 Sapphire cards are excluded by the engine's own "sapphire" title filter — pre-existing). Homepage: featured #1 card with holographic tilt + Top-5 thumbs. Bowman: photo in all 10 entries + a board table. Vault: thumbs in rows, photo in the card detail, name-based lookup for any card a visitor adds. Player pages (22): hero card + row thumbs. Set guides (20+): sealed-box hero. List pages: #1 card hero + thumbs. Track record, blog covers, indices, guides, calculator, supplies, research: done.

**Mobile (was 3/10).** All 78 pages: layout viewport = device width (the 507 px zoom-out on Bowman is gone — tables wrapped in `.tbl-scroll` site-wide), 0 console errors, 0 unwrapped tables. Homepage on a phone opens on the card panel (card first, headline second); hero tightened; Bowman stat tiles 3-col; Vault table within the first screen (iPhone 1,255 → 486 px; desktop 712 → 476 px); mobile Vault columns Card · Last · 7D · Trend; controls in a bottom sheet; 11 px text floor; muted gray lifted to 6.3:1.

**Bugs (was 4/10).** Mobile menu black-on-black CTA fixed (build-nav); Vault detail title stacking fixed; chart label collision fixed; comps 6 s timeout + skeleton rows; mega-menu solid; rank ghost no longer overprints price; ★ Track pill hidden on pages without a card (18 pages); paste-list modal that never opened fixed; indices ghost row fixed. Note: the "toast covering a table row" item in the audit was a full-page-screenshot artifact (the toast is bottom-fixed) — not a real bug.

**Motion (was 4/10).** Ghost marquee removed on 69 pages; homepage infinite loops 8 → 2 (ticker + live dot), Vault 1 → 0; global `prefers-reduced-motion`. Added: holo-tilt hero cards (pointer + gyro, one-shot sweep fallback), count-up KPIs, row flash + "since your last visit" (Vault + homepage signal board), FLIP rank shuffle with "was #n" badges on the Bowman board, chart draw-in + last-point pop, view transitions between pages, press-down on buttons.

**Vault funnel (was 5/10).** Hero CTA = Open the Vault; homepage "The Floor" shows sample rows/values to new visitors and real numbers to returners; Movers panel (30-day gainers/faders with photos) from the feed; Vault onboarding checklist replaces the demo banner; opt-in browser alerts when a card hits its target (`Notification` API, prompt only on click); og:image for /watchlist.

**Performance/SEO (was 7/10).** Fonts self-hosted (13 woff2, preload, 1-year immutable cache in vercel.json); gtag loads after first interaction/idle; canonical + og:image + JSON-LD on indices; JSON-LD on research/pokemon.

## Tunables
- Tilt strength: `SCH_IMG.TILT` in js/card-img.js (`max`, `mobile`, `near`, `sheen`, `rain`).
- Photo overrides: `data/card-images.json` (`node tools/price-engine/resolve-images.mjs` to refresh) or a `data-card-img="name:…"` key on any page.
- Site-wide overrides: `css/site-fixes.css`; re-run `node tools/apply-site-fixes.mjs` after adding pages (idempotent).

## Re-audit to flip the scoreboard
Run the same headless pass (iPhone 13 + 1440) and score against the exit criteria in `claude/cos-brief-to-green-2026-09-01.md`. Expected after deploy: Imagery 8–9, Mobile 8, Bugs 8, Motion 8, Vault funnel 7–8 (the "since your last visit" and alerts need real return visits to prove out), Performance 8. Remaining from the audit backlog: Bowman essays as expanders + weekly update as 3 bullets (#6), homepage section reorder (#8), player-page holo-tilt is on (hero size) — check it feels right on a real phone.
