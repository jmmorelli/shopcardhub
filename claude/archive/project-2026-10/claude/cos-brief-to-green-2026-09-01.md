# Chief of Staff brief — "To Green" program (ShopCardHub UX)

**From:** UX audit, 1 Sep 2026 (`claude/ux-audit-2026-09-01.md`, artifact: https://claude.ai/code/artifact/6d77b5b8-208e-4ddb-831c-94f31108e101)
**Owner's directive (Mo):** every score currently red or yellow becomes a standing priority until it is green (≥ 8/10). Card images go everywhere they can go.
**Status:** BUILT overnight Sep 1→2 — 3 commits on the Mac's `main`, awaiting `git push origin main` (no GitHub credential reachable from the session). Re-audit after deploy to flip scores officially. Build log: `claude/overnight-to-green-2026-09-01.md`.

## 1. Scoreboard and exit criteria

Green = 8/10. Each row lists the measurable condition that flips it green, so it can be re-audited the same way (headless Chromium, 1440 desktop + iPhone 13) and scored without judgment calls.

| Dimension | Audit → est. after deploy | Green when… | Findings |
|---|---|---|---|
| Card imagery | 🔴 1 → 🟢 8–9 (72/78 pages show photos) | Every card mention on home, /watchlist, /bowman-bangers, player pages and guide cards has an image (thumb ≥ 28 px in rows, ≥ 240 px in detail/hero); ≤ 5% of rendered cards fall back to placeholder; hero shows a real card | #1 |
| Mobile | 🔴 3 → 🟢 8 (78/78: viewport = device, 0 errors, 0 unwrapped tables) | Layout viewport = device width on all pages; home ≤ 8 screens, /bowman-bangers ≤ 15 screens at 390×664; first data row within 1 screen on home and /watchlist; 0 tap targets < 40 px in nav/CTAs; no text < 11 px | #2, #9 |
| Bugs / polish | 🟡 4 → 🟢 8 (all listed defects closed; the toast item was a screenshot artifact) | The listed defects closed and re-verified; no overlapping labels or invisible text on any audited page | #3, #10 |
| Motion quality | 🟡 4 → 🟢 8 (loops 8→2 on home, 1→0 on Vault; 7 of 8 informative motions shipped) | ≤ 2 infinite loops site-wide; global reduced-motion; ≥ 5 of the 8 informative motions shipped | #5 |
| Vault funnel | 🟡 5 → 🟢 8 (all four exit conditions built) | Live Vault strip in the homepage fold; /watchlist table above the fold on desktop and within 1 screen on mobile; onboarding checklist replaces demo banner; "since your last visit" module live | #4, #7, #8 |
| Performance | 🟡 7 → 🟢 8 | gtag deferred to idle/interaction; fonts self-hosted + preloaded; canonical/og:image/JSON-LD present on all audited pages | tech table |
| Visual identity | 🟢 8 | Hold. | — |
| Content credibility | 🟢 8 | Hold. | — |

## 2. Priority stack

**P0 — DONE (Sep 1 night).** Bug sweep; tables wrapped site-wide (`.tbl-scroll`); mobile hero/tiles; muted text 6.3:1; 11 px floor; global reduced-motion; ghost marquee removed on 69 pages.

**P1 — DONE except two items.** Card image pipeline live on 72 pages (engine photo + `data/card-images.json` + name lookup + placeholder); holo-tilt hero; Vault above the fold with onboarding, mobile columns, bottom sheet, count-up, row flash; Bowman board table with FLIP. **Still open:** Bowman essays as expanders + weekly update as three bullets (#6).

**P2 — DONE except three items.** "Since your last visit", Movers, Notification-API alerts, FLIP, view transitions, chart draw-in, skeletons, gtag/fonts/SEO, CTA hierarchy, context-aware ★ Track. **Still open:** homepage section reorder (#8), hover lift on guide cards, sticky prospect chip bar on Bowman mobile.

## 3. Card image pipeline (as built)

- **Engine:** `tools/price-engine/snapshot-free.mjs` keeps a verified listing photo per card (`pickImage`, middle of the mark window) → `image` in `prices-latest.json`, refreshed nightly.
- **On demand:** `node tools/price-engine/resolve-images.mjs` → `data/card-images.json` (16/20 watchlist cards; the 4 Sapphire cards are excluded by the engine's own "sapphire" title filter — pre-existing).
- **Front end:** `js/card-img.js` renders any `<span data-card-img="ebay:<id> | name:<seller-style title>" data-card-size="thumb|row|card|hero">` — feed photo → local json → name lookup via `/api/comps` (cached 7 days in localStorage) → SVG placeholder. Photos are hot-linked from `i.ebayimg.com` inside EPN links (`customid=img-<surface>`), so every picture is an affiliate click. `data-card-tilt="1"` or size `hero` adds the holographic tilt.
- **Caveat:** `/api/comps` is pinned to eBay category 212 (sports cards), so Pokémon `name:` lookups only hit mis-categorised listings; Pokémon cards use `ebay:` keys where the engine tracks them, placeholders otherwise.
- COMC scans were not used (Mo: the point is visitors seeing cards, not his inventory).

## 4. Cadence

- Re-run the audit after deploy; update the scoreboard here. Weekly one-line status per dimension in `TODO_NEXT.md`.
